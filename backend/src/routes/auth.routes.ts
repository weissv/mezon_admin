// src/routes/auth.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { authMiddleware } from "../middleware/auth"; // Убедись, что импорт есть

const router = Router();

// Публичный роут для входа
router.post("/login", async (req, res) => {
  const { email, login, password } = req.body;
  const identifier = login || email;
  
  console.log('[AUTH] Login attempt:', { identifier, hasPassword: !!password, body: req.body });
  
  if (!identifier || !password) {
    console.log('[AUTH] Missing credentials');
    return res.status(400).json({ message: "Email/login and password are required" });
  }

  const user = await prisma.user.findUnique({ where: { email: identifier }, include: { employee: true } });
  if (!user) {
    console.log('[AUTH] User not found:', identifier);
    return res.status(401).json({ message: "Invalid credentials" });
  }

  console.log('[AUTH] User found:', { email: user.email, hasHash: !!user.passwordHash });
  const isValid = await bcrypt.compare(password, user.passwordHash);
  console.log('[AUTH] Password valid:', isValid);
  
  if (!isValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, employeeId: user.employeeId } as object,
    config.jwtSecret
  );

  console.log('[AUTH] Login successful for:', user.email);
  return res.json({ token, user });
});

// Приватный роут, защищенный своим middleware
router.get("/me", authMiddleware, async (req, res) => {
  const me = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { employee: true },
  });
  if (!me) return res.status(404).json({ message: "User not found" });
  return res.json(me);
});

export default router;