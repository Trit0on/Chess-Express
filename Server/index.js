const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Simple health endpoint
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, message: 'pong', time: new Date().toISOString() });
});

// Example API route
app.get('/api/hello', (req, res) => {
  res.json({ ok: true, greeting: 'Hello from Chess RPG' });
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
