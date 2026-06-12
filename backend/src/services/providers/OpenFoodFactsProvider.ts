import axios from 'axios';
import { IFoodApiProvider, FoodApiIngredient } from '../interfaces/IFoodApiProvider';

export class OpenFoodFactsProvider implements IFoodApiProvider {
  private readonly baseUrl = 'https://ru.openfoodfacts.org';
  private readonly axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        // OpenFoodFacts requires a clear User-Agent identifying the app
        'User-Agent': 'MezonAdminERP/1.0 (Integration for internal school catering macros)',
      },
      timeout: 5000,
    });
  }

  async search(query: string): Promise<Pick<FoodApiIngredient, 'externalId' | 'name'>[]> {
    try {
      // https://ru.openfoodfacts.org/cgi/search.pl?search_terms=query&search_simple=1&action=process&json=1&page_size=10
      const response = await this.axiosInstance.get('/cgi/search.pl', {
        params: {
          search_terms: query,
          search_simple: 1,
          action: 'process',
          json: 1,
          page_size: 10,
        },
      });

      const products = response.data?.products || [];

      return products.map((product: any) => ({
        externalId: product.code,
        name: product.product_name_ru || product.product_name || 'Неизвестный продукт',
      })).filter((p: any) => p.externalId); // Фильтруем те, у которых нет ID
    } catch (error) {
      console.error('OpenFoodFacts Search Error:', error);
      return [];
    }
  }

  async getNutrients(externalId: string): Promise<FoodApiIngredient | null> {
    try {
      const response = await this.axiosInstance.get(`/api/v2/product/${externalId}.json`);
      const productData = response.data?.product;

      if (!productData) {
        return null;
      }

      const nutriments = productData.nutriments || {};

      return {
        externalId: productData.code,
        name: productData.product_name_ru || productData.product_name || 'Неизвестный продукт',
        calories: Number(nutriments['energy-kcal_100g']) || 0,
        proteins: Number(nutriments['proteins_100g']) || 0,
        fats: Number(nutriments['fat_100g'] ?? nutriments['fats_100g']) || 0,
        carbs: Number(nutriments['carbohydrates_100g']) || 0,
      };
    } catch (error) {
      console.error(`OpenFoodFacts Nutrients Error for ${externalId}:`, error);
      return null;
    }
  }
}
