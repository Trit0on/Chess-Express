import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { ErrorResponseDto } from './dto/auth.dto.js';
const router = express.Router();

const prisma = new PrismaClient();

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json(new ErrorResponseDto('Unauthorized'));
  }
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { id: payload.sub, role: payload.role || 'user' };
    return next();
  } catch (e) {
    return res.status(401).json(new ErrorResponseDto('Unauthorized'));
  }
}

router.use(requireAuth);

router.get('/me', async (req, res) => {
  /**
   * @swagger
   * /api/users/me:
   *   get:
   *     summary: Get current authenticated user information
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User information
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserResponseDto'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponseDto'
   */
  const userId = req.user?.id;
  if (!userId)
    return res.status(401).json(new ErrorResponseDto('Unauthorized'));

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user)
    return res.status(404).json(new ErrorResponseDto('User not found'));

  res.json({ ok: true, user });
});

router.get('/all', async (req, res) => {
  /**
   * @swagger
   * /api/users/all:
   *   get:
   *     summary: Get all users
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of all users
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UsersResponseDto'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponseDto'
   */
    const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, createdAt: true, updatedAt: true }
    });
    res.json({ ok: true, users });
});

router.get('/:id', async (req, res) => {
  /**
   * @swagger
   * /api/users/{id}:
   *   get:
   *     summary: Get a user by ID
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     responses:
   *       200:
   *         description: User information
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserResponseDto'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponseDto'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponseDto'
   */
  const userId = req.params.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user)
    return res.status(404).json(new ErrorResponseDto('User not found'));

  res.json({ ok: true, user });
});

export default router;
