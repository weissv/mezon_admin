"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/notifications.routes.ts
const express_1 = require("express");
const prisma_1 = require("../prisma");
const checkRole_1 = require("../middleware/checkRole");
const validate_1 = require("../middleware/validate");
const notification_schema_1 = require("../schemas/notification.schema");
const router = (0, express_1.Router)();
// GET /api/notifications
router.get("/", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), async (_req, res) => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringContracts = await prisma_1.prisma.employee.findMany({
        where: {
            contractEndDate: {
                lte: thirtyDaysFromNow,
                gte: new Date(), // Только будущие или текущие даты
            },
            fireDate: null,
        },
    });
    const expiringMedicalCheckups = await prisma_1.prisma.employee.findMany({
        where: {
            medicalCheckupDate: {
                lte: thirtyDaysFromNow,
                gte: new Date(),
            },
            fireDate: null,
        },
    });
    const notifications = [
        ...expiringContracts.map(emp => ({
            type: 'CONTRACT_EXPIRING',
            message: `У сотрудника ${emp.lastName} ${emp.firstName} истекает контракт ${emp.contractEndDate?.toLocaleDateString()}.`,
            employeeId: emp.id,
            date: emp.contractEndDate,
        })),
        ...expiringMedicalCheckups.map(emp => ({
            type: 'MEDICAL_CHECKUP_DUE',
            message: `У сотрудника ${emp.lastName} ${emp.firstName} истекает срок медосмотра ${emp.medicalCheckupDate?.toLocaleDateString()}.`,
            employeeId: emp.id,
            date: emp.medicalCheckupDate,
        })),
    ];
    // Сортируем по дате
    notifications.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return res.json(notifications);
});
// --- Массовые уведомления / объявления ---
router.get("/broadcasts", (0, checkRole_1.checkRole)(["DIRECTOR", "DEPUTY", "ADMIN", "ACCOUNTANT", "TEACHER"]), async (req, res) => {
    const { targetRole, groupId } = req.query;
    const isTeacher = req.user.role === "TEACHER";
    const where = isTeacher
        ? {
            OR: [{ targetRole: null }, { targetRole: "TEACHER" }],
        }
        : {
            ...(targetRole ? { targetRole: targetRole } : {}),
            ...(groupId ? { targetGroupId: Number(groupId) } : {}),
        };
    const broadcasts = await prisma_1.prisma.notification.findMany({
        where,
        include: {
            targetGroup: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
    });
    return res.json(broadcasts);
});
router.post("/broadcasts", (0, checkRole_1.checkRole)(["DIRECTOR", "DEPUTY", "ADMIN"]), (0, validate_1.validate)(notification_schema_1.createNotificationSchema), async (req, res) => {
    const { title, content, targetRole, targetGroupId } = req.body;
    const notification = await prisma_1.prisma.notification.create({
        data: {
            title,
            content,
            targetRole: targetRole ?? null,
            targetGroupId: targetGroupId ?? null,
        },
        include: {
            targetGroup: { select: { id: true, name: true } },
        },
    });
    return res.status(201).json(notification);
});
router.put("/broadcasts/:id", (0, checkRole_1.checkRole)(["DIRECTOR", "DEPUTY", "ADMIN"]), (0, validate_1.validate)(notification_schema_1.updateNotificationSchema), async (req, res) => {
    const { id } = req.params;
    const { title, content, targetRole, targetGroupId } = req.body;
    const notification = await prisma_1.prisma.notification.update({
        where: { id: Number(id) },
        data: {
            ...(title ? { title } : {}),
            ...(content ? { content } : {}),
            targetRole: targetRole === undefined ? undefined : targetRole ?? null,
            targetGroupId: targetGroupId === undefined ? undefined : targetGroupId ?? null,
        },
        include: {
            targetGroup: { select: { id: true, name: true } },
        },
    });
    return res.json(notification);
});
router.delete("/broadcasts/:id", (0, checkRole_1.checkRole)(["ADMIN"]), async (req, res) => {
    const { id } = req.params;
    await prisma_1.prisma.notification.delete({ where: { id: Number(id) } });
    return res.status(204).send();
});
exports.default = router;
