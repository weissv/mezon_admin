// src/routes/recipes.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";

const router = Router();

// --- Ingredient CRUD ---

// GET /api/recipes/ingredients - List all ingredients (from warehouse)
router.get("/ingredients", checkRole(["DEPUTY", "ADMIN", "ZAVHOZ"]), async (_req, res) => {
  const ingredients = await prisma.inventoryItem.findMany({
    where: { type: "FOOD" },
    orderBy: { name: "asc" },
  });
  
  return res.json(ingredients);
});

// POST /api/recipes/ingredients - Create new ingredient (warehouse item)
router.post("/ingredients", checkRole(["ADMIN", "ZAVHOZ"]), async (req, res) => {
  const { name, unit, calories, protein, fat, carbs } = req.body;
  
  const ingredient = await prisma.inventoryItem.create({
    data: {
      name,
      unit,
      quantity: 0,
      type: "FOOD",
      calories: calories || 0,
      protein: protein || 0,
      fat: fat || 0,
      carbs: carbs || 0,
    },
  });
  
  return res.status(201).json(ingredient);
});

// PUT /api/recipes/ingredients/:id - Update ingredient
router.put("/ingredients/:id", checkRole(["ADMIN", "ZAVHOZ"]), async (req, res) => {
  const { id } = req.params;
  const { name, unit, calories, protein, fat, carbs } = req.body;
  
  const ingredient = await prisma.inventoryItem.update({
    where: { id: Number(id) },
    data: {
      name,
      unit,
      calories,
      protein,
      fat,
      carbs,
    },
  });
  
  return res.json(ingredient);
});

// DELETE /api/recipes/ingredients/:id - Delete ingredient
router.delete("/ingredients/:id", checkRole(["ADMIN", "ZAVHOZ"]), async (req, res) => {
  const { id } = req.params;
  
  await prisma.inventoryItem.delete({
    where: { id: Number(id) },
  });
  
  return res.status(204).send();
});

// --- Dish CRUD ---

// GET /api/recipes/dishes - List all dishes
router.get("/dishes", checkRole(["DEPUTY", "ADMIN", "ZAVHOZ"]), async (_req, res) => {
  const dishes = await prisma.dish.findMany({
    include: {
      ingredients: {
        include: {
          inventoryItem: { select: { id: true, name: true, unit: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });
  
  return res.json(dishes);
});

// POST /api/recipes/dishes - Create new dish with ingredients
router.post("/dishes", checkRole(["ADMIN", "ZAVHOZ"]), async (req, res) => {
  const { name, category, preparationTime, ingredients } = req.body;
  
  const dish = await prisma.dish.create({
    data: {
      name,
      category: category || null,
      preparationTime: preparationTime || null,
      ingredients: {
        create: ingredients.map((item: any) => ({
          ingredientId: item.ingredientId,
          quantity: item.quantity,
        })),
      },
    },
    include: {
      ingredients: {
        include: {
          inventoryItem: { select: { id: true, name: true, unit: true } },
        },
      },
    },
  });
  
  return res.status(201).json(dish);
});

// PUT /api/recipes/dishes/:id - Update dish
router.put("/dishes/:id", checkRole(["ADMIN", "ZAVHOZ"]), async (req, res) => {
  const { id } = req.params;
  const { name, category, preparationTime, ingredients } = req.body;
  
  // Delete existing ingredients and create new ones
  await prisma.dishIngredient.deleteMany({
    where: { dishId: Number(id) },
  });
  
  const dish = await prisma.dish.update({
    where: { id: Number(id) },
    data: {
      name,
      category,
      preparationTime,
      ingredients: {
        create: ingredients.map((item: any) => ({
          ingredientId: item.ingredientId,
          quantity: item.quantity,
        })),
      },
    },
    include: {
      ingredients: {
        include: {
          inventoryItem: { select: { id: true, name: true, unit: true } },
        },
      },
    },
  });
  
  return res.json(dish);
});

// DELETE /api/recipes/dishes/:id - Delete dish
router.delete("/dishes/:id", checkRole(["ADMIN", "ZAVHOZ"]), async (req, res) => {
  const { id } = req.params;
  
  await prisma.dish.delete({
    where: { id: Number(id) },
  });
  
  return res.status(204).send();
});

// GET /api/recipes/dishes/:id/nutrition - Calculate nutrition info for dish
router.get("/dishes/:id/nutrition", checkRole(["DEPUTY", "ADMIN", "ZAVHOZ"]), async (req, res) => {
  const { id } = req.params;
  
  const dish = await prisma.dish.findUnique({
    where: { id: Number(id) },
    include: {
      ingredients: {
        include: {
          inventoryItem: true,
        },
      },
    },
  });
  
  if (!dish) {
    return res.status(404).json({ error: "Dish not found" });
  }
  
  // Calculate total KBJU (calories, protein, fat, carbs)
  type NutritionAcc = { calories: number; protein: number; fat: number; carbs: number };
  const nutrition = dish.ingredients.reduce(
    (acc: NutritionAcc, item: any): NutritionAcc => {
      const multiplier = item.quantity; // quantity in dish
      return {
        calories: acc.calories + item.inventoryItem.calories * multiplier,
        protein: acc.protein + item.inventoryItem.protein * multiplier,
        fat: acc.fat + item.inventoryItem.fat * multiplier,
        carbs: acc.carbs + item.inventoryItem.carbs * multiplier,
      };
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );
  
  return res.json({ dishId: dish.id, dishName: dish.name, ...nutrition });
});

export default router;
