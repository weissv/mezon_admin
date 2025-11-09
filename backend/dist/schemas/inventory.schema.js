"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateShoppingListSchema = exports.listInventorySchema = void 0;
// src/schemas/inventory.schema.ts
const zod_1 = require("zod");
exports.listInventorySchema = zod_1.z.object({
    query: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.generateShoppingListSchema = zod_1.z.object({
    body: zod_1.z.object({
        startDate: zod_1.z.string().datetime(),
        endDate: zod_1.z.string().datetime(),
    }),
});
