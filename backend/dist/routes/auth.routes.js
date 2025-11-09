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
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await prisma_1.prisma.user.findUnique({ where: { email }, include: { employee: true } });
    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    const isValid = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role, employeeId: user.employeeId }, config_1.config.jwtSecret);
    return res.json({ token, user });
});
// Приватный роут, защищенный своим middleware
router.get("/me", auth_1.authMiddleware, async (req, res) => {
    const me = await prisma_1.prisma.user.findUnique({
        where: { id: req.user.id },
        include: { employee: true },
    });
    if (!me)
        return res.status(404).json({ message: "User not found" });
    return res.json(me);
});
exports.default = router;
