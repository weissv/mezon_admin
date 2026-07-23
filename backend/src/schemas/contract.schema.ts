import { z } from "zod";

const idParam = z.object({
  id: z.string().regex(/^\d+$/, "ID должен быть числом"),
});

const childIdParam = z.object({
  childId: z.string().regex(/^\d+$/, "childId должен быть числом"),
});

export const createContractSchema = z.object({
  params: childIdParam,
  body: z.object({
    contractNumber: z.string().min(1, "Номер договора обязателен"),
    startDate: z.string().refine((v) => !isNaN(Date.parse(v)), "Неверный формат даты начала"),
    endDate: z.string().refine((v) => !v || !isNaN(Date.parse(v)), "Неверный формат даты окончания").optional().nullable(),
    monthlyFee: z.number().positive("Ежемесячная плата должна быть больше 0"),
    status: z.enum(["ACTIVE", "TERMINATED", "EXPIRED"]).optional().default("ACTIVE"),
    fileUrl: z.string().url("Некорректный URL файла").optional().nullable().or(z.literal("")),
  }),
});

export const updateContractSchema = z.object({
  params: idParam,
  body: z.object({
    contractNumber: z.string().min(1, "Номер договора обязателен").optional(),
    startDate: z.string().refine((v) => !isNaN(Date.parse(v)), "Неверный формат даты начала").optional(),
    endDate: z.string().refine((v) => !v || !isNaN(Date.parse(v)), "Неверный формат даты окончания").optional().nullable(),
    monthlyFee: z.number().positive("Ежемесячная плата должна быть больше 0").optional(),
    status: z.enum(["ACTIVE", "TERMINATED", "EXPIRED"]).optional(),
    fileUrl: z.string().url("Некорректный URL файла").optional().nullable().or(z.literal("")),
  }),
});
