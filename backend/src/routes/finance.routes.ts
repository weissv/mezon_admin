// src/routes/finance.routes.ts
import { Router } from "express";
import type { z } from "zod";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";
import { validate } from "../middleware/validate";
import { buildPagination, buildOrderBy, buildWhere } from "../utils/query";
import {
  createFinanceSchema,
  listFinanceSchema,
  reportFinanceSchema,
  summaryFinanceSchema,
  updateFinanceSchema,
} from "../schemas/finance.schema";

const router = Router();

type ListFinanceQuery = z.infer<typeof listFinanceSchema>["query"];
type CreateFinanceBody = z.infer<typeof createFinanceSchema>["body"];
type SummaryFinanceQuery = z.infer<typeof summaryFinanceSchema>["query"];
type ReportFinanceQuery = z.infer<typeof reportFinanceSchema>["query"];
type UpdateFinanceBody = z.infer<typeof updateFinanceSchema>["body"];

const isValidDate = (value: unknown): value is Date => value instanceof Date && !Number.isNaN(value.getTime());

const coerceDate = (value: unknown) => {
  if (value instanceof Date) return isValidDate(value) ? value : null;
  if (value === undefined || value === null || value === "") return null;
  const parsed = new Date(String(value));
  return isValidDate(parsed) ? parsed : null;
};

const appendDateRange = (where: Record<string, any>, start?: unknown, end?: unknown) => {
  const startDate = coerceDate(start);
  const endDate = coerceDate(end);
  if (!startDate && !endDate) return;
  where.date = {};
  if (startDate) where.date.gte = startDate;
  if (endDate) where.date.lte = endDate;
};

const normalizeClubId = (value: unknown) => {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return undefined;
};

// GET /api/finance/transactions
router.get(
  "/transactions",
  checkRole(["ACCOUNTANT", "DEPUTY", "ADMIN"]),
  validate(listFinanceSchema),
  async (req, res) => {
    const query = req.query as ListFinanceQuery;
    const { skip, take } = buildPagination(query);
    const orderBy = buildOrderBy(query, ["date", "amount", "category", "type", "source", "id"]);
    const where = buildWhere<any>(query, ["type", "category"]);
    appendDateRange(where, query.startDate, query.endDate);
  const [items, total] = await Promise.all([
    prisma.financeTransaction.findMany({ where, skip, take, orderBy }),
    prisma.financeTransaction.count({ where }),
  ]);
  return res.json({ items, total });
  }
);

// POST /api/finance/transactions
router.post(
  "/transactions",
  checkRole(["ACCOUNTANT", "ADMIN"]),
  validate(createFinanceSchema),
  async (req, res) => {
    const payload = req.body as CreateFinanceBody;
    const normalizedDate = coerceDate(payload.date);
    if (!normalizedDate) {
      return res.status(400).json({ message: "Invalid transaction date" });
    }

    const tx = await prisma.financeTransaction.create({
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
  }
);

// PUT /api/finance/transactions/:id
router.put(
  "/transactions/:id",
  checkRole(["ACCOUNTANT", "ADMIN"]),
  validate(updateFinanceSchema),
  async (req, res) => {
    const payload = req.body as UpdateFinanceBody;
    const normalizedDate = coerceDate(payload.date);
    if (!normalizedDate) {
      return res.status(400).json({ message: "Invalid transaction date" });
    }

    const id = Number(req.params.id);
    const tx = await prisma.financeTransaction.update({
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
  }
);

// DELETE /api/finance/transactions/:id
router.delete(
  "/transactions/:id",
  checkRole(["ACCOUNTANT", "ADMIN"]),
  async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    try {
      await prisma.financeTransaction.delete({ where: { id } });
    } catch (error: any) {
      if (error?.code === "P2025") {
        return res.status(204).send();
      }
      throw error;
    }
    return res.status(204).send();
  }
);

// GET /api/finance/reports?period=month&category=CLUBS
router.get(
  "/reports",
  checkRole(["ACCOUNTANT", "DEPUTY", "ADMIN"]),
  validate(reportFinanceSchema),
  async (req, res) => {
    const { period = "month", category } = req.query as ReportFinanceQuery;
  const now = new Date();
  const start =
    period === "month"
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : new Date(now.getFullYear(), 0, 1);

  const where: any = { date: { gte: start } };
  if (category) where.category = String(category);

  const grouped = await prisma.financeTransaction.groupBy({
    by: ["type", "category"],
    _sum: { amount: true },
    where,
  });

    return res.json({ from: start, to: now, grouped });
  }
);

// GET /api/finance/reports/summary - сводный отчет с группировкой
router.get(
  "/reports/summary",
  checkRole(["ACCOUNTANT", "DEPUTY", "ADMIN"]),
  validate(summaryFinanceSchema),
  async (req, res) => {
    const { startDate, endDate, groupBy = "month" } = req.query as SummaryFinanceQuery;
  
    const where: Record<string, any> = {};
    appendDateRange(where, startDate, endDate);

  // Группировка по категории, типу, источнику
  const [byCategory, byType, bySource] = await Promise.all([
    prisma.financeTransaction.groupBy({
      by: ["category"],
      _sum: { amount: true },
      _count: { id: true },
      where,
    }),
    prisma.financeTransaction.groupBy({
      by: ["type"],
      _sum: { amount: true },
      _count: { id: true },
      where,
    }),
    prisma.financeTransaction.groupBy({
      by: ["source"],
      _sum: { amount: true },
      _count: { id: true },
      where,
    }),
  ]);

  // Общая статистика
  const totals = await prisma.financeTransaction.aggregate({
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
  }
);

// GET /api/finance/export - экспорт в CSV
router.get(
  "/export",
  checkRole(["ACCOUNTANT", "DEPUTY", "ADMIN"]),
  validate(summaryFinanceSchema),
  async (req, res) => {
    const { startDate, endDate } = req.query as SummaryFinanceQuery;
  
    const where: Record<string, any> = {};
    appendDateRange(where, startDate, endDate);

  const transactions = await prisma.financeTransaction.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      club: { select: { name: true } },
    },
  });

  // Формируем CSV
  const header = "ID,Дата,Тип,Категория,Источник,Сумма,Описание,Кружок\n";
  const rows = transactions.map((t: any) => {
    const date = new Date(t.date).toISOString().split("T")[0];
    const club = t.club?.name || "";
    return `${t.id},${date},${t.type},${t.category},${t.source || ""},${t.amount},"${t.description || ""}","${club}"`;
  }).join("\n");

  const csv = header + rows;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=finance_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    return res.send("\uFEFF" + csv); // BOM для правильной кодировки в Excel
  }
);

export default router;
