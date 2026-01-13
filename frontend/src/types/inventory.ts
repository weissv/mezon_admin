// Типы для модуля Склад

// Типы соответствуют enum InventoryType в schema.prisma
export type InventoryType = 'FOOD' | 'HOUSEHOLD' | 'STATIONERY';

export type Item = {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  expiryDate?: string;
  type: InventoryType;
};

export type InventoryItem = {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  expiryDate?: string | null;
  type: InventoryType;
  ingredientId?: number | null;
  ingredient?: {
    id: number;
    name: string;
    unit: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

// Маппинг типов для отображения
export const inventoryTypeLabels: Record<InventoryType, string> = {
  FOOD: 'Продукты',
  HOUSEHOLD: 'Хоз. товары',
  STATIONERY: 'Канц. товары',
};

export const inventoryTypeColors: Record<InventoryType, string> = {
  FOOD: 'bg-green-100 text-green-800',
  HOUSEHOLD: 'bg-amber-100 text-amber-800',
  STATIONERY: 'bg-blue-100 text-blue-800',
};

export type ShoppingListItem = {
  name: string;
  unit: string;
  requiredQty: number;
  inStock: number;
  toBuy: number;
};
