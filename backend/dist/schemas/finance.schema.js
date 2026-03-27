"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listDebtorsSchema = exports.listBalancesSchema = exports.listInvoicesSchema = exports.summaryFinanceSchema = exports.reportFinanceSchema = exports.listFinanceSchema = void 0;
// src/schemas/finance.schema.ts
const zod_1 = require("zod");
const FINANCE_CATEGORIES = ["NUTRITION", "CLUBS", "MAINTENANCE", "SALARY", "OTHER"];
const FINANCE_CHANNELS = ["CASH", "BANK"];
const INVOICE_DIRECTIONS = ["INCOMING", "OUTGOING"];
exports.listFinanceSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        pageSize: zod_1.z.string().optional(),
        sortBy: zod_1.z.string().optional(),
        sortOrder: zod_1.z.enum(["asc", "desc"]).optional(),
        type: zod_1.z.enum(["INCOME", "EXPENSE"]).optional(),
        category: zod_1.z.enum(FINANCE_CATEGORIES).optional(),
        channel: zod_1.z.enum(FINANCE_CHANNELS).optional(),
        posted: zod_1.z.enum(["true", "false"]).optional(),
        contractorId: zod_1.z.string().regex(/^\d+$/).optional(),
        personId: zod_1.z.string().regex(/^\d+$/).optional(),
        cashFlowArticleId: zod_1.z.string().regex(/^\d+$/).optional(),
        startDate: zod_1.z.coerce.date().optional(),
        endDate: zod_1.z.coerce.date().optional(),
        search: zod_1.z.string().optional(),
    }),
});
exports.reportFinanceSchema = zod_1.z.object({
    query: zod_1.z.object({
        period: zod_1.z.enum(["month", "year"]).optional(),
        category: zod_1.z.enum(FINANCE_CATEGORIES).optional(),
        channel: zod_1.z.enum(FINANCE_CHANNELS).optional(),
    }),
});
exports.summaryFinanceSchema = zod_1.z.object({
    query: zod_1.z.object({
        startDate: zod_1.z.coerce.date().optional(),
        endDate: zod_1.z.coerce.date().optional(),
        groupBy: zod_1.z.enum(["month", "quarter", "year"]).optional(),
        channel: zod_1.z.enum(FINANCE_CHANNELS).optional(),
    }),
});
exports.listInvoicesSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        pageSize: zod_1.z.string().optional(),
        sortBy: zod_1.z.string().optional(),
        sortOrder: zod_1.z.enum(["asc", "desc"]).optional(),
        direction: zod_1.z.enum(INVOICE_DIRECTIONS).optional(),
        contractorId: zod_1.z.string().regex(/^\d+$/).optional(),
        posted: zod_1.z.enum(["true", "false"]).optional(),
        startDate: zod_1.z.coerce.date().optional(),
        endDate: zod_1.z.coerce.date().optional(),
    }),
});
exports.listBalancesSchema = zod_1.z.object({
    query: zod_1.z.object({
        snapshotDate: zod_1.z.coerce.date().optional(),
    }),
});
exports.listDebtorsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        pageSize: zod_1.z.string().optional(),
        sortBy: zod_1.z.string().optional(),
        sortOrder: zod_1.z.enum(["asc", "desc"]).optional(),
    }),
});
