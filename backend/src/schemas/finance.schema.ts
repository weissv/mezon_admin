// src/schemas/finance.schema.ts
import { z } from "zod";

export const listFinanceSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    pageSize: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    type: z.enum(["INCOME", "EXPENSE"]).optional(),
    category: z.enum(["NUTRITION", "CLUBS", "MAINTENANCE", "SALARY"]).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

export const createFinanceSchema = z.object({
  body: z.object({
    amount: z.coerce.number().nonnegative(),
    type: z.enum(["INCOME", "EXPENSE"]),
    category: z.enum(["NUTRITION", "CLUBS", "MAINTENANCE", "SALARY"]),
    description: z.string().optional(),
    date: z.string().datetime(),
    documentUrl: z.string().url().optional().nullable(),
  }),
});

export const reportFinanceSchema = z.object({
  query: z.object({
    period: z.enum(["month", "year"]).optional(),
    category: z.enum(["NUTRITION", "CLUBS", "MAINTENANCE", "SALARY"]).optional(),
  }),
});
