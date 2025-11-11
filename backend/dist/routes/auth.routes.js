"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/auth.routes.ts
const express_1 = require("express");
const prisma_1 = require("../prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const auth_1 = require("../middleware/auth"); // Убедись, что импорт есть
const router = (0, express_1.Router)();
// Публичный роут для входа
router.post("/login", async (req, res) => {
    const { email, login, password } = req.body;
    const identifier = login || email;
    console.log('[AUTH] Login attempt:', { identifier, hasPassword: !!password, body: req.body });
    if (!identifier || !password) {
        console.log('[AUTH] Missing credentials');
        return res.status(400).json({ message: "Email/login and password are required" });
    }
    const user = await prisma_1.prisma.user.findUnique({ where: { email: identifier }, include: { employee: true } });
    if (!user) {
        console.log('[AUTH] User not found:', identifier);
        return res.status(401).json({ message: "Invalid credentials" });
    }
    console.log('[AUTH] User found:', { email: user.email, hasHash: !!user.passwordHash });
    const isValid = await bcryptjs_1.default.compare(password, user.passwordHash);
    console.log('[AUTH] Password valid:', isValid);
    if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role, employeeId: user.employeeId }, config_1.config.jwtSecret);
    // Set HttpOnly cookie
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none', // Changed from 'lax' to 'none' for cross-origin
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
    res.cookie('auth_token', token, cookieOptions);
    console.log('[AUTH] Cookie set with options:', {
        ...cookieOptions,
        domain: req.hostname,
        origin: req.headers.origin
    });
    console.log('[AUTH] Login successful for:', user.email);
    // Remove sensitive data
    const { passwordHash, ...sanitizedUser } = user;
    return res.json({ user: sanitizedUser, token });
});
// Приватный роут, защищенный своим middleware
router.get("/me", auth_1.authMiddleware, async (req, res) => {
    const me = await prisma_1.prisma.user.findUnique({
        where: { id: req.user.id },
        include: { employee: true },
    });
    if (!me)
        return res.status(404).json({ message: "User not found" });
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
        sameSite: 'none'
    });
    return res.status(200).json({ message: 'Logged out successfully' });
});
exports.default = router;
