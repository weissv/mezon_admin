"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/finance.routes.ts
const express_1 = require("express");
const prisma_1 = require("../prisma");
const checkRole_1 = require("../middleware/checkRole");
const validate_1 = require("../middleware/validate");
const query_1 = require("../utils/query");
const finance_schema_1 = require("../schemas/finance.schema");
const router = (0, express_1.Router)();
const isValidDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());
const coerceDate = (value) => {
    if (value instanceof Date)
        return isValidDate(value) ? value : null;
    if (value === undefined || value === null || value === "")
        return null;
    const parsed = new Date(String(value));
    return isValidDate(parsed) ? parsed : null;
};
const appendDateRange = (where, start, end) => {
    const startDate = coerceDate(start);
    const endDate = coerceDate(end);
    if (!startDate && !endDate)
        return;
    where.date = {};
    if (startDate)
        where.date.gte = startDate;
    if (endDate)
        where.date.lte = endDate;
};
const normalizeClubId = (value) => {
    if (typeof value === "number" && !Number.isNaN(value))
        return value;
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        if (!Number.isNaN(parsed))
            return parsed;
    }
    return undefined;
};
// GET /api/finance/transactions
router.get("/transactions", (0, checkRole_1.checkRole)(["ACCOUNTANT", "DEPUTY", "ADMIN"]), (0, validate_1.validate)(finance_schema_1.listFinanceSchema), async (req, res) => {
    const query = req.query;
    const { skip, take } = (0, query_1.buildPagination)(query);
    const orderBy = (0, query_1.buildOrderBy)(query, ["date", "amount", "category", "type", "source", "id"]);
    const where = (0, query_1.buildWhere)(query, ["type", "category"]);
    appendDateRange(where, query.startDate, query.endDate);
    const [items, total] = await Promise.all([
        prisma_1.prisma.financeTransaction.findMany({ where, skip, take, orderBy }),
        prisma_1.prisma.financeTransaction.count({ where }),
    ]);
    return res.json({ items, total });
});
// POST /api/finance/transactions
router.post("/transactions", (0, checkRole_1.checkRole)(["ACCOUNTANT", "ADMIN"]), (0, validate_1.validate)(finance_schema_1.createFinanceSchema), async (req, res) => {
    const payload = req.body;
    const normalizedDate = coerceDate(payload.date);
    if (!normalizedDate) {
        return res.status(400).json({ message: "Invalid transaction date" });
    }
    const tx = await prisma_1.prisma.financeTransaction.create({
        data: {
            amount: payload.amount,
            type: payload.type,
            category: payload.category,
            description: payload.description,
            date: normalizedDate,
            documentUrl: payload.documentUrl,
            source: payload.source,
            clubId: normalizeClubId(payload.clubId),
        },
    });
    return res.status(201).json(tx);
});
// PUT /api/finance/transactions/:id
router.put("/transactions/:id", (0, checkRole_1.checkRole)(["ACCOUNTANT", "ADMIN"]), (0, validate_1.validate)(finance_schema_1.updateFinanceSchema), async (req, res) => {
    const payload = req.body;
    const normalizedDate = coerceDate(payload.date);
    if (!normalizedDate) {
        return res.status(400).json({ message: "Invalid transaction date" });
    }
    const id = Number(req.params.id);
    const tx = await prisma_1.prisma.financeTransaction.update({
        where: { id },
        data: {
            amount: payload.amount,
            type: payload.type,
            category: payload.category,
            description: payload.description,
            date: normalizedDate,
            documentUrl: payload.documentUrl,
            source: payload.source,
            clubId: normalizeClubId(payload.clubId),
        },
    });
    return res.json(tx);
});
// GET /api/finance/reports?period=month&category=CLUBS
router.get("/reports", (0, checkRole_1.checkRole)(["ACCOUNTANT", "DEPUTY", "ADMIN"]), (0, validate_1.validate)(finance_schema_1.reportFinanceSchema), async (req, res) => {
    const { period = "month", category } = req.query;
    const now = new Date();
    const start = period === "month"
        ? new Date(now.getFullYear(), now.getMonth(), 1)
        : new Date(now.getFullYear(), 0, 1);
    const where = { date: { gte: start } };
    if (category)
        where.category = String(category);
    const grouped = await prisma_1.prisma.financeTransaction.groupBy({
        by: ["type", "category"],
        _sum: { amount: true },
        where,
    });
    return res.json({ from: start, to: now, grouped });
});
// GET /api/finance/reports/summary - сводный отчет с группировкой
router.get("/reports/summary", (0, checkRole_1.checkRole)(["ACCOUNTANT", "DEPUTY", "ADMIN"]), (0, validate_1.validate)(finance_schema_1.summaryFinanceSchema), async (req, res) => {
    const { startDate, endDate, groupBy = "month" } = req.query;
    const where = {};
    appendDateRange(where, startDate, endDate);
    // Группировка по категории, типу, источнику
    const [byCategory, byType, bySource] = await Promise.all([
        prisma_1.prisma.financeTransaction.groupBy({
            by: ["category"],
            _sum: { amount: true },
            _count: { id: true },
            where,
        }),
        prisma_1.prisma.financeTransaction.groupBy({
            by: ["type"],
            _sum: { amount: true },
            _count: { id: true },
            where,
        }),
        prisma_1.prisma.financeTransaction.groupBy({
            by: ["source"],
            _sum: { amount: true },
            _count: { id: true },
            where,
        }),
    ]);
    // Общая статистика
    const totals = await prisma_1.prisma.financeTransaction.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where,
    });
    return res.json({
        period: { startDate, endDate },
        totals: {
            totalAmount: totals._sum.amount || 0,
            totalTransactions: totals._count.id,
        },
        byCategory,
        byType,
        bySource,
    });
});
// GET /api/finance/export - экспорт в CSV
router.get("/export", (0, checkRole_1.checkRole)(["ACCOUNTANT", "DEPUTY", "ADMIN"]), (0, validate_1.validate)(finance_schema_1.summaryFinanceSchema), async (req, res) => {
    const { startDate, endDate } = req.query;
    const where = {};
    appendDateRange(where, startDate, endDate);
    const transactions = await prisma_1.prisma.financeTransaction.findMany({
        where,
        orderBy: { date: "desc" },
        include: {
            club: { select: { name: true } },
        },
    });
    // Формируем CSV
    const header = "ID,Дата,Тип,Категория,Источник,Сумма,Описание,Кружок\n";
    const rows = transactions.map((t) => {
        const date = new Date(t.date).toISOString().split("T")[0];
        const club = t.club?.name || "";
        return `${t.id},${date},${t.type},${t.category},${t.source || ""},${t.amount},"${t.description || ""}","${club}"`;
    }).join("\n");
    const csv = header + rows;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=finance_export_${new Date().toISOString().split("T")[0]}.csv`);
    return res.send("\uFEFF" + csv); // BOM для правильной кодировки в Excel
});
exports.default = router;
