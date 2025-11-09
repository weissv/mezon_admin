"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/inventory.routes.ts
const express_1 = require("express");
const prisma_1 = require("../prisma");
const checkRole_1 = require("../middleware/checkRole");
const validate_1 = require("../middleware/validate");
const inventory_schema_1 = require("../schemas/inventory.schema");
const router = (0, express_1.Router)();
// GET /api/inventory
router.get("/", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), async (_req, res) => {
    const items = await prisma_1.prisma.inventoryItem.findMany({ orderBy: { name: "asc" } });
    // Фронт окрасит строки по срокам годности (<7 дней, просрочено)
    return res.json(items);
});
// POST /api/inventory/generate-shopping-list
// TODO: Cron job для проверки сроков годности и создания уведомлений.
router.post("/generate-shopping-list", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), (0, validate_1.validate)(inventory_schema_1.generateShoppingListSchema), async (req, res) => {
    // Вход: { startDate, endDate }
    // Бизнес-логика: суммировать блюда из меню, сопоставить с остатками
    const { startDate, endDate } = req.body;
    const menus = await prisma_1.prisma.menu.findMany({
        where: { date: { gte: new Date(startDate), lte: new Date(endDate) } },
    });
    // Предположим meals содержат [{ name, dish, calories, ingredients: [{name, qty, unit}] }]
    const required = {};
    for (const m of menus) {
        const meals = m.meals || [];
        for (const meal of meals) {
            const ings = meal.ingredients || [];
            for (const ing of ings) {
                const key = `${ing.name}|${ing.unit}`;
                required[key] = required[key] || { qty: 0, unit: ing.unit };
                required[key].qty += Number(ing.qty) || 0;
            }
        }
    }
    const inventory = await prisma_1.prisma.inventoryItem.findMany();
    const shoppingList = Object.entries(required).map(([key, val]) => {
        const [name, unit] = key.split("|");
        const stock = inventory.find((i) => i.name === name && i.unit === unit);
        const remaining = (val.qty - (stock?.quantity || 0));
        return { name, unit, requiredQty: val.qty, inStock: stock?.quantity || 0, toBuy: Math.max(remaining, 0) };
    });
    return res.json({ period: { startDate, endDate }, items: shoppingList });
});
exports.default = router;
