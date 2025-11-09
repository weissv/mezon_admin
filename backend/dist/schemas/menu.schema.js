"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertMenuSchema = exports.getMenuSchema = void 0;
// src/schemas/menu.schema.ts
const zod_1 = require("zod");
exports.getMenuSchema = zod_1.z.object({
    query: zod_1.z.object({
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
    }),
});
exports.upsertMenuSchema = zod_1.z.object({
    body: zod_1.z.object({
        date: zod_1.z.string().datetime(),
        ageGroup: zod_1.z.string().min(1),
        meals: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            dish: zod_1.z.string(),
            calories: zod_1.z.number().optional(),
            ingredients: zod_1.z
                .array(zod_1.z.object({
                name: zod_1.z.string(),
                qty: zod_1.z.coerce.number(),
                unit: zod_1.z.string(),
            }))
                .optional(),
        })),
    }),
});
