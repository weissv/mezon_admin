"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEmployeeSchema = exports.createEmployeeSchema = void 0;
// src/schemas/employee.schema.ts
const zod_1 = require("zod");
exports.createEmployeeSchema = zod_1.z.object({
    body: zod_1.z.object({
        firstName: zod_1.z.string().min(2, "Имя обязательно"),
        lastName: zod_1.z.string().min(2, "Фамилия обязательна"),
        middleName: zod_1.z.string().optional(),
        position: zod_1.z.string().min(2, "Должность обязательна"),
        rate: zod_1.z.number().positive("Ставка должна быть > 0"),
        hireDate: zod_1.z.string().datetime("Неверный формат даты"),
        fireDate: zod_1.z.string().datetime().nullable().optional(),
        contractEndDate: zod_1.z.string().datetime().nullable().optional(),
        medicalCheckupDate: zod_1.z.string().datetime().nullable().optional(),
        attestationDate: zod_1.z.string().datetime().nullable().optional(),
        branchId: zod_1.z.number().int().positive(),
        user: zod_1.z
            .object({
            email: zod_1.z.string().email(),
            password: zod_1.z.string().min(6),
            role: zod_1.z.enum(["DIRECTOR", "DEPUTY", "ADMIN", "TEACHER", "ACCOUNTANT"]),
        })
            .optional(),
    }),
});
exports.updateEmployeeSchema = zod_1.z.object({
    body: exports.createEmployeeSchema.shape.body.partial(),
    params: zod_1.z.object({ id: zod_1.z.string().regex(/^\d+$/) }),
});
