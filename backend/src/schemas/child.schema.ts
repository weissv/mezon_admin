// src/schemas/child.schema.ts
import { z } from "zod";

export const createChildSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, "Имя обязательно"),
    lastName: z.string().min(2, "Фамилия обязательна"),
    birthDate: z.string().datetime("Неверный формат даты"),
    groupId: z.number().int().positive("Группа обязательна"),
    healthInfo: z.string().optional(),
  }),
});

export const updateChildSchema = z.object({
  body: createChildSchema.shape.body.partial(),
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID должен быть числом"),
  }),
});
