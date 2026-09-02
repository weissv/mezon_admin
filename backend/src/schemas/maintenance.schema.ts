// src/schemas/maintenance.schema.ts
import { z } from "zod";

// Схема для отдельной позиции (товара) в заявке
const maintenanceItemSchema = z.object({
  name: z.string().min(1, "Наименование товара обязательно"),
  quantity: z.number().positive("Количество должно быть положительным"),
  unit: z.string().min(1, "Единица измерения обязательна"),
  category: z.enum(["STATIONERY", "HOUSEHOLD", "OTHER"]),
  inventoryItemId: z.number().int().positive().optional().nullable(), // Связь с товаром на складе
});

export const createMaintenanceSchema = z.object({
  body: z.object({
    title: z.string().min(3, "Наименование обязательно (минимум 3 символа)"),
    description: z.string().optional(),
    type: z.enum(["REPAIR", "ISSUE", "PURCHASE"]),
    // Массив позиций для заявок типа ISSUE (выдача) и PURCHASE (покупка)
    items: z.array(maintenanceItemSchema).optional(),
  }).refine((data) => {
    // Если тип ISSUE или PURCHASE, то items должен содержать хотя бы одну позицию
    if (data.type === "ISSUE" || data.type === "PURCHASE") {
      return data.items && data.items.length > 0;
    }
    return true;
  }, {
    message: "Для заявки на выдачу или покупку необходимо добавить хотя бы одну позицию",
    path: ["items"],
  }),
});

export const updateMaintenanceSchema = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/) }),
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "IN_PROGRESS", "DONE", "COMPLETED"]).optional(),
    type: z.enum(["REPAIR", "ISSUE", "PURCHASE"]).optional(),
    // Массив позиций для обновления (полная замена)
    items: z.array(maintenanceItemSchema).optional(),
  }),
});

// Схема для частичной или полной выдачи завхозом
export const fulfillMaintenanceSchema = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/) }),
  body: z.object({
    issuedItems: z.array(
      z.object({
        itemId: z.number().int().positive("ID позиции обязателен"),
        issuedQuantity: z.number().min(0, "Выданное количество не может быть отрицательным"),
      })
    ).min(1, "Необходимо указать хотя бы одну позицию для выдачи"),
  }),
});

