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
// GET /api/dashboard/metrics - расширенная статистика
router.get("/metrics", (0, checkRole_1.checkRole)(["DIRECTOR", "DEPUTY", "ADMIN"]), async (_req, res) => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const [childrenCount, employeesCount, activeClubs, lowInventory, attendanceToday, maintenanceActive, employeesNeedingMedical,] = await Promise.all([
        // Всего детей
        prisma_1.prisma.child.count({ where: { status: "ACTIVE" } }),
        // Всего сотрудников
        prisma_1.prisma.employee.count({ where: { fireDate: null } }),
        // Активных кружков
        prisma_1.prisma.club.count(),
        // Топ-5 продуктов с низким остатком (менее 10 единиц)
        prisma_1.prisma.inventoryItem.findMany({
            where: {
                type: "FOOD",
                quantity: { lt: 10 },
            },
            orderBy: { quantity: "asc" },
            take: 5,
            select: { id: true, name: true, quantity: true, unit: true },
        }),
        // Посещаемость детей сегодня
        prisma_1.prisma.attendance.count({
            where: {
                date: {
                    gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
                    lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
                },
                isPresent: true,
            },
        }),
        // Активные заявки на обслуживание
        prisma_1.prisma.maintenanceRequest.count({
            where: { status: { in: ["NEW", "IN_PROGRESS"] } },
        }),
        // Сотрудники, которым скоро нужен медосмотр (в течение 30 дней)
        prisma_1.prisma.employee.count({
            where: {
                fireDate: null,
                medicalCheckupDate: {
                    lte: new Date(Date.now() + 30 * 24 * 3600 * 1000),
                },
            },
        }),
    ]);
    return res.json({
        childrenCount,
        employeesCount,
        activeClubs,
        lowInventory,
        attendance: {
            today: attendanceToday,
            date: today.toISOString().split("T")[0],
        },
        maintenance: {
            activeRequests: maintenanceActive,
        },
        employees: {
            needingMedicalCheckup: employeesNeedingMedical,
        },
    });
});
exports.default = router;
