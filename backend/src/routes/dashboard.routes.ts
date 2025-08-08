// src/routes/dashboard.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";

const router = Router();

// GET /api/dashboard/summary
router.get(
  "/summary",
  checkRole(["DIRECTOR", "DEPUTY", "ADMIN", "ACCOUNTANT", "TEACHER"]),
  async (req, res) => {
    // Базовая сводка, фильтруем для TEACHER только свои кружки
    const isTeacher = req.user!.role === "TEACHER";

    const [childrenCount, employeesCount, activeClubs, financeLast30d] = await Promise.all([
      prisma.child.count({ where: { status: "ACTIVE" } }),
      prisma.employee.count(),
      prisma.club.count({ where: isTeacher ? { teacherId: req.user!.employeeId } : {} }),
      prisma.financeTransaction.groupBy({
        by: ["type"],
        _sum: { amount: true },
        where: { date: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) } },
      }),
    ]);

    return res.json({
      kpi: {
        childrenCount,
        employeesCount,
        activeClubs,
        financeLast30d,
      },
    });
  }
);

export default router;
