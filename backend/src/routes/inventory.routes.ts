// src/routes/inventory.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";
import { validate } from "../middleware/validate";
import { listInventorySchema, generateShoppingListSchema, createInventorySchema, updateInventorySchema } from "../schemas/inventory.schema";
const router = Router();

// GET /api/inventory/search - поиск товаров для автозаполнения
// ВАЖНО: этот маршрут должен быть ДО /:id, чтобы не конфликтовать
router.get("/search", checkRole(["DIRECTOR", "DEPUTY", "ADMIN", "ZAVHOZ", "TEACHER"]), async (req, res) => {
  const query = (req.query.q as string) || "";
  if (!query || query.trim().length < 1) {
    return res.json([]);
  }
  
  const items = await prisma.inventoryItem.findMany({
    where: {
      name: {
        contains: query.trim(),
        mode: "insensitive",
      },
    },
    select: {
      name: true,
      unit: true,
    },
    take: 10,
    orderBy: { name: "asc" },
  });
  
  return res.json(items);
});

// GET /api/inventory
router.get("/", checkRole(["DIRECTOR", "DEPUTY", "ADMIN", "ZAVHOZ"]), async (_req, res) => {
  const items = await prisma.inventoryItem.findMany({ orderBy: { name: "asc" } });
  // Фронт окрасит строки по срокам годности (<7 дней, просрочено)
  return res.json(items);
});

// POST /api/inventory - создание товара
router.post("/", checkRole(["DIRECTOR", "ADMIN", "ZAVHOZ"]), validate(createInventorySchema), async (req, res) => {
  const { name, quantity, unit, expiryDate, type } = req.body;
  const item = await prisma.inventoryItem.create({
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
router.put("/:id", checkRole(["DIRECTOR", "ADMIN", "ZAVHOZ"]), validate(updateInventorySchema), async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "Invalid id" });
  }
  const { name, quantity, unit, expiryDate, type } = req.body;
  const item = await prisma.inventoryItem.update({
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
router.delete("/:id", checkRole(["DIRECTOR", "ADMIN", "ZAVHOZ"]), async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "Invalid id" });
  }
  try {
    await prisma.inventoryItem.delete({ where: { id } });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return res.status(204).send();
    }
    throw error;
  }
  return res.status(204).send();
});

// POST /api/inventory/generate-shopping-list
// TODO: Cron job для проверки сроков годности и создания уведомлений.
router.post("/generate-shopping-list", checkRole(["DIRECTOR", "DEPUTY", "ADMIN", "ZAVHOZ"]), validate(generateShoppingListSchema), async (req, res) => {
  // Вход: { startDate, endDate }
  // Бизнес-логика: суммировать блюда из меню через MenuDish -> Dish -> DishIngredient -> Ingredient, сопоставить с остатками
  const { startDate, endDate } = req.body as { startDate: string; endDate: string };
  const menus = await prisma.menu.findMany({
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
  const required: Record<string, { qty: number; unit: string }> = {};
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

  const inventory = await prisma.inventoryItem.findMany({
    include: { ingredient: true }
  });
  
  const shoppingList = Object.entries(required).map(([key, val]) => {
    const [name, unit] = key.split("|");
    // Находим товар на складе по имени и единице измерения
    // Проверяем как по связанному ингредиенту, так и по имени самого товара
    const stock = inventory.find((i) => 
      (i.ingredient?.name === name && i.ingredient?.unit === unit) || 
      (i.name === name && i.unit === unit)
    );
    const remaining = (val.qty - (stock?.quantity || 0));
    return { name, unit, requiredQty: val.qty, inStock: stock?.quantity || 0, toBuy: Math.max(remaining, 0) };
  });

  return res.json({ data: { period: { startDate, endDate }, items: shoppingList } });
});
export default router;
