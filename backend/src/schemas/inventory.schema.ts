// src/schemas/inventory.schema.ts
import { z } from "zod";

export const listInventorySchema = z.object({
  query: z.record(z.any()).optional(),
});

export const createInventorySchema = z.object({
  body: z.object({
    name: z.string().min(1, "Название обязательно"),
    quantity: z.number().min(0, "Количество должно быть >= 0"),
    unit: z.string().min(1, "Единица измерения обязательна"),
    expiryDate: z.string().nullable().optional(),
    type: z.enum(["FOOD", "HOUSEHOLD", "STATIONERY", "EQUIPMENT"]).optional().default("FOOD"),
    minQuantity: z.number().min(0).optional().default(0),
  }),
});

export const updateInventorySchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    quantity: z.number().min(0).optional(),
    unit: z.string().min(1).optional(),
    expiryDate: z.string().nullable().optional(),
    type: z.enum(["FOOD", "HOUSEHOLD", "STATIONERY", "EQUIPMENT"]).optional(),
    minQuantity: z.number().min(0).optional(),
  }),
});

export const generateShoppingListSchema = z.object({
  body: z.object({
    startDate: z.string(),
    endDate: z.string(),
  }),
});

export const createAuditSchema = z.object({
  body: z.object({
    notes: z.string().optional(),
    type: z.enum(["FOOD", "HOUSEHOLD", "STATIONERY", "EQUIPMENT"]).optional(),
  }),
});

export const updateAuditItemsSchema = z.object({
  body: z.object({
    notes: z.string().optional(),
    items: z.array(
      z.object({
        inventoryItemId: z.number(),
        actualQuantity: z.number().min(0).nullable().optional(),
        notes: z.string().optional(),
      })
    ),
  }),
});

export const importInventoryPreviewSchema = z.object({
  body: z.object({
    fileBase64: z.string().min(1, "Файл обязателен"),
  }),
});

export const applyInventoryImportSchema = z.object({
  body: z.object({
    fileBase64: z.string().min(1, "Файл обязателен"),
    skipErrors: z.boolean().optional().default(true),
  }),
});

