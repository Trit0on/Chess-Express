const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Custom header for tracing
app.use((req, res, next) => {
  res.setHeader('X-App', 'chess-api');
  next();
});

// Auth routes
const authRouter = require('./api/auth');
app.use('/api/auth', authRouter);

const usersRouter = require('./api/users');
app.use('/api/users', usersRouter);

// Simple health endpoint
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, message: 'pong', time: new Date().toISOString() });
});

// Example API route
app.get('/api/hello', (req, res) => {
  res.json({ ok: true, greeting: 'Hello from Chess API' });
});

// Database test endpoint
app.get('/api/dbtest', async (req, res) => {
  try {
    // Test connection with a simple query
    await prisma.$connect();
    const userCount = await prisma.user.count();
    res.json({ 
      ok: true, 
      message: 'Database connected successfully',
      userCount,
      databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@') // hide password
    });
  } catch (error) {
    res.status(500).json({ 
      ok: false, 
      error: error.message,
      databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@')
    });
  }
});

// 404 and error handlers
app.use((req, res, next) => {
  res.status(404).json({ ok: false, message: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ ok: false, message: err.message || 'Server error' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
