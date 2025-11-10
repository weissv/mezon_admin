// src/routes/inventory.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";
import { validate } from "../middleware/validate";
import { listInventorySchema, generateShoppingListSchema } from "../schemas/inventory.schema";
const router = Router();

// GET /api/inventory
router.get("/", checkRole(["DEPUTY", "ADMIN"]), async (_req, res) => {
  const items = await prisma.inventoryItem.findMany({ orderBy: { name: "asc" } });
  // Фронт окрасит строки по срокам годности (<7 дней, просрочено)
  return res.json(items);
});

// POST /api/inventory/generate-shopping-list
// TODO: Cron job для проверки сроков годности и создания уведомлений.
router.post("/generate-shopping-list", checkRole(["DEPUTY", "ADMIN"]), validate(generateShoppingListSchema), async (req, res) => {
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
    const stock = inventory.find((i: any) => i.ingredient?.name === name && i.ingredient?.unit === unit);
    const remaining = (val.qty - (stock?.quantity || 0));
    return { name, unit, requiredQty: val.qty, inStock: stock?.quantity || 0, toBuy: Math.max(remaining, 0) };
  });

  return res.json({ period: { startDate, endDate }, items: shoppingList });
});
export default router;
