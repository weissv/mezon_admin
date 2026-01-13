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
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const alertThreshold = new Date(Date.now() + 30 * 24 * 3600 * 1000);

    const [
      childrenCount,
      childrenOnMeals,
      employeesCount,
      activeClubs,
      financeLast30d,
      maintenanceActive,
      procurementActive,
      medicalExpiringSoon,
      contractsExpiringSoon,
    ] = await Promise.all([
      prisma.child.count({ where: { status: "ACTIVE" } }),
      prisma.attendance.count({
        where: {
          date: { gte: startOfToday, lt: endOfToday },
          clubId: null,
          isPresent: true,
        },
      }),
      prisma.employee.count({ where: { fireDate: null } }),
      prisma.club.count({ where: isTeacher ? { teacherId: req.user!.employeeId } : {} }),
      prisma.financeTransaction.groupBy({
        by: ["type"],
        _sum: { amount: true },
        where: { date: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) } },
      }),
      prisma.maintenanceRequest.count({ where: { status: { in: ["PENDING", "IN_PROGRESS"] } } }),
      prisma.purchaseOrder.count({ where: { status: { not: "DELIVERED" } } }),
      prisma.employee.count({
        where: {
          fireDate: null,
          medicalCheckupDate: { not: null, lte: alertThreshold, gte: startOfToday },
        },
      }),
      prisma.employee.count({
        where: {
          fireDate: null,
          contractEndDate: { not: null, lte: alertThreshold, gte: startOfToday },
        },
      }),
    ]);

    return res.json({
      kpi: {
        childrenCount,
        childrenOnMeals,
        employeesCount,
        activeClubs,
        financeLast30d,
      },
      alerts: {
        maintenanceActive,
        procurementActive,
        medicalExpiringSoon,
        contractsExpiringSoon,
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
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const alertThreshold = new Date(Date.now() + 30 * 24 * 3600 * 1000);

    const [
      childrenCount,
      employeesCount,
      activeClubs,
      lowInventory,
      attendanceToday,
      childrenOnMeals,
      maintenanceActive,
      procurementActive,
      medicalExpiring,
      contractsExpiring,
      employeeAttendanceRecords,
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
            gte: startOfToday,
            lt: endOfToday,
          },
          isPresent: true,
          clubId: null,
        },
      }),

      // Кол-во детей, получающих питание (пришли в основную группу)
      prisma.attendance.count({
        where: {
          date: {
            gte: startOfToday,
            lt: endOfToday,
          },
          clubId: null,
          isPresent: true,
        },
      }),
      
      // Активные заявки на обслуживание
      prisma.maintenanceRequest.count({
        where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
      }),
      
      // Активные закупки
      prisma.purchaseOrder.count({
        where: { status: { not: "DELIVERED" } },
      }),

      // Сотрудники, которым скоро нужен медосмотр (в течение 30 дней)
      prisma.employee.findMany({
        where: {
          fireDate: null,
          medicalCheckupDate: {
            not: null,
            lte: alertThreshold,
            gte: startOfToday,
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
          medicalCheckupDate: true,
        },
        orderBy: { medicalCheckupDate: "asc" },
      }),

      // Сотрудники с истекающими контрактами
      prisma.employee.findMany({
        where: {
          fireDate: null,
          contractEndDate: {
            not: null,
            lte: alertThreshold,
            gte: startOfToday,
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
          contractEndDate: true,
        },
        orderBy: { contractEndDate: "asc" },
      }),

      // Табель сотрудников на сегодня
      prisma.employeeAttendance.findMany({
        where: {
          date: {
            gte: startOfToday,
            lt: endOfToday,
          },
        },
        select: { status: true },
      }),
    ]);

    const employeeAttendance = employeeAttendanceRecords.reduce((acc: Record<string, number>, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return res.json({
      childrenCount,
      employeesCount,
      activeClubs,
      lowInventory,
      attendance: {
        today: attendanceToday,
        date: today.toISOString().split("T")[0],
      },
      nutrition: {
        childrenOnMeals: childrenOnMeals,
      },
      maintenance: {
        activeRequests: maintenanceActive,
      },
      procurement: {
        activeOrders: procurementActive,
      },
      employees: {
        needingMedicalCheckup: medicalExpiring,
        contractsExpiringSoon: contractsExpiring,
        attendanceToday: employeeAttendance,
      },
    });
  }
);

export default router;
