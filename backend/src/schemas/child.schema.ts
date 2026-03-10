// src/schemas/child.schema.ts
import { z } from "zod";

export const createChildSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, "Имя обязательно"),
    lastName: z.string().min(1, "Фамилия обязательна"),
    middleName: z.string().optional(),
    birthDate: z.string().datetime("Неверный формат даты"),
    groupId: z.number().int().positive("Группа обязательна"),
    healthInfo: z.string().optional(),
    address: z.string().optional(),
    nationality: z.string().optional(),
    gender: z.string().optional(),
    birthCertificateNumber: z.string().optional(),
    fatherName: z.string().optional(),
    motherName: z.string().optional(),
    parentPhone: z.string().optional(),
    contractNumber: z.string().optional(),
    contractDate: z.string().optional(),
  }),
});

export const updateChildSchema = z.object({
  body: createChildSchema.shape.body.partial(),
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID должен быть числом"),
  }),
});
