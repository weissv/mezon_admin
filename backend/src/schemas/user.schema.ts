// src/schemas/user.schema.ts
import { z } from "zod";

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().min(3, "Email/логин обязателен"),
    password: z.string().min(6, "Пароль должен быть минимум 6 символов"),
    role: z.enum(["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN", "TEACHER", "ACCOUNTANT", "ZAVHOZ"]),
    employeeId: z.number().int().positive("ID сотрудника обязателен"),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    email: z.string().min(3, "Email/логин обязателен").optional(),
    password: z.string().min(6, "Пароль должен быть минимум 6 символов").optional(),
    role: z.enum(["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN", "TEACHER", "ACCOUNTANT", "ZAVHOZ"]).optional(),
  }),
  params: z.object({ id: z.string().regex(/^\d+$/) }),
});

export type CreateUserBody = z.infer<typeof createUserSchema>["body"];
export type UpdateUserBody = z.infer<typeof updateUserSchema>["body"];
