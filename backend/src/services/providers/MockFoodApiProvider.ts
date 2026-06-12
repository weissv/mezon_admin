import { IFoodApiProvider, FoodApiIngredient } from '../interfaces/IFoodApiProvider';

// Моковые данные для тестирования (вместо реального запроса к Edamam/OpenFoodFacts)
const MOCK_DB: FoodApiIngredient[] = [
  { externalId: 'mock_apple', name: 'Яблоко свежее', calories: 52, proteins: 0.3, fats: 0.2, carbs: 14 },
  { externalId: 'mock_chicken', name: 'Куриное филе', calories: 165, proteins: 31, fats: 3.6, carbs: 0 },
  { externalId: 'mock_potato', name: 'Картофель', calories: 77, proteins: 2, fats: 0.1, carbs: 17 },
  { externalId: 'mock_milk', name: 'Молоко 3.2%', calories: 60, proteins: 3.2, fats: 3.2, carbs: 4.8 },
  { externalId: 'mock_beef', name: 'Говядина', calories: 250, proteins: 26, fats: 15, carbs: 0 },
];

export class MockFoodApiProvider implements IFoodApiProvider {
  async search(query: string): Promise<Pick<FoodApiIngredient, 'externalId' | 'name'>[]> {
    const lowerQuery = query.toLowerCase();
    return MOCK_DB
      .filter(item => item.name.toLowerCase().includes(lowerQuery))
      .map(item => ({ externalId: item.externalId, name: item.name }));
  }

  async getNutrients(externalId: string): Promise<FoodApiIngredient | null> {
    const item = MOCK_DB.find(i => i.externalId === externalId);
    return item || null;
  }
}
