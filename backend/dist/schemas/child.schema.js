"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.childListQuerySchema = exports.updateAbsenceSchema = exports.createAbsenceSchema = exports.updateChildSchema = exports.createChildSchema = exports.parentInputSchema = exports.healthInfoSchema = void 0;
// src/schemas/child.schema.ts
const zod_1 = require("zod");
// --- Shared sub-schemas ---
exports.healthInfoSchema = zod_1.z.object({
    allergies: zod_1.z.array(zod_1.z.string()).optional().default([]),
    specialConditions: zod_1.z.array(zod_1.z.string()).optional().default([]),
    medications: zod_1.z.array(zod_1.z.string()).optional().default([]),
    notes: zod_1.z.string().optional(),
});
exports.parentInputSchema = zod_1.z.object({
    id: zod_1.z.number().int().positive().optional(), // present on update
    fullName: zod_1.z.string().min(1, "ФИО родителя обязательно"),
    relation: zod_1.z.string().min(1, "Укажите отношение (отец, мать, опекун)"),
    phone: zod_1.z.string().optional(),
    email: zod_1.z.string().email("Некорректный email").optional().or(zod_1.z.literal("")),
    workplace: zod_1.z.string().optional(),
});
const idParam = zod_1.z.object({
    id: zod_1.z.string().regex(/^\d+$/, "ID должен быть числом"),
});
// --- Child body ---
const childBody = zod_1.z.object({
    firstName: zod_1.z.string().min(1, "Имя обязательно"),
    lastName: zod_1.z.string().min(1, "Фамилия обязательна"),
    middleName: zod_1.z.string().optional(),
    birthDate: zod_1.z.string().refine((v) => !isNaN(Date.parse(v)), "Неверный формат даты рождения"),
    groupId: zod_1.z.number().int().positive("Группа обязательна"),
    healthInfo: exports.healthInfoSchema.optional(),
    address: zod_1.z.string().optional(),
    nationality: zod_1.z.string().optional(),
    gender: zod_1.z.enum(["MALE", "FEMALE"]).optional(),
    birthCertificateNumber: zod_1.z.string().optional(),
    contractNumber: zod_1.z.string().optional(),
    contractDate: zod_1.z.string().refine((v) => !v || !isNaN(Date.parse(v)), "Неверный формат даты договора").optional(),
    // Parents array (new)
    parents: zod_1.z.array(exports.parentInputSchema).optional(),
    // Legacy fields for backward compat
    fatherName: zod_1.z.string().optional(),
    motherName: zod_1.z.string().optional(),
    parentPhone: zod_1.z.string().optional(),
});
exports.createChildSchema = zod_1.z.object({
    body: childBody,
});
exports.updateChildSchema = zod_1.z.object({
    body: childBody.partial(),
    params: idParam,
});
// --- Absence schemas ---
exports.createAbsenceSchema = zod_1.z.object({
    body: zod_1.z.object({
        startDate: zod_1.z.string().refine((v) => !isNaN(Date.parse(v)), "Неверный формат даты начала"),
        endDate: zod_1.z.string().refine((v) => !isNaN(Date.parse(v)), "Неверный формат даты окончания"),
        reason: zod_1.z.string().optional(),
    }).refine((data) => new Date(data.startDate) <= new Date(data.endDate), { message: "Дата начала не может быть позже даты окончания", path: ["endDate"] }),
    params: idParam,
});
exports.updateAbsenceSchema = zod_1.z.object({
    body: zod_1.z.object({
        startDate: zod_1.z.string().refine((v) => !isNaN(Date.parse(v)), "Неверный формат даты начала").optional(),
        endDate: zod_1.z.string().refine((v) => !isNaN(Date.parse(v)), "Неверный формат даты окончания").optional(),
        reason: zod_1.z.string().optional(),
    }),
    params: zod_1.z.object({
        absenceId: zod_1.z.string().regex(/^\d+$/, "ID должен быть числом"),
    }),
});
// --- List query schema ---
exports.childListQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).optional(),
        pageSize: zod_1.z.string().regex(/^\d+$/).optional(),
        sortBy: zod_1.z.string().optional(),
        sortOrder: zod_1.z.enum(["asc", "desc"]).optional(),
        status: zod_1.z.enum(["ACTIVE", "LEFT", "ARCHIVED"]).optional(),
        groupId: zod_1.z.string().regex(/^\d+$/).optional(),
        search: zod_1.z.string().optional(), // multi-field search
        gender: zod_1.z.enum(["MALE", "FEMALE"]).optional(),
    }),
});
