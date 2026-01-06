"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/maintenance.routes.ts
const express_1 = require("express");
const prisma_1 = require("../prisma");
const checkRole_1 = require("../middleware/checkRole");
const router = (0, express_1.Router)();
const validate_1 = require("../middleware/validate");
const maintenance_schema_1 = require("../schemas/maintenance.schema");
router.get("/", (0, checkRole_1.checkRole)(["DIRECTOR", "DEPUTY", "ADMIN"]), async (_req, res) => {
    const items = await prisma_1.prisma.maintenanceRequest.findMany({
        include: { requester: true },
        orderBy: { createdAt: "desc" },
    });
    res.json(items);
});
router.post("/", (0, checkRole_1.checkRole)(["DIRECTOR", "DEPUTY", "ADMIN", "TEACHER"]), (0, validate_1.validate)(maintenance_schema_1.createMaintenanceSchema), async (req, res) => {
    const data = req.body;
    const created = await prisma_1.prisma.maintenanceRequest.create({
        data: { ...data, requesterId: req.user.employeeId },
    });
    res.status(201).json(created);
});
router.put("/:id", (0, checkRole_1.checkRole)(["DIRECTOR", "DEPUTY", "ADMIN"]), (0, validate_1.validate)(maintenance_schema_1.updateMaintenanceSchema), async (req, res) => {
    const id = Number(req.params.id);
    const updated = await prisma_1.prisma.maintenanceRequest.update({ where: { id }, data: req.body });
    res.json(updated);
});
// DELETE /api/maintenance/:id - удаление заявки
router.delete("/:id", (0, checkRole_1.checkRole)(["DIRECTOR", "ADMIN"]), async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ message: "Invalid id" });
    }
    try {
        await prisma_1.prisma.maintenanceRequest.delete({ where: { id } });
    }
    catch (error) {
        if (error?.code === "P2025") {
            return res.status(204).send();
        }
        throw error;
    }
    return res.status(204).send();
});
// --- CleaningSchedule CRUD ---
// GET /api/maintenance/cleaning - список графиков уборки
router.get("/cleaning", (0, checkRole_1.checkRole)(["DIRECTOR", "DEPUTY", "ADMIN"]), async (_req, res) => {
    const schedules = await prisma_1.prisma.cleaningSchedule.findMany({
        include: {
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
            logs: {
                orderBy: { timestamp: "desc" },
                take: 5,
            },
        },
        orderBy: { area: "asc" },
    });
    return res.json(schedules);
});
// POST /api/maintenance/cleaning - создать график уборки
router.post("/cleaning", (0, checkRole_1.checkRole)(["DIRECTOR", "DEPUTY", "ADMIN"]), async (req, res) => {
    const { area, frequency, assignedToId } = req.body;
    const schedule = await prisma_1.prisma.cleaningSchedule.create({
        data: {
            area,
            frequency,
            assignedToId: assignedToId || null,
        },
        include: {
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
        },
    });
    return res.status(201).json(schedule);
});
// PUT /api/maintenance/cleaning/:id - обновить график
router.put("/cleaning/:id", (0, checkRole_1.checkRole)(["DIRECTOR", "DEPUTY", "ADMIN"]), async (req, res) => {
    const { id } = req.params;
    const { area, frequency, assignedToId } = req.body;
    const schedule = await prisma_1.prisma.cleaningSchedule.update({
        where: { id: Number(id) },
        data: { area, frequency, assignedToId },
        include: {
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
        },
    });
    return res.json(schedule);
});
// DELETE /api/maintenance/cleaning/:id
router.delete("/cleaning/:id", (0, checkRole_1.checkRole)(["DIRECTOR", "ADMIN"]), async (req, res) => {
    const { id } = req.params;
    await prisma_1.prisma.cleaningSchedule.delete({ where: { id: Number(id) } });
    return res.status(204).send();
});
// POST /api/maintenance/cleaning/:id/log - отметить выполнение уборки
router.post("/cleaning/:id/log", (0, checkRole_1.checkRole)(["DIRECTOR", "DEPUTY", "ADMIN", "TEACHER"]), async (req, res) => {
    const { id } = req.params;
    const log = await prisma_1.prisma.cleaningLog.create({
        data: {
            scheduleId: Number(id),
        },
    });
    return res.status(201).json(log);
});
// --- Equipment CRUD ---
// GET /api/maintenance/equipment - список оборудования
router.get("/equipment", (0, checkRole_1.checkRole)(["DIRECTOR", "DEPUTY", "ADMIN"]), async (_req, res) => {
    const equipment = await prisma_1.prisma.equipment.findMany({
        orderBy: { nextCheckup: "asc" },
    });
    return res.json(equipment);
});
// POST /api/maintenance/equipment - добавить оборудование
router.post("/equipment", (0, checkRole_1.checkRole)(["DIRECTOR", "DEPUTY", "ADMIN"]), async (req, res) => {
    const { name, location, lastCheckup, nextCheckup } = req.body;
    const equipment = await prisma_1.prisma.equipment.create({
        data: {
            name,
            location: location || null,
            lastCheckup: new Date(lastCheckup),
            nextCheckup: new Date(nextCheckup),
        },
    });
    return res.status(201).json(equipment);
});
// PUT /api/maintenance/equipment/:id - обновить оборудование
router.put("/equipment/:id", (0, checkRole_1.checkRole)(["DIRECTOR", "DEPUTY", "ADMIN"]), async (req, res) => {
    const { id } = req.params;
    const { name, location, lastCheckup, nextCheckup } = req.body;
    const equipment = await prisma_1.prisma.equipment.update({
        where: { id: Number(id) },
        data: {
            name,
            location,
            lastCheckup: lastCheckup ? new Date(lastCheckup) : undefined,
            nextCheckup: nextCheckup ? new Date(nextCheckup) : undefined,
        },
    });
    return res.json(equipment);
});
// DELETE /api/maintenance/equipment/:id
router.delete("/equipment/:id", (0, checkRole_1.checkRole)(["DIRECTOR", "ADMIN"]), async (req, res) => {
    const { id } = req.params;
    await prisma_1.prisma.equipment.delete({ where: { id: Number(id) } });
    return res.status(204).send();
});
// GET /api/maintenance/equipment/reminders - напоминания о проверках
router.get("/equipment/reminders", (0, checkRole_1.checkRole)(["DIRECTOR", "DEPUTY", "ADMIN"]), async (req, res) => {
    const { days = 30 } = req.query;
    const upcomingCheckups = await prisma_1.prisma.equipment.findMany({
        where: {
            nextCheckup: {
                lte: new Date(Date.now() + Number(days) * 24 * 3600 * 1000),
            },
        },
        orderBy: { nextCheckup: "asc" },
    });
    return res.json(upcomingCheckups);
});
exports.default = router;
