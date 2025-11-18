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
  
  console.log('[AUTH] Login attempt:', { identifier });
  
  if (!identifier || !password) {
    console.log('[AUTH] Missing credentials');
    return res.status(400).json({ message: "Email/login and password are required" });
  }

  const user = await prisma.user.findUnique({ where: { email: identifier }, include: { employee: true } });
  if (!user) {
    console.log('[AUTH] User not found:', identifier);
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  
  if (!isValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, employeeId: user.employeeId } as object,
    config.jwtSecret
  );

  // Set HttpOnly cookie
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none' as const, // Changed from 'lax' to 'none' for cross-origin
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };
  
  res.cookie('auth_token', token, cookieOptions);
  

  console.log('[AUTH] Login successful for:', user.email);
  
  // Remove sensitive data
  const { passwordHash, ...sanitizedUser } = user;
  return res.json({ user: sanitizedUser, token });
});

// Приватный роут, защищенный своим middleware
router.get("/me", authMiddleware, async (req, res) => {
  const me = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { employee: true },
  });
  if (!me) return res.status(404).json({ message: "User not found" });
  
  // Remove sensitive data
  const { passwordHash, ...sanitizedUser } = me;
  return res.json({ user: sanitizedUser });
});

// Logout route - clears the cookie
router.post("/logout", (req, res) => {
  res.cookie('auth_token', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none' as const
  });
  return res.status(200).json({ message: 'Logged out successfully' });
});

export default router;