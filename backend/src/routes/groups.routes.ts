// src/routes/groups.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";

const router = Router();

// GET /api/groups
router.get("/", checkRole(["DEPUTY", "ADMIN", "TEACHER", "ACCOUNTANT"]), async (req, res) => {
  const groups = await prisma.group.findMany({
    orderBy: { name: 'asc' }
  });
  
  // Сортировка по номеру класса (1 класс, 2 класс, ... 11 класс)
  groups.sort((a, b) => {
    const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
    const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
    return numA - numB;
  });
  
  return res.json(groups);
});

export default router;
