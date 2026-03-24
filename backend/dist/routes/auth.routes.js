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
const constants_1 = require("../constants");
const router = (0, express_1.Router)();
// Публичный роут для входа
router.post("/login", async (req, res) => {
    const { email, login, password } = req.body;
    const identifier = login || email;
    if (!identifier || !password) {
        return res.status(400).json({ message: "Email/login and password are required" });
    }
    const user = await prisma_1.prisma.user.findFirst({
        where: {
            email: identifier,
            deletedAt: null,
        },
        include: { employee: true },
    });
    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    const isValid = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role, employeeId: user.employeeId }, config_1.config.jwtSecret, { expiresIn: constants_1.JWT.EXPIRES_IN });
    // Set HttpOnly cookie
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none', // Changed from 'lax' to 'none' for cross-origin
        maxAge: constants_1.JWT.COOKIE_MAX_AGE,
    };
    res.cookie('auth_token', token, cookieOptions);
    // Remove sensitive data
    const { passwordHash, ...sanitizedUser } = user;
    return res.json({ user: sanitizedUser, token });
});
// Session probe route: returns null instead of 401 when user is not authenticated
router.get("/me", async (req, res) => {
    let token = req.cookies?.auth_token;
    if (!token) {
        const header = req.headers.authorization;
        if (header && header.startsWith("Bearer ")) {
            token = header.substring(7);
        }
    }
    if (!token) {
        return res.json({ user: null });
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        if (!payload?.id) {
            return res.json({ user: null });
        }
        const me = await prisma_1.prisma.user.findFirst({
            where: {
                id: payload.id,
                deletedAt: null,
            },
            include: { employee: true },
        });
        if (!me) {
            return res.json({ user: null });
        }
        const { passwordHash, ...sanitizedUser } = me;
        return res.json({ user: sanitizedUser });
    }
    catch {
        return res.json({ user: null });
    }
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
