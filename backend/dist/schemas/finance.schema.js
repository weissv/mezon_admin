"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summaryFinanceSchema = exports.reportFinanceSchema = exports.updateFinanceSchema = exports.createFinanceSchema = exports.listFinanceSchema = void 0;
// src/schemas/finance.schema.ts
const zod_1 = require("zod");
exports.listFinanceSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        pageSize: zod_1.z.string().optional(),
        sortBy: zod_1.z.string().optional(),
        sortOrder: zod_1.z.enum(["asc", "desc"]).optional(),
        type: zod_1.z.enum(["INCOME", "EXPENSE"]).optional(),
        category: zod_1.z.enum(["NUTRITION", "CLUBS", "MAINTENANCE", "SALARY"]).optional(),
        startDate: zod_1.z.coerce.date().optional(),
        endDate: zod_1.z.coerce.date().optional(),
    }),
});
exports.createFinanceSchema = zod_1.z.object({
    body: zod_1.z.object({
        amount: zod_1.z.coerce.number().nonnegative(),
        type: zod_1.z.enum(["INCOME", "EXPENSE"]),
        category: zod_1.z.enum(["NUTRITION", "CLUBS", "MAINTENANCE", "SALARY"]),
        description: zod_1.z.string().optional(),
        date: zod_1.z.coerce.date(),
        documentUrl: zod_1.z.string().url().optional().nullable(),
        source: zod_1.z.enum(["BUDGET", "EXTRA_BUDGET"]).optional(),
        clubId: zod_1.z.coerce.number().optional(),
    }),
});
exports.updateFinanceSchema = exports.createFinanceSchema.extend({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
});
exports.reportFinanceSchema = zod_1.z.object({
    query: zod_1.z.object({
        period: zod_1.z.enum(["month", "year"]).optional(),
        category: zod_1.z.enum(["NUTRITION", "CLUBS", "MAINTENANCE", "SALARY"]).optional(),
    }),
});
exports.summaryFinanceSchema = zod_1.z.object({
    query: zod_1.z.object({
        startDate: zod_1.z.coerce.date().optional(),
        endDate: zod_1.z.coerce.date().optional(),
        groupBy: zod_1.z.enum(["month", "quarter", "year"]).optional(),
    }),
});
