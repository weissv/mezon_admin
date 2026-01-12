"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateShoppingListSchema = exports.updateInventorySchema = exports.createInventorySchema = exports.listInventorySchema = void 0;
// src/schemas/inventory.schema.ts
const zod_1 = require("zod");
exports.listInventorySchema = zod_1.z.object({
    query: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.createInventorySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Название обязательно"),
        quantity: zod_1.z.number().min(0, "Количество должно быть >= 0"),
        unit: zod_1.z.string().min(1, "Единица измерения обязательна"),
        expiryDate: zod_1.z.string().nullable().optional(),
        type: zod_1.z.enum(["FOOD", "HOUSEHOLD", "STATIONERY"]).optional().default("FOOD"),
    }),
});
exports.updateInventorySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).optional(),
        quantity: zod_1.z.number().min(0).optional(),
        unit: zod_1.z.string().min(1).optional(),
        expiryDate: zod_1.z.string().nullable().optional(),
        type: zod_1.z.enum(["FOOD", "HOUSEHOLD", "STATIONERY"]).optional(),
    }),
});
exports.generateShoppingListSchema = zod_1.z.object({
    body: zod_1.z.object({
        startDate: zod_1.z.string().datetime(),
        endDate: zod_1.z.string().datetime(),
    }),
});
