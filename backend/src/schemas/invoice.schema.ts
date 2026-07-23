import { z } from "zod";

const idParam = z.object({
  id: z.string().regex(/^\d+$/, "ID должен быть числом"),
});

export const createInvoiceSchema = z.object({
  body: z.object({
    childId: z.number().int().positive("Ребенок обязателен"),
    contractId: z.number().int().positive().optional().nullable(),
    amount: z.number().positive("Сумма должна быть больше 0"),
    issueDate: z.string().refine((v) => !isNaN(Date.parse(v)), "Неверный формат даты выставления"),
    dueDate: z.string().refine((v) => !isNaN(Date.parse(v)), "Неверный формат срока оплаты"),
    status: z.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED"]).optional().default("PENDING"),
    period: z.string().regex(/^\d{4}-\d{2}$/, "Период должен быть в формате ГГГГ-ММ (например, 2026-09)"),
    description: z.string().optional().nullable(),
  }),
});

export const generateInvoicesSchema = z.object({
  body: z.object({
    period: z.string().regex(/^\d{4}-\d{2}$/, "Период должен быть в формате ГГГГ-ММ").optional(),
    issueDate: z.string().refine((v) => !v || !isNaN(Date.parse(v)), "Неверный формат даты выставления").optional(),
    dueDate: z.string().refine((v) => !v || !isNaN(Date.parse(v)), "Неверный формат срока оплаты").optional(),
    groupId: z.number().int().positive().optional(),
  }),
});

export const updateInvoiceStatusSchema = z.object({
  params: idParam,
  body: z.object({
    status: z.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED"], {
      required_error: "Статус обязателен",
    }),
  }),
});

export const listInvoicesQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    pageSize: z.string().regex(/^\d+$/).optional(),
    status: z.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED"]).optional(),
    groupId: z.string().regex(/^\d+$/).optional(),
    childId: z.string().regex(/^\d+$/).optional(),
    period: z.string().optional(),
    search: z.string().optional(),
  }),
});
