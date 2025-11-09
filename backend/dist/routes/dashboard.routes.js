"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/dashboard.routes.ts
const express_1 = require("express");
const prisma_1 = require("../prisma");
const checkRole_1 = require("../middleware/checkRole");
const router = (0, express_1.Router)();
// GET /api/dashboard/summary
router.get("/summary", (0, checkRole_1.checkRole)(["DIRECTOR", "DEPUTY", "ADMIN", "ACCOUNTANT", "TEACHER"]), async (req, res) => {
    // Базовая сводка, фильтруем для TEACHER только свои кружки
    const isTeacher = req.user.role === "TEACHER";
    const [childrenCount, employeesCount, activeClubs, financeLast30d] = await Promise.all([
        prisma_1.prisma.child.count({ where: { status: "ACTIVE" } }),
        prisma_1.prisma.employee.count(),
        prisma_1.prisma.club.count({ where: isTeacher ? { teacherId: req.user.employeeId } : {} }),
        prisma_1.prisma.financeTransaction.groupBy({
            by: ["type"],
            _sum: { amount: true },
            where: { date: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) } },
        }),
    ]);
    return res.json({
        kpi: {
            childrenCount,
            employeesCount,
            activeClubs,
            financeLast30d,
        },
    });
});
exports.default = router;
