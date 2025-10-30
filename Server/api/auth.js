const express = require("express");
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const router = express.Router();
const prisma = new PrismaClient();

// Password hashing helpers (PBKDF2 + SHA-512)
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
    const [iterStr, salt, hash] = stored.split("$");
    const iterations = parseInt(iterStr, 10);
    const derived = crypto
        .pbkdf2Sync(plain, salt, iterations, KEYLEN, DIGEST)
        .toString("hex");
    return crypto.timingSafeEqual(
        Buffer.from(hash, "hex"),
        Buffer.from(derived, "hex")
    );
}

const ACCESS_TTL = "15m";
const REFRESH_TTL = "7d";

function signAccess(payload) {
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
        expiresIn: ACCESS_TTL,
    });
}
function signRefresh(payload) {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
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

// POST /api/auth/signup
router.post("/signup", async (req, res, next) => {
    try {
        const { email, password, name } = req.body || {};
        if (!email || !password)
            return res
                .status(400)
                .json({ ok: false, message: "email and password are required" });

        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists)
            return res.status(409).json({ ok: false, message: "Email already used" });

        const hashed = hashPassword(password);
        const user = await prisma.user.create({
            data: { email, password: hashed, name },
        });

        const accessToken = signAccess({ sub: user.id, role: user.role || "user" });
        const refreshToken = signRefresh({ sub: user.id });

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

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password)
            return res
                .status(400)
                .json({ ok: false, message: "email and password are required" });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user)
            return res
                .status(401)
                .json({ ok: false, message: "Invalid credentials" });

        const ok = verifyPassword(password, user.password);
        if (!ok)
            return res
                .status(401)
                .json({ ok: false, message: "Invalid credentials" });

        const accessToken = signAccess({ sub: user.id, role: user.role || "user" });
        const refreshToken = signRefresh({ sub: user.id });

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

// POST /api/auth/refresh
router.post("/refresh", async (req, res) => {
    const rt = req.cookies?.refresh_token;
    if (!rt)
        return res.status(401).json({ ok: false, message: "No refresh token" });
    try {
        const payload = jwt.verify(rt, process.env.JWT_REFRESH_SECRET);
        const user = await prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user)
            return res.status(401).json({ ok: false, message: "Invalid refresh" });

        const accessToken = signAccess({ sub: user.id, role: user.role || "user" });
        const refreshToken = signRefresh({ sub: user.id });
        setRefreshCookie(res, refreshToken);
        res.json({ ok: true, accessToken });
    } catch (e) {
        res.status(401).json({ ok: false, message: "Invalid refresh" });
    }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
    res.clearCookie("refresh_token", { path: "/api/auth" });
    res.status(204).end();
});

module.exports = router;
