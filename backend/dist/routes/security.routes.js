"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/security.routes.ts
const express_1 = require("express");
const prisma_1 = require("../prisma");
const checkRole_1 = require("../middleware/checkRole");
const validate_1 = require("../middleware/validate");
const security_schema_1 = require("../schemas/security.schema");
const router = (0, express_1.Router)();
router.get("/", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), async (_req, res) => {
    const items = await prisma_1.prisma.securityLog.findMany({ orderBy: { date: "desc" } });
    res.json(items);
});
router.post("/", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), (0, validate_1.validate)(security_schema_1.createSecurityLogSchema), async (req, res) => {
    const created = await prisma_1.prisma.securityLog.create({ data: req.body });
    res.status(201).json(created);
});
// PUT /api/security/:id
router.put("/:id", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ message: "Invalid id" });
    }
    const { eventType, description, date, documentUrl } = req.body;
    try {
        const updated = await prisma_1.prisma.securityLog.update({
            where: { id },
            data: {
                eventType,
                description,
                date: date ? new Date(date) : undefined,
                documentUrl,
            },
        });
        return res.json(updated);
    }
    catch (error) {
        if (error?.code === "P2025") {
            return res.status(404).json({ message: "Record not found" });
        }
        throw error;
    }
});
// DELETE /api/security/:id
router.delete("/:id", (0, checkRole_1.checkRole)(["ADMIN"]), async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ message: "Invalid id" });
    }
    try {
        await prisma_1.prisma.securityLog.delete({ where: { id } });
    }
    catch (error) {
        if (error?.code === "P2025") {
            return res.status(204).send();
        }
        throw error;
    }
    return res.status(204).send();
});
exports.default = router;
