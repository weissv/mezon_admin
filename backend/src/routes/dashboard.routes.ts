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

// GET /api/dashboard/metrics - расширенная статистика
router.get(
  "/metrics",
  checkRole(["DIRECTOR", "DEPUTY", "ADMIN"]),
  async (_req, res) => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      childrenCount,
      employeesCount,
      activeClubs,
      lowInventory,
      attendanceToday,
      maintenanceActive,
      employeesNeedingMedical,
    ] = await Promise.all([
      // Всего детей
      prisma.child.count({ where: { status: "ACTIVE" } }),
      
      // Всего сотрудников
      prisma.employee.count({ where: { fireDate: null } }),
      
      // Активных кружков
      prisma.club.count(),
      
      // Топ-5 продуктов с низким остатком (менее 10 единиц)
      prisma.inventoryItem.findMany({
        where: {
          type: "FOOD",
          quantity: { lt: 10 },
        },
        orderBy: { quantity: "asc" },
        take: 5,
        select: { id: true, name: true, quantity: true, unit: true },
      }),
      
      // Посещаемость детей сегодня
      prisma.attendance.count({
        where: {
          date: {
            gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
            lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
          },
          isPresent: true,
        },
      }),
      
      // Активные заявки на обслуживание
      prisma.maintenanceRequest.count({
        where: { status: { in: ["NEW", "IN_PROGRESS"] } },
      }),
      
      // Сотрудники, которым скоро нужен медосмотр (в течение 30 дней)
      prisma.employee.count({
        where: {
          fireDate: null,
          medicalCheckupDate: {
            lte: new Date(Date.now() + 30 * 24 * 3600 * 1000),
          },
        },
      }),
    ]);

    return res.json({
      childrenCount,
      employeesCount,
      activeClubs,
      lowInventory,
      attendance: {
        today: attendanceToday,
        date: today.toISOString().split("T")[0],
      },
      maintenance: {
        activeRequests: maintenanceActive,
      },
      employees: {
        needingMedicalCheckup: employeesNeedingMedical,
      },
    });
  }
);

export default router;
