"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/branches.routes.ts
const express_1 = require("express");
const prisma_1 = require("../prisma");
const checkRole_1 = require("../middleware/checkRole");
const validate_1 = require("../middleware/validate");
const branch_schema_1 = require("../schemas/branch.schema");
const router = (0, express_1.Router)();
router.get("/", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), async (_req, res) => {
    const branches = await prisma_1.prisma.branch.findMany({ orderBy: { name: "asc" } });
    res.json(branches);
});
router.post("/", (0, checkRole_1.checkRole)(["ADMIN"]), (0, validate_1.validate)(branch_schema_1.createBranchSchema), async (req, res) => {
    const created = await prisma_1.prisma.branch.create({ data: req.body });
    res.status(201).json(created);
});
exports.default = router;
