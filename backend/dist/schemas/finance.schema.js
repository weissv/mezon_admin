"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportFinanceSchema = exports.createFinanceSchema = exports.listFinanceSchema = void 0;
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
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
    }),
});
exports.createFinanceSchema = zod_1.z.object({
    body: zod_1.z.object({
        amount: zod_1.z.coerce.number().nonnegative(),
        type: zod_1.z.enum(["INCOME", "EXPENSE"]),
        category: zod_1.z.enum(["NUTRITION", "CLUBS", "MAINTENANCE", "SALARY"]),
        description: zod_1.z.string().optional(),
        date: zod_1.z.string().datetime(),
        documentUrl: zod_1.z.string().url().optional().nullable(),
    }),
});
exports.reportFinanceSchema = zod_1.z.object({
    query: zod_1.z.object({
        period: zod_1.z.enum(["month", "year"]).optional(),
        category: zod_1.z.enum(["NUTRITION", "CLUBS", "MAINTENANCE", "SALARY"]).optional(),
    }),
});
