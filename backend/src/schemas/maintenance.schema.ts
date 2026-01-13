// src/schemas/maintenance.schema.ts
import { z } from "zod";

export const createMaintenanceSchema = z.object({
  body: z.object({
    title: z.string().min(3, "Наименование обязательно (минимум 3 символа)"),
    description: z.string().optional(),
    type: z.enum(["REPAIR", "ISSUE"]),
    // Поля для заявок типа ISSUE (выдача)
    unit: z.string().optional(),           // Ед.изм
    quantity: z.number().positive().optional(), // Кол-во
    itemCategory: z.enum(["STATIONERY", "HOUSEHOLD", "OTHER"]).optional(), // Категория товара
  }).refine((data) => {
    // Если тип ISSUE, то unit, quantity и itemCategory обязательны
    if (data.type === "ISSUE") {
      return data.unit && data.quantity && data.itemCategory;
    }
    return true;
  }, {
    message: "Для заявки на выдачу обязательны: Ед.изм, Кол-во и Категория товара",
    path: ["type"],
  }),
});

export const updateMaintenanceSchema = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/) }),
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "IN_PROGRESS", "DONE"]).optional(),
    type: z.enum(["REPAIR", "ISSUE"]).optional(),
    // Поля для заявок типа ISSUE (выдача)
    unit: z.string().optional(),
    quantity: z.number().positive().optional(),
    itemCategory: z.enum(["STATIONERY", "HOUSEHOLD", "OTHER"]).optional(),
  }),
});
