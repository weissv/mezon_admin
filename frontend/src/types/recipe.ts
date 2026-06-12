// Recipe/Ingredient/Dish types
export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface DishIngredient {
  dishId: number;
  inventoryItemId: number;
  ingredientId?: number; // for backwards compatibility in forms
  quantity: number;
  inventoryItem?: Ingredient;
}

export interface Dish {
  id: number;
  name: string;
  category: string;
  ingredients?: DishIngredient[];
  totalWeight?: number;
  macros?: {
    calories: number;
    proteins: number;
    fats: number;
    carbs: number;
  };
}

export interface DishNutrition {
  dishId: number;
  dishName: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}
