// src/schemas/calendar.schema.ts
import { z } from "zod";

export const createEventSchema = z.object({
  body: z.object({
    title: z.string().min(3, "Тема должна содержать не менее 3 символов"),
    date: z.string().datetime({ message: "Неверный формат даты" }),
    groupId: z.number().int().positive().nullable().optional(),
    organizer: z.string().min(2, "Укажите организатора"),
    performers: z.array(z.string()).default([]),
  }),
});

export const updateEventSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID должен быть числом"),
  }),
  body: z.object({
    title: z.string().min(3, "Тема должна содержать не менее 3 символов"),
    date: z.string().datetime({ message: "Неверный формат даты" }),
    groupId: z.number().int().positive().nullable().optional(),
    organizer: z.string().min(2, "Укажите организатора"),
    performers: z.array(z.string()).default([]),
  }),
});
