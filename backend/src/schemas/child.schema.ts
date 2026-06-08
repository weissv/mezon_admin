// src/schemas/child.schema.ts
import { z } from "zod";

// --- Shared sub-schemas ---

export const healthInfoSchema = z.object({
  allergies: z.array(z.string()).optional().default([]),
  specialConditions: z.array(z.string()).optional().default([]),
  medications: z.array(z.string()).optional().default([]),
  notes: z.string().optional(),
});

export const parentInputSchema = z.object({
  id: z.number().int().positive().optional(), // present on update
  fullName: z.string().min(1, "ФИО родителя обязательно"),
  relation: z.string().min(1, "Укажите отношение (отец, мать, опекун)"),
  phone: z.string().optional(),
  email: z.string().email("Некорректный email").optional().or(z.literal("")),
  workplace: z.string().optional(),
});

const idParam = z.object({
  id: z.string().regex(/^\d+$/, "ID должен быть числом"),
});

export const contractInputSchema = z.object({
  id: z.number().int().positive().optional(),
  number: z.string().min(1, "Номер договора обязателен"),
  date: z.string().refine((v) => !isNaN(Date.parse(v)), "Неверный формат даты"),
  isActive: z.boolean().optional().default(true),
});

// --- Child body ---

const childBody = z.object({
  firstName: z.string().min(1, "Имя обязательно"),
  lastName: z.string().min(1, "Фамилия обязательна"),
  middleName: z.string().optional(),
  birthDate: z.string().refine((v) => !isNaN(Date.parse(v)), "Неверный формат даты рождения"),
  groupId: z.number().int().positive("Группа обязательна"),
  healthInfo: healthInfoSchema.optional(),
  address: z.string().optional(),
  nationality: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  birthCertificateNumber: z.string().optional(),
  
  // Contracts
  contractNumber: z.string().optional(), // @deprecated
  contractDate: z.string().refine((v) => !v || !isNaN(Date.parse(v)), "Неверный формат даты договора").optional(), // @deprecated
  contracts: z.array(contractInputSchema).optional(),

  // Orders
  admissionOrderNumber: z.string().optional(),
  admissionOrderDate: z.string().refine((v) => !v || !isNaN(Date.parse(v)), "Неверный формат даты").optional(),
  previousSchool: z.string().optional(),
  dismissalOrderNumber: z.string().optional(),
  dismissalOrderDate: z.string().refine((v) => !v || !isNaN(Date.parse(v)), "Неверный формат даты").optional(),
  nextSchool: z.string().optional(),

  // Parents array (new)
  parents: z.array(parentInputSchema).optional(),
  // Legacy fields for backward compat
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  parentPhone: z.string().optional(),
});

export const createChildSchema = z.object({
  body: childBody,
});

export const updateChildSchema = z.object({
  body: childBody.partial(),
  params: idParam,
});

// --- Absence schemas ---

export const createAbsenceSchema = z.object({
  body: z.object({
    startDate: z.string().refine((v) => !isNaN(Date.parse(v)), "Неверный формат даты начала"),
    endDate: z.string().refine((v) => !isNaN(Date.parse(v)), "Неверный формат даты окончания"),
    reason: z.string().optional(),
  }).refine(
    (data) => new Date(data.startDate) <= new Date(data.endDate),
    { message: "Дата начала не может быть позже даты окончания", path: ["endDate"] }
  ),
  params: idParam,
});

export const updateAbsenceSchema = z.object({
  body: z.object({
    startDate: z.string().refine((v) => !isNaN(Date.parse(v)), "Неверный формат даты начала").optional(),
    endDate: z.string().refine((v) => !isNaN(Date.parse(v)), "Неверный формат даты окончания").optional(),
    reason: z.string().optional(),
  }),
  params: z.object({
    absenceId: z.string().regex(/^\d+$/, "ID должен быть числом"),
  }),
});

// --- List query schema ---

export const childListQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    pageSize: z.string().regex(/^\d+$/).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    status: z.enum(["ACTIVE", "LEFT", "ARCHIVED"]).optional(),
    groupId: z.string().regex(/^\d+$/).optional(),
    search: z.string().optional(), // multi-field search
    gender: z.enum(["MALE", "FEMALE"]).optional(),
  }),
});
