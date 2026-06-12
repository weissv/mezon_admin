// src/routes/recipes.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";
import DishService from "../services/DishService";
import FoodApiService from "../services/FoodApiService";

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
  let { name, unit, calories, protein, fat, carbs } = req.body;
  
  // АВТОМАТИЧЕСКИЙ ПОДСЧЕТ КБЖУ ДЛЯ ПРОДУКТОВ ПИТАНИЯ (Если не указано вручную)
  if (!calories && !protein && !fat && !carbs) {
    try {
      const searchResults = await FoodApiService.searchIngredients(name);
      if (searchResults && searchResults.length > 0) {
        const topResultId = searchResults[0].externalId;
        const nutrients = await FoodApiService.getIngredientNutrients(topResultId);
        if (nutrients) {
          calories = nutrients.calories;
          protein = nutrients.proteins;
          fat = nutrients.fats;
          carbs = nutrients.carbs;
        }
      }
    } catch (e) {
      console.error("Auto-fetch nutrients failed:", e);
    }
  }

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
  let { name, unit, calories, protein, fat, carbs } = req.body;
  
  // АВТОМАТИЧЕСКИЙ ПОДСЧЕТ КБЖУ (Если очистили поля или обновляют название)
  if (!calories && !protein && !fat && !carbs) {
    try {
      const searchResults = await FoodApiService.searchIngredients(name);
      if (searchResults && searchResults.length > 0) {
        const topResultId = searchResults[0].externalId;
        const nutrients = await FoodApiService.getIngredientNutrients(topResultId);
        if (nutrients) {
          calories = nutrients.calories;
          protein = nutrients.proteins;
          fat = nutrients.fats;
          carbs = nutrients.carbs;
        }
      }
    } catch (e) {
      console.error("Auto-fetch nutrients failed:", e);
    }
  }

  const ingredient = await prisma.inventoryItem.update({
    where: { id: Number(id) },
    data: {
      name,
      unit,
      calories: calories || 0,
      protein: protein || 0,
      fat: fat || 0,
      carbs: carbs || 0,
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
          inventoryItem: true, // Fetch full inventory item for macros
        },
      },
    },
    orderBy: { name: "asc" },
  });
  
  const enrichedDishes = dishes.map(dish => {
    const macroData = DishService.calculateMacrosSync(dish);
    return {
      ...dish,
      macros: macroData.macros,
      totalWeight: macroData.totalWeight,
    };
  });

  return res.json(enrichedDishes);
});

// POST /api/recipes/dishes - Create new dish with ingredients
router.post("/dishes", checkRole(["ADMIN", "ZAVHOZ"]), async (req, res) => {
  const { name, category, ingredients } = req.body;
  
  const dish = await prisma.dish.create({
    data: {
      name,
      category: category || null,
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
          inventoryItem: true, // Fetch full for macros
        },
      },
    },
  });
  
  const macroData = DishService.calculateMacrosSync(dish);
  return res.status(201).json({
    ...dish,
    macros: macroData.macros,
    totalWeight: macroData.totalWeight
  });
});

// PUT /api/recipes/dishes/:id - Update dish
router.put("/dishes/:id", checkRole(["ADMIN", "ZAVHOZ"]), async (req, res) => {
  const { id } = req.params;
  const { name, category, ingredients } = req.body;
  
  // Delete existing ingredients and create new ones
  await prisma.dishIngredient.deleteMany({
    where: { dishId: Number(id) },
  });
  
  const dish = await prisma.dish.update({
    where: { id: Number(id) },
    data: {
      name,
      category,
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
          inventoryItem: true, // Fetch full for macros
        },
      },
    },
  });
  
  const macroData = DishService.calculateMacrosSync(dish);
  return res.json({
    ...dish,
    macros: macroData.macros,
    totalWeight: macroData.totalWeight
  });
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
  try {
    const { id } = req.params;
    const macros = await DishService.calculateDishMacros(Number(id));
    return res.json(macros);
  } catch (error: any) {
    return res.status(404).json({ error: error.message });
  }
});

export default router;
