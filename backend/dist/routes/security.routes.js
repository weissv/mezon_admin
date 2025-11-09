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
exports.default = router;
