export interface FoodApiIngredient {
  externalId: string;
  name: string;
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
}

export interface IFoodApiProvider {
  /**
   * Ищет ингредиенты по названию.
   * Возвращает краткий список (без полных КБЖУ для оптимизации, либо с ними).
   */
  search(query: string): Promise<Pick<FoodApiIngredient, 'externalId' | 'name'>[]>;

  /**
   * Получает детальную информацию (КБЖУ) по конкретному ID ингредиента.
   */
  getNutrients(externalId: string): Promise<FoodApiIngredient | null>;
}
