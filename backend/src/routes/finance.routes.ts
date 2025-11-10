// src/routes/finance.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";
import { buildPagination, buildOrderBy, buildWhere } from "../utils/query";

const router = Router();

// GET /api/finance/transactions
router.get("/transactions", checkRole(["ACCOUNTANT", "DEPUTY", "ADMIN"]), async (req, res) => {
  const { skip, take } = buildPagination(req.query);
  const orderBy = buildOrderBy(req.query);
  const where = buildWhere<any>(req.query, ["type", "category"]);
  // Доп. фильтры по датам
  const { startDate, endDate } = req.query as any;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(String(startDate));
    if (endDate) where.date.lte = new Date(String(endDate));
  }
  const [items, total] = await Promise.all([
    prisma.financeTransaction.findMany({ where, skip, take, orderBy }),
    prisma.financeTransaction.count({ where }),
  ]);
  return res.json({ items, total });
});

// POST /api/finance/transactions
router.post("/transactions", checkRole(["ACCOUNTANT", "ADMIN"]), async (req, res) => {
  const tx = await prisma.financeTransaction.create({ data: req.body });
  return res.status(201).json(tx);
});

// GET /api/finance/reports?period=month&category=CLUBS
router.get("/reports", checkRole(["ACCOUNTANT", "DEPUTY", "ADMIN"]), async (req, res) => {
  const { period = "month", category } = req.query as any;
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
});

// GET /api/finance/reports/summary - сводный отчет с группировкой
router.get("/reports/summary", checkRole(["ACCOUNTANT", "DEPUTY", "ADMIN"]), async (req, res) => {
  const { startDate, endDate, groupBy = "month" } = req.query as any;
  
  const where: any = {};
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(String(startDate));
    if (endDate) where.date.lte = new Date(String(endDate));
  }

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
});

// GET /api/finance/export - экспорт в CSV
router.get("/export", checkRole(["ACCOUNTANT", "DEPUTY", "ADMIN"]), async (req, res) => {
  const { startDate, endDate } = req.query as any;
  
  const where: any = {};
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(String(startDate));
    if (endDate) where.date.lte = new Date(String(endDate));
  }

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
  res.setHeader("Content-Disposition", `attachment; filename=finance_export_${new Date().toISOString().split("T")[0]}.csv`);
  return res.send("\uFEFF" + csv); // BOM для правильной кодировки в Excel
});

export default router;
