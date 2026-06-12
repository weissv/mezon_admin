import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DishService {
  /**
   * Рассчитывает общее КБЖУ для указанного блюда на основе его ингредиентов.
   * Формула: (macro_per_100g * weight_in_grams) / 100
   */
  async calculateDishMacros(dishId: number) {
    const dish = await prisma.dish.findUnique({
      where: { id: dishId },
      include: {
        ingredients: {
          include: {
            inventoryItem: true, // Здесь хранятся КБЖУ на 100г
          },
        },
      },
    });

    if (!dish) {
      throw new Error('Блюдо не найдено');
    }

    let totalCalories = 0;
    let totalProteins = 0;
    let totalFats = 0;
    let totalCarbs = 0;
    let totalWeight = 0;

    for (const item of dish.ingredients) {
      // Предполагается, что quantity (вес) в рецепте указан в граммах для КБЖУ
      // Если unit == 'кг', нужно переводить. Для упрощения считаем, что quantity = граммы, если unit='г'
      // В реальной системе нужно привести weight к граммам. 
      // Допустим, мы конвертируем quantity в зависимости от unit:
      let weightInGrams = item.quantity;
      if (item.inventoryItem.unit.toLowerCase() === 'кг' || item.inventoryItem.unit.toLowerCase() === 'l' || item.inventoryItem.unit.toLowerCase() === 'л') {
        weightInGrams *= 1000;
      }
      
      totalWeight += weightInGrams;

      const caloriesPer100g = item.inventoryItem.calories || 0;
      const proteinsPer100g = item.inventoryItem.protein || 0;
      const fatsPer100g = item.inventoryItem.fat || 0;
      const carbsPer100g = item.inventoryItem.carbs || 0;

      totalCalories += (caloriesPer100g * weightInGrams) / 100;
      totalProteins += (proteinsPer100g * weightInGrams) / 100;
      totalFats += (fatsPer100g * weightInGrams) / 100;
      totalCarbs += (carbsPer100g * weightInGrams) / 100;
    }

    return {
      dishId: dish.id,
      dishName: dish.name,
      totalWeight,
      macros: {
        calories: Number(totalCalories.toFixed(2)),
        proteins: Number(totalProteins.toFixed(2)),
        fats: Number(totalFats.toFixed(2)),
        carbs: Number(totalCarbs.toFixed(2)),
      }
    };
  }
}

export default new DishService();
