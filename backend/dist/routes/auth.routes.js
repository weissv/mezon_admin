"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/auth.routes.ts
const express_1 = require("express");
const prisma_1 = require("../prisma");
const auth_1 = require("../middleware/auth"); // Убедись, что импорт есть
const router = (0, express_1.Router)();
// Публичный роут для входа
router.post("/login", async (req, res) => {
    // ... код без изменений ...
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
