"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/maintenance.routes.ts
const express_1 = require("express");
const prisma_1 = require("../prisma");
const checkRole_1 = require("../middleware/checkRole");
const router = (0, express_1.Router)();
const validate_1 = require("../middleware/validate");
const maintenance_schema_1 = require("../schemas/maintenance.schema");
router.get("/", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), async (_req, res) => {
    const items = await prisma_1.prisma.maintenanceRequest.findMany({
        include: { requester: true },
        orderBy: { createdAt: "desc" },
    });
    res.json(items);
});
router.post("/", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN", "TEACHER"]), (0, validate_1.validate)(maintenance_schema_1.createMaintenanceSchema), async (req, res) => {
    const data = req.body;
    const created = await prisma_1.prisma.maintenanceRequest.create({
        data: { ...data, requesterId: req.user.employeeId },
    });
    res.status(201).json(created);
});
router.put("/:id", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), (0, validate_1.validate)(maintenance_schema_1.updateMaintenanceSchema), async (req, res) => {
    const id = Number(req.params.id);
    const updated = await prisma_1.prisma.maintenanceRequest.update({ where: { id }, data: req.body });
    res.json(updated);
});
exports.default = router;
