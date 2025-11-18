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
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),
});

export const createFinanceSchema = z.object({
  body: z.object({
    amount: z.coerce.number().nonnegative(),
    type: z.enum(["INCOME", "EXPENSE"]),
    category: z.enum(["NUTRITION", "CLUBS", "MAINTENANCE", "SALARY"]),
    description: z.string().optional(),
    date: z.coerce.date(),
    documentUrl: z.string().url().optional().nullable(),
    source: z.enum(["BUDGET", "EXTRA_BUDGET"]).optional(),
    clubId: z.coerce.number().optional(),
  }),
});

export const updateFinanceSchema = createFinanceSchema.extend({
  params: z.object({
    id: z.string().regex(/^\d+$/),
  }),
});

export const reportFinanceSchema = z.object({
  query: z.object({
    period: z.enum(["month", "year"]).optional(),
    category: z.enum(["NUTRITION", "CLUBS", "MAINTENANCE", "SALARY"]).optional(),
  }),
});

export const summaryFinanceSchema = z.object({
  query: z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    groupBy: z.enum(["month", "quarter", "year"]).optional(),
  }),
});
