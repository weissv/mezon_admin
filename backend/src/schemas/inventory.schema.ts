// src/schemas/inventory.schema.ts
import { z } from "zod";

export const listInventorySchema = z.object({
  query: z.record(z.any()).optional(),
});

export const generateShoppingListSchema = z.object({
  body: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }),
});
