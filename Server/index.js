import { specs, swaggerUi } from "./swagger.js";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs));
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Custom header for tracing
app.use((req, res, next) => {
  res.setHeader("X-App", "chess-api");
  next();
});

// Import routes
import authRouter from "./api/auth.js";
import usersRouter from "./api/users.js";

// Register routes
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);

// Database test endpoint
app.get("/api/dbtest", async (req, res) => {
  try {
    // Test connection with a simple query
    await prisma.$connect();
    const userCount = await prisma.user.count();
    res.json({
      ok: true,
      message: "Database connected successfully",
      userCount,
      databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":***@"), // hide password
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message,
      databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":***@"),
    });
  }
});

// 404 and error handlers
app.use((req, res, next) => {
  res.status(404).json({ ok: false, message: "Not Found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ ok: false, message: err.message || "Server error" });
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
