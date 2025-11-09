"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/groups.routes.ts
const express_1 = require("express");
const prisma_1 = require("../prisma");
const checkRole_1 = require("../middleware/checkRole");
const router = (0, express_1.Router)();
// GET /api/groups
router.get("/", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN", "TEACHER", "ACCOUNTANT"]), async (req, res) => {
    const groups = await prisma_1.prisma.group.findMany();
    return res.json(groups);
});
exports.default = router;
