const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const router = express.Router();

const prisma = new PrismaClient();

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { id: payload.sub, role: payload.role || 'user' };
    return next();
  } catch (e) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }
}

router.use(requireAuth);

router.get('/me', async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ ok: false, message: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });

    res.json({ ok: true, user });
});


router.get('/all', async (req, res) => {
    const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, createdAt: true }
    });
    res.json({ ok: true, users });
});


router.get('/:id', async (req, res) => {
  const userId = req.params.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },

  });

  if (!user)
    return res.status(404).json({ ok: false, message: 'User not found' });

  res.json({ ok: true, user });
});

module.exports = router;
