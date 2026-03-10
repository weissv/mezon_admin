"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateChildSchema = exports.createChildSchema = void 0;
// src/schemas/child.schema.ts
const zod_1 = require("zod");
exports.createChildSchema = zod_1.z.object({
    body: zod_1.z.object({
        firstName: zod_1.z.string().min(1, "Имя обязательно"),
        lastName: zod_1.z.string().min(1, "Фамилия обязательна"),
        middleName: zod_1.z.string().optional(),
        birthDate: zod_1.z.string().datetime("Неверный формат даты"),
        groupId: zod_1.z.number().int().positive("Группа обязательна"),
        healthInfo: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        nationality: zod_1.z.string().optional(),
        gender: zod_1.z.string().optional(),
        birthCertificateNumber: zod_1.z.string().optional(),
        fatherName: zod_1.z.string().optional(),
        motherName: zod_1.z.string().optional(),
        parentPhone: zod_1.z.string().optional(),
        contractNumber: zod_1.z.string().optional(),
        contractDate: zod_1.z.string().optional(),
    }),
});
exports.updateChildSchema = zod_1.z.object({
    body: exports.createChildSchema.shape.body.partial(),
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, "ID должен быть числом"),
    }),
});
