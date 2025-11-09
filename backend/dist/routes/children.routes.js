"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/children.routes.ts
const express_1 = require("express");
const prisma_1 = require("../prisma");
const checkRole_1 = require("../middleware/checkRole");
const query_1 = require("../utils/query");
const actionLogger_1 = require("../middleware/actionLogger");
const validate_1 = require("../middleware/validate");
const child_schema_1 = require("../schemas/child.schema");
const router = (0, express_1.Router)();
// GET /api/children
router.get("/", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN", "TEACHER", "ACCOUNTANT"]), async (req, res) => {
    const { skip, take } = (0, query_1.buildPagination)(req.query);
    const orderBy = (0, query_1.buildOrderBy)(req.query);
    const where = (0, query_1.buildWhere)(req.query, ["status", "groupId", "lastName"]);
    const [items, total] = await Promise.all([
        prisma_1.prisma.child.findMany({ where, skip, take, orderBy, include: { group: true } }),
        prisma_1.prisma.child.count({ where }),
    ]);
    return res.json({ items, total });
});
router.post("/", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), (0, validate_1.validate)(child_schema_1.createChildSchema), (0, actionLogger_1.logAction)("CREATE_CHILD", (req) => ({ body: req.body })), async (req, res) => {
    const child = await prisma_1.prisma.child.create({ data: req.body });
    return res.status(201).json(child);
});
router.put("/:id", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), (0, validate_1.validate)(child_schema_1.updateChildSchema), (0, actionLogger_1.logAction)("UPDATE_CHILD", (req) => ({ id: req.params.id, body: req.body })), async (req, res) => {
    const id = Number(req.params.id);
    const child = await prisma_1.prisma.child.update({ where: { id }, data: req.body });
    return res.json(child);
});
exports.default = router;
