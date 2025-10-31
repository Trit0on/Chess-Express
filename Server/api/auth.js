const express = require("express");
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto"); //crypto : utilisé pour le hachage sécurisé des mots de passe.
const jwt = require("jsonwebtoken"); //pour créer et vérifier les tokens JWT.

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
        path: "/api/auth",
        maxAge: 1000 * 60 * 60 * 24 * 7,
    });
}

// POST /api/auth/signup //inscription d'un nouvel utilisateur
//vérifie que email et mdp fournis,

//
router.post("/signup", async (req, res, next) => {
    try {
        const { email, password, name } = req.body || {};
        if (!email || !password)
            return res
                .status(400)
                .json({ ok: false, message: "email and password are required" });

        //vérifie si l'utilisateur existe déjà (findUnique),
        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists)
            return res.status(409).json({ ok: false, message: "Email already used" });

    //Hache le mot de passe (hashPassword).
        const hashed = hashPassword(password);
        //Crée l’utilisateur dans la DB (prisma.user.create).
        const user = await prisma.user.create({
            data: { email, password: hashed, name },
        });

        //on génère access token et refresh token
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
        res.status(201).json({
            ok: true,
            user: { id: user.id, email: user.email, name: user.name },
            accessToken,
        });
    } catch (e) {
        next(e);
    }
});

// POST /api/auth/login //connexion d'un utilisateur 
router.post("/login", async (req, res, next) => {
    try {
        //Vérifie les champs email/password
        const { email, password } = req.body || {};
        if (!email || !password)
            return res
                .status(400)
                .json({ ok: false, message: "email and password are required" });

         //Récupère l’utilisateur dans la DB
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user)
            return res
                .status(401)
                .json({ ok: false, message: "Invalid credentials" });

                //Vérifie le mot de passe (verifyPassword)
        const ok = verifyPassword(password, user.password);
        //Si ok, génère access + refresh token.
        if (!ok)
            return res
                .status(401)
                .json({ ok: false, message: "Invalid credentials" });

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
        res.json({
            ok: true,
            user: { id: user.id, email: user.email, name: user.name },
            accessToken,
        });
    } catch (e) {
        next(e);
    }
});

// POST /api/auth/refresh // renouvellement du token
router.post("/refresh", async (req, res) => {
    //Récupère le refresh token depuis le cookie
    const rt = req.cookies?.refresh_token;
    if (!rt)
        return res.status(401).json({ ok: false, message: "No refresh token" });
    try {
        //Vérifie que le refresh token est valide (jwt.verify)
        const payload = jwt.verify(rt, process.env.JWT_REFRESH_SECRET);

        const session = await prisma.refreshSession.findUnique({ where: { id: payload.jti } });
        if (!session || session.userId !== payload.sub) {
          return res.status(401).json({ ok: false, message: 'Invalid refresh' });
        }
        if (session.revokedAt || session.expiresAt < new Date()) {
          return res.status(401).json({ ok: false, message: 'Refresh expired or revoked' });
        }

        const user = await prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user) return res.status(401).json({ ok: false, message: 'Invalid refresh' });

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
        return res.json({ ok: true, accessToken });
    } catch (e) {
        res.status(401).json({ ok: false, message: "Invalid refresh" });
    }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
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
  res.clearCookie('refresh_token', { path: '/api/auth' });
  res.status(204).end();
});

module.exports = router;
