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
router.get("/", (0, checkRole_1.checkRole)(["DIRECTOR", "DEPUTY", "ADMIN", "ZAVHOZ"]), async (_req, res) => {
    const items = await prisma_1.prisma.inventoryItem.findMany({ orderBy: { name: "asc" } });
    // Фронт окрасит строки по срокам годности (<7 дней, просрочено)
    return res.json(items);
});
// POST /api/inventory - создание товара
router.post("/", (0, checkRole_1.checkRole)(["DIRECTOR", "ADMIN", "ZAVHOZ"]), (0, validate_1.validate)(inventory_schema_1.createInventorySchema), async (req, res) => {
    const { name, quantity, unit, expiryDate, type } = req.body;
    const item = await prisma_1.prisma.inventoryItem.create({
        data: {
            name,
            quantity,
            unit,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            type: type || "FOOD",
        },
    });
    return res.status(201).json(item);
});
// PUT /api/inventory/:id - обновление товара
router.put("/:id", (0, checkRole_1.checkRole)(["DIRECTOR", "ADMIN", "ZAVHOZ"]), (0, validate_1.validate)(inventory_schema_1.updateInventorySchema), async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ message: "Invalid id" });
    }
    const { name, quantity, unit, expiryDate, type } = req.body;
    const item = await prisma_1.prisma.inventoryItem.update({
        where: { id },
        data: {
            name,
            quantity,
            unit,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            type,
        },
    });
    return res.json(item);
});
// DELETE /api/inventory/:id - удаление товара со склада
router.delete("/:id", (0, checkRole_1.checkRole)(["DIRECTOR", "ADMIN", "ZAVHOZ"]), async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ message: "Invalid id" });
    }
    try {
        await prisma_1.prisma.inventoryItem.delete({ where: { id } });
    }
    catch (error) {
        if (error?.code === "P2025") {
            return res.status(204).send();
        }
        throw error;
    }
    return res.status(204).send();
});
// POST /api/inventory/generate-shopping-list
// TODO: Cron job для проверки сроков годности и создания уведомлений.
router.post("/generate-shopping-list", (0, checkRole_1.checkRole)(["DIRECTOR", "DEPUTY", "ADMIN", "ZAVHOZ"]), (0, validate_1.validate)(inventory_schema_1.generateShoppingListSchema), async (req, res) => {
    // Вход: { startDate, endDate }
    // Бизнес-логика: суммировать блюда из меню через MenuDish -> Dish -> DishIngredient -> Ingredient, сопоставить с остатками
    const { startDate, endDate } = req.body;
    const menus = await prisma_1.prisma.menu.findMany({
        where: { date: { gte: new Date(startDate), lte: new Date(endDate) } },
        include: {
            meals: {
                include: {
                    dish: {
                        include: {
                            ingredients: {
                                include: {
                                    ingredient: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    // Суммируем требуемые ингредиенты из всех блюд
    const required = {};
    for (const menu of menus) {
        for (const menuDish of menu.meals) {
            const dish = menuDish.dish;
            for (const dishIng of dish.ingredients) {
                const ing = dishIng.ingredient;
                const key = `${ing.name}|${ing.unit}`;
                required[key] = required[key] || { qty: 0, unit: ing.unit };
                required[key].qty += dishIng.quantity;
            }
        }
    }
    const inventory = await prisma_1.prisma.inventoryItem.findMany({
        include: { ingredient: true }
    });
    const shoppingList = Object.entries(required).map(([key, val]) => {
        const [name, unit] = key.split("|");
        const stock = inventory.find((i) => i.ingredient?.name === name && i.ingredient?.unit === unit);
        const remaining = (val.qty - (stock?.quantity || 0));
        return { name, unit, requiredQty: val.qty, inStock: stock?.quantity || 0, toBuy: Math.max(remaining, 0) };
    });
    return res.json({ data: { period: { startDate, endDate }, items: shoppingList } });
});
exports.default = router;
