"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMaintenanceSchema = exports.createMaintenanceSchema = void 0;
// src/schemas/maintenance.schema.ts
const zod_1 = require("zod");
// Схема для отдельной позиции (товара) в заявке
const maintenanceItemSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Наименование товара обязательно"),
    quantity: zod_1.z.number().positive("Количество должно быть положительным"),
    unit: zod_1.z.string().min(1, "Единица измерения обязательна"),
    category: zod_1.z.enum(["STATIONERY", "HOUSEHOLD", "OTHER"]),
});
exports.createMaintenanceSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3, "Наименование обязательно (минимум 3 символа)"),
        description: zod_1.z.string().optional(),
        type: zod_1.z.enum(["REPAIR", "ISSUE"]),
        // Массив позиций для заявок типа ISSUE (выдача)
        items: zod_1.z.array(maintenanceItemSchema).optional(),
    }).refine((data) => {
        // Если тип ISSUE, то items должен содержать хотя бы одну позицию
        if (data.type === "ISSUE") {
            return data.items && data.items.length > 0;
        }
        return true;
    }, {
        message: "Для заявки на выдачу необходимо добавить хотя бы одну позицию",
        path: ["items"],
    }),
});
exports.updateMaintenanceSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().regex(/^\d+$/) }),
    body: zod_1.z.object({
        title: zod_1.z.string().min(3).optional(),
        description: zod_1.z.string().optional(),
        status: zod_1.z.enum(["PENDING", "APPROVED", "REJECTED", "IN_PROGRESS", "DONE"]).optional(),
        type: zod_1.z.enum(["REPAIR", "ISSUE"]).optional(),
        // Массив позиций для обновления (полная замена)
        items: zod_1.z.array(maintenanceItemSchema).optional(),
    }),
});
