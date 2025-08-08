// src/routes/menu.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";
import { validate } from "../middleware/validate";
import { getMenuSchema, upsertMenuSchema } from "../schemas/menu.schema";

const router = Router();

// GET /api/menu?startDate&endDate
router.get("/", checkRole(["DEPUTY", "ADMIN"]), async (req, res) => {
  const { startDate, endDate } = req.query as any;
  const where: any = {};
  if (startDate || endDate) where.date = {};
  if (startDate) where.date.gte = new Date(String(startDate));
  if (endDate) where.date.lte = new Date(String(endDate));
  const items = await prisma.menu.findMany({ where, orderBy: { date: "asc" } });
  return res.json(items);
});

// POST /api/menu
router.post("/", checkRole(["DEPUTY", "ADMIN"]), async (req, res) => {
  // Валидация и расчёт КБЖУ можно делать на фронте и/или бэке
  const created = await prisma.menu.upsert({
    where: { date_ageGroup: { date: new Date(req.body.date), ageGroup: req.body.ageGroup } },
    update: { meals: req.body.meals },
    create: { date: new Date(req.body.date), ageGroup: req.body.ageGroup, meals: req.body.meals },
  });
  return res.status(201).json(created);
});

router.get("/", checkRole(["DEPUTY", "ADMIN"]), validate(getMenuSchema), async (req, res) => { /* ... */ });
router.post("/", checkRole(["DEPUTY", "ADMIN"]), validate(upsertMenuSchema), async (req, res) => { /* ... */ });

export default router;
