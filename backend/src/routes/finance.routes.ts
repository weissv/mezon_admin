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

export default router;
