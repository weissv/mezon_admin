export type Item = {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  expiryDate?: string;
  type: string;
};

export type ShoppingListItem = {
  name: string;
  unit: string;
  requiredQty: number;
  inStock: number;
  toBuy: number;
};
