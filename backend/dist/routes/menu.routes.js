"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/menu.routes.ts
const express_1 = require("express");
const prisma_1 = require("../prisma");
const checkRole_1 = require("../middleware/checkRole");
const validate_1 = require("../middleware/validate");
const menu_schema_1 = require("../schemas/menu.schema");
const router = (0, express_1.Router)();
// GET /api/menu?startDate&endDate
router.get("/", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), async (req, res) => {
    const { startDate, endDate } = req.query;
    const where = {};
    if (startDate || endDate)
        where.date = {};
    if (startDate)
        where.date.gte = new Date(String(startDate));
    if (endDate)
        where.date.lte = new Date(String(endDate));
    const items = await prisma_1.prisma.menu.findMany({ where, orderBy: { date: "asc" } });
    return res.json(items);
});
// POST /api/menu
router.post("/", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), async (req, res) => {
    // Валидация и расчёт КБЖУ можно делать на фронте и/или бэке
    const created = await prisma_1.prisma.menu.upsert({
        where: { date_ageGroup: { date: new Date(req.body.date), ageGroup: req.body.ageGroup } },
        update: { meals: req.body.meals },
        create: { date: new Date(req.body.date), ageGroup: req.body.ageGroup, meals: req.body.meals },
    });
    return res.status(201).json(created);
});
router.get("/", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), (0, validate_1.validate)(menu_schema_1.getMenuSchema), async (req, res) => { });
router.post("/", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), (0, validate_1.validate)(menu_schema_1.upsertMenuSchema), async (req, res) => { });
exports.default = router;
