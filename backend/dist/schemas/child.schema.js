"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateChildSchema = exports.createChildSchema = void 0;
// src/schemas/child.schema.ts
const zod_1 = require("zod");
exports.createChildSchema = zod_1.z.object({
    body: zod_1.z.object({
        firstName: zod_1.z.string().min(2, "Имя обязательно"),
        lastName: zod_1.z.string().min(2, "Фамилия обязательна"),
        birthDate: zod_1.z.string().datetime("Неверный формат даты"),
        groupId: zod_1.z.number().int().positive("Группа обязательна"),
        healthInfo: zod_1.z.string().optional(),
    }),
});
exports.updateChildSchema = zod_1.z.object({
    body: exports.createChildSchema.shape.body.partial(),
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, "ID должен быть числом"),
    }),
});
