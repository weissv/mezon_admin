import { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import FoodApiService from '../services/FoodApiService';

const prisma = new PrismaClient();

// Zod schema for hybrid ingredient creation
const createIngredientSchema = z.object({
  name: z.string().min(2, "Название обязательно"),
  unit: z.string().min(1, "Единица измерения обязательна"),
  price: z.coerce.number().min(0).default(0),
  // Гибридные поля КБЖУ
  externalApiId: z.string().optional().nullable(),
  calories: z.coerce.number().min(0).default(0),
  protein: z.coerce.number().min(0).default(0),
  fat: z.coerce.number().min(0).default(0),
  carbs: z.coerce.number().min(0).default(0),
}).refine(data => {
  // Если не передан ID из внешнего API, должны быть заполнены калории (хотя бы > 0, но это по бизнес-логике)
  // Мы просто разрешаем сохранять ручные значения.
  return true;
});

export class IngredientController {
  
  // GET /api/ingredients/search?q=apple
  async searchExternal(req: Request, res: Response) {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.json([]);
      }
      const results = await FoodApiService.searchIngredients(query);
      return res.json(results);
    } catch (error: any) {
      console.error('Ingredient search error:', error);
      return res.status(500).json({ error: 'Ошибка поиска ингредиентов' });
    }
  }

  // POST /api/ingredients
  async createHybrid(req: Request, res: Response) {
    try {
      const validatedData = createIngredientSchema.parse(req.body);
      
      let finalCalories = validatedData.calories;
      let finalProtein = validatedData.protein;
      let finalFat = validatedData.fat;
      let finalCarbs = validatedData.carbs;

      // Если передан externalApiId, пытаемся получить точные макросы из сервиса (игнорируем ручной ввод)
      if (validatedData.externalApiId) {
        const nutrients = await FoodApiService.getIngredientNutrients(validatedData.externalApiId);
        if (nutrients) {
          finalCalories = nutrients.calories;
          finalProtein = nutrients.proteins;
          finalFat = nutrients.fats;
          finalCarbs = nutrients.carbs;
        } else {
          return res.status(404).json({ error: 'Ингредиент не найден во внешнем API' });
        }
      }

      // Сохраняем в БД (InventoryItem с типом FOOD)
      const ingredient = await prisma.inventoryItem.create({
        data: {
          name: validatedData.name,
          unit: validatedData.unit,
          price: validatedData.price,
          quantity: 0, // Начальный остаток на складе
          type: 'FOOD',
          nutritionApiId: validatedData.externalApiId || null,
          calories: finalCalories,
          protein: finalProtein,
          fat: finalFat,
          carbs: finalCarbs,
        }
      });

      return res.status(201).json(ingredient);
    } catch (error: any) {
      console.error('Create ingredient error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Ошибка валидации данных', details: error.errors });
      }
      return res.status(500).json({ error: 'Внутренняя ошибка сервера при создании ингредиента' });
    }
  }
}

export default new IngredientController();
