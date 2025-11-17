import express from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { AuthResponseDto, RefreshResponseDto, ErrorResponseDto } from './dto/auth.dto.js';

const router = express.Router();
const prisma = new PrismaClient();

const ITERATIONS = 120000;
const KEYLEN = 64;
const DIGEST = "sha512";


function hashPassword(plain) {
    const salt = crypto.randomBytes(16).toString("hex");
    const derived = crypto
        .pbkdf2Sync(plain, salt, ITERATIONS, KEYLEN, DIGEST)
        .toString("hex");
    return `pbkdf2-${DIGEST}$${ITERATIONS}$${salt}$${derived}`;
}


function verifyPassword(plain, stored) {
  const parts = stored.split('$');
  const isNewFormat = parts.length === 4;

  const iterations = parseInt(isNewFormat ? parts[1] : parts[0], 10);
  const salt = isNewFormat ? parts[2] : parts[1];
  const hash = isNewFormat ? parts[3] : parts[2];

  if (!iterations || !salt || !hash) return false;

  const derived = crypto.pbkdf2Sync(plain, salt, iterations, KEYLEN, DIGEST).toString('hex');

  return crypto.timingSafeEqual(
    Buffer.from(hash, 'hex'),
    Buffer.from(derived, 'hex')
  );
}

const ACCESS_TTL = "15m";
const REFRESH_TTL = "7d";

function expToDate(expSeconds) {
  return new Date(expSeconds * 1000);
}

function newJti() {
  return crypto.randomBytes(16).toString('hex');
}

//Fonctions de création de token 
function signAccess(payload) {
    return jwt.sign({ ...payload, jti: newJti() }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: ACCESS_TTL,
    });
}
function signRefresh(payload) {
    return jwt.sign({ ...payload, jti: newJti() }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: REFRESH_TTL,
    });
}

function setRefreshCookie(res, token) {
    res.cookie("refresh_token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/", 
        maxAge: 1000 * 60 * 60 * 24 * 7,
    });
}

router.post("/signup", async (req, res, next) => {
  /**
   * @swagger
   * /api/auth/signup:
   *   post:
   *     summary: Register a new user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SignupRequestDto'
   *     responses:
   *       201:
   *         description: User created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponseDto'
   *       400:
   *         description: Invalid data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponseDto'
   *       409:
   *         description: Email already in use
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponseDto'
   */
    try {
        const { email, password, name } = req.body || {};
        if (!email || !password)
            return res
                .status(400)
                .json(new ErrorResponseDto("email and password are required"));


        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists)
            return res.status(409).json(new ErrorResponseDto("Email already used"));


        const hashed = hashPassword(password);

        const user = await prisma.user.create({
            data: { email, password: hashed, name },
        });

        const accessToken = signAccess({ sub: user.id, role: user.role || "user" });
        const refreshToken = signRefresh({ sub: user.id });
        const rtPayload = jwt.decode(refreshToken);
        try {
          await prisma.refreshSession.create({ 
            data: {
              id: rtPayload.jti,
              userId: user.id,
              userAgent: req.get('user-agent') || null,
              ip: req.ip || null,
              expiresAt: expToDate(rtPayload.exp)
            }
          });
        } catch (e) {
          console.error('Failed to persist refresh session on signup:', e);
        }

        setRefreshCookie(res, refreshToken);
        res.status(201).json(new AuthResponseDto(user, accessToken));
    } catch (e) {
        next(e);
    }
});

router.post("/login", async (req, res, next) => {
  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Login a user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequestDto'
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponseDto'
   *       400:
   *         description: Invalid data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponseDto'
   *       401:
   *         description: Invalid credentials
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponseDto'
   */
    try {

        const { email, password } = req.body || {};
        if (!email || !password)
            return res
                .status(400)
                .json(new ErrorResponseDto("email and password are required"));


        const user = await prisma.user.findUnique({ where: { email } });
        if (!user)
            return res
                .status(401)
                .json(new ErrorResponseDto("Invalid credentials"));


        const ok = verifyPassword(password, user.password);

        if (!ok)
            return res
                .status(401)
                .json(new ErrorResponseDto("Invalid credentials"));

        const accessToken = signAccess({ sub: user.id, role: user.role || "user" });
        const refreshToken = signRefresh({ sub: user.id });


        const rtPayload = jwt.decode(refreshToken);
        try {
          await prisma.refreshSession.create({
            data: {
              id: rtPayload.jti,
              userId: user.id,
              userAgent: req.get('user-agent') || null,
              ip: req.ip || null,
              expiresAt: expToDate(rtPayload.exp)
            }
          });
        } catch (e) {
          console.error('Failed to persist refresh session on login:', e);
        }

        //Met le refresh token dans le cookie
        setRefreshCookie(res, refreshToken);
        res.json(new AuthResponseDto(user, accessToken));
    } catch (e) {
        next(e);
    }
});

router.post("/refresh", async (req, res) => {
  /**
   * @swagger
   * /api/auth/refresh:
   *   post:
   *     summary: Refresh access token
   *     tags: [Auth]
   *     responses:
   *       200:
   *         description: Token refreshed successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/RefreshResponseDto'
   *       401:
   *         description: Invalid or expired refresh token
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponseDto'
   */
    //Récupère le refresh token depuis le cookie
    const rt = req.cookies?.refresh_token;
    if (!rt)
        return res.status(401).json(new ErrorResponseDto("No refresh token"));
    try {
        //Vérifie que le refresh token est valide (jwt.verify)
        const payload = jwt.verify(rt, process.env.JWT_REFRESH_SECRET);

        const session = await prisma.refreshSession.findUnique({ where: { id: payload.jti } });
        if (!session || session.userId !== payload.sub) {
          return res.status(401).json(new ErrorResponseDto('Invalid refresh'));
        }
        if (session.revokedAt || session.expiresAt < new Date()) {
          return res.status(401).json(new ErrorResponseDto('Refresh expired or revoked'));
        }

        const user = await prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user) return res.status(401).json(new ErrorResponseDto('Invalid refresh'));

        const accessToken = signAccess({ sub: user.id, role: user.role || 'user' });
        const newRefreshToken = signRefresh({ sub: user.id });
        const newRtPayload = jwt.decode(newRefreshToken);

        await prisma.$transaction([
          prisma.refreshSession.update({
            where: { id: session.id },
            data: { revokedAt: new Date(), replacedBy: newRtPayload.jti }
          }),
          prisma.refreshSession.create({
            data: {
              id: newRtPayload.jti,
              userId: user.id,
              userAgent: req.get('user-agent') || null,
              ip: req.ip || null,
              expiresAt: expToDate(newRtPayload.exp)
            }
          })
        ]);

        setRefreshCookie(res, newRefreshToken);
        return res.json(new RefreshResponseDto(accessToken));
    } catch (e) {
        res.status(401).json(new ErrorResponseDto("Invalid refresh"));
    }
});

router.post('/logout', async (req, res) => {
  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     summary: Logout user
   *     tags: [Auth]
   *     responses:
   *       204:
   *         description: Logout successful
   */
  const rt = req.cookies?.refresh_token;
  if (rt) {
    try {
      const payload = jwt.verify(rt, process.env.JWT_REFRESH_SECRET);
      await prisma.refreshSession.update({
        where: { id: payload.jti },
        data: { revokedAt: new Date() }
      }).catch(() => {});
    } catch (_) { }
  }
  // Clear cookie with the SAME options as when it was set
  res.clearCookie('refresh_token', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  res.status(204).end();
});

export default router;
