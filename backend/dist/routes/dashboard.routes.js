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
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const alertThreshold = new Date(Date.now() + 30 * 24 * 3600 * 1000);
    const [childrenCount, childrenOnMeals, employeesCount, activeClubs, financeLast30d, maintenanceActive, procurementActive, medicalExpiringSoon, contractsExpiringSoon,] = await Promise.all([
        prisma_1.prisma.child.count({ where: { status: "ACTIVE" } }),
        prisma_1.prisma.attendance.count({
            where: {
                date: { gte: startOfToday, lt: endOfToday },
                clubId: null,
                isPresent: true,
            },
        }),
        prisma_1.prisma.employee.count({ where: { fireDate: null } }),
        prisma_1.prisma.club.count({ where: isTeacher ? { teacherId: req.user.employeeId } : {} }),
        prisma_1.prisma.financeTransaction.groupBy({
            by: ["type"],
            _sum: { amount: true },
            where: { date: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) } },
        }),
        prisma_1.prisma.maintenanceRequest.count({ where: { status: { in: ["PENDING", "IN_PROGRESS"] } } }),
        prisma_1.prisma.purchaseOrder.count({ where: { status: { not: "DELIVERED" } } }),
        prisma_1.prisma.employee.count({
            where: {
                fireDate: null,
                medicalCheckupDate: { not: null, lte: alertThreshold, gte: startOfToday },
            },
        }),
        prisma_1.prisma.employee.count({
            where: {
                fireDate: null,
                contractEndDate: { not: null, lte: alertThreshold, gte: startOfToday },
            },
        }),
    ]);
    return res.json({
        kpi: {
            childrenCount,
            childrenOnMeals,
            employeesCount,
            activeClubs,
            financeLast30d,
        },
        alerts: {
            maintenanceActive,
            procurementActive,
            medicalExpiringSoon,
            contractsExpiringSoon,
        },
    });
});
// GET /api/dashboard/metrics - расширенная статистика
router.get("/metrics", (0, checkRole_1.checkRole)(["DIRECTOR", "DEPUTY", "ADMIN"]), async (_req, res) => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const alertThreshold = new Date(Date.now() + 30 * 24 * 3600 * 1000);
    const [childrenCount, employeesCount, activeClubs, lowInventory, attendanceToday, childrenOnMeals, maintenanceActive, procurementActive, medicalExpiring, contractsExpiring, employeeAttendanceRecords,] = await Promise.all([
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
                    gte: startOfToday,
                    lt: endOfToday,
                },
                isPresent: true,
                clubId: null,
            },
        }),
        // Кол-во детей, получающих питание (пришли в основную группу)
        prisma_1.prisma.attendance.count({
            where: {
                date: {
                    gte: startOfToday,
                    lt: endOfToday,
                },
                clubId: null,
                isPresent: true,
            },
        }),
        // Активные заявки на обслуживание
        prisma_1.prisma.maintenanceRequest.count({
            where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
        }),
        // Активные закупки
        prisma_1.prisma.purchaseOrder.count({
            where: { status: { not: "DELIVERED" } },
        }),
        // Сотрудники, которым скоро нужен медосмотр (в течение 30 дней)
        prisma_1.prisma.employee.findMany({
            where: {
                fireDate: null,
                medicalCheckupDate: {
                    not: null,
                    lte: alertThreshold,
                    gte: startOfToday,
                },
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
                medicalCheckupDate: true,
            },
            orderBy: { medicalCheckupDate: "asc" },
        }),
        // Сотрудники с истекающими контрактами
        prisma_1.prisma.employee.findMany({
            where: {
                fireDate: null,
                contractEndDate: {
                    not: null,
                    lte: alertThreshold,
                    gte: startOfToday,
                },
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
                contractEndDate: true,
            },
            orderBy: { contractEndDate: "asc" },
        }),
        // Табель сотрудников на сегодня
        prisma_1.prisma.employeeAttendance.findMany({
            where: {
                date: {
                    gte: startOfToday,
                    lt: endOfToday,
                },
            },
            select: { status: true },
        }),
    ]);
    const employeeAttendance = employeeAttendanceRecords.reduce((acc, record) => {
        acc[record.status] = (acc[record.status] || 0) + 1;
        return acc;
    }, {});
    return res.json({
        childrenCount,
        employeesCount,
        activeClubs,
        lowInventory,
        attendance: {
            today: attendanceToday,
            date: today.toISOString().split("T")[0],
        },
        nutrition: {
            childrenOnMeals: childrenOnMeals,
        },
        maintenance: {
            activeRequests: maintenanceActive,
        },
        procurement: {
            activeOrders: procurementActive,
        },
        employees: {
            needingMedicalCheckup: medicalExpiring,
            contractsExpiringSoon: contractsExpiring,
            attendanceToday: employeeAttendance,
        },
    });
});
exports.default = router;
