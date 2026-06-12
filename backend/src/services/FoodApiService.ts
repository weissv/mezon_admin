import { IFoodApiProvider, FoodApiIngredient } from './interfaces/IFoodApiProvider';
import { OpenFoodFactsProvider } from './providers/OpenFoodFactsProvider';

export class FoodApiService {
  private provider: IFoodApiProvider;

  // DI через конструктор (позволяет легко подменить на реальный API провайдер)
  constructor(provider: IFoodApiProvider = new OpenFoodFactsProvider()) {
    this.provider = provider;
  }

  async searchIngredients(query: string) {
    if (!query) return [];
    return this.provider.search(query);
  }

  async getIngredientNutrients(externalId: string): Promise<FoodApiIngredient | null> {
    if (!externalId) return null;
    return this.provider.getNutrients(externalId);
  }
}

// Экспортируем синглтон для использования в Express
export default new FoodApiService();
