// src/services/dashboard/DashboardWidgetService.ts
// Агрегирующий сервис для данных всех dashboard-виджетов

import { prisma } from '../../prisma';
import { Role } from '@prisma/client';

// ======================== CACHE ========================

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return Promise.resolve(entry.data as T);
  }
  return fn().then(data => {
    cache.set(key, { data, expiresAt: Date.now() + ttlMs });
    return data;
  });
}

// ======================== HELPERS ========================

function startOfDay(d: Date = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function endOfDay(d: Date = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
}
function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000);
}
function daysAhead(n: number) {
  return new Date(Date.now() + n * 86_400_000);
}

// ======================== WIDGET DATA FETCHERS ========================

class DashboardWidgetServiceClass {
  // ─── KPI Overview ───
  async getKpiOverview(role: Role, filters: Record<string, unknown> = {}) {
    const isTeacher = role === 'TEACHER';

    return cached(`kpi-overview:${role}`, 60_000, async () => {
      const [childrenCount, employeesCount, activeClubs, financeLast30d] = await Promise.all([
        prisma.child.count({ where: { status: 'ACTIVE' } }),
        prisma.employee.count({ where: { fireDate: null } }),
        prisma.club.count(isTeacher ? { where: { teacherId: (filters.employeeId as number) || undefined } } : undefined),
        prisma.financeTransaction.groupBy({
          by: ['type'],
          _sum: { amount: true },
          where: { date: { gte: daysAgo(30) } },
        }),
      ]);

      const income = financeLast30d.find(f => f.type === 'INCOME')?._sum.amount || 0;
      const expense = financeLast30d.find(f => f.type === 'EXPENSE')?._sum.amount || 0;

      return { childrenCount, employeesCount, activeClubs, income: Number(income), expense: Number(expense) };
    });
  }

  // ─── Attendance Today ───
  async getAttendanceToday() {
    return cached('attendance-today', 60_000, async () => {
      const today = startOfDay();
      const tomorrow = endOfDay();

      const [childrenPresent, childrenOnMeals, employeeRecords] = await Promise.all([
        prisma.attendance.count({
          where: { date: { gte: today, lt: tomorrow }, isPresent: true, clubId: null },
        }),
        prisma.attendance.count({
          where: { date: { gte: today, lt: tomorrow }, clubId: null, isPresent: true },
        }),
        prisma.employeeAttendance.findMany({
          where: { date: { gte: today, lt: tomorrow } },
          select: { status: true },
        }),
      ]);

      const employeeStats = employeeRecords.reduce<Record<string, number>>((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {});

      return {
        childrenPresent,
        childrenOnMeals,
        employeeAttendance: employeeStats,
        date: today.toISOString().split('T')[0],
      };
    });
  }

  // ─── Finance Overview ───
  async getFinanceOverview(filters: Record<string, unknown> = {}) {
    const days = (filters.days as number) || 30;

    return cached(`finance-overview:${days}`, 120_000, async () => {
      const since = daysAgo(days);
      const transactions = await prisma.financeTransaction.groupBy({
        by: ['type'],
        _sum: { amount: true },
        _count: true,
        where: { date: { gte: since } },
      });

      const income = transactions.find(t => t.type === 'INCOME');
      const expense = transactions.find(t => t.type === 'EXPENSE');

      return {
        period: days,
        income: { total: Number(income?._sum.amount || 0), count: income?._count || 0 },
        expense: { total: Number(expense?._sum.amount || 0), count: expense?._count || 0 },
        balance: Number(income?._sum.amount || 0) - Number(expense?._sum.amount || 0),
      };
    });
  }

  // ─── Cash Forecast (proxy to existing finance endpoint logic) ───
  async getCashForecast(filters: Record<string, unknown> = {}) {
    // Возвращает заглушку; основная логика living в finance.routes
    // Здесь берём данные напрямую из прогнозного расчёта
    const currentBalance = Number(filters.currentBalance || 50_000_000);
    const forecastDays = Number(filters.days || 30);

    return cached(`cash-forecast:${currentBalance}:${forecastDays}`, 300_000, async () => {
      // Средние дневные поступления/расходы за последние 90 дней
      const since = daysAgo(90);
      const totals = await prisma.financeTransaction.groupBy({
        by: ['type'],
        _sum: { amount: true },
        where: { date: { gte: since } },
      });

      const totalIncome = Number(totals.find(t => t.type === 'INCOME')?._sum.amount || 0);
      const totalExpense = Number(totals.find(t => t.type === 'EXPENSE')?._sum.amount || 0);
      const avgDailyIncome = totalIncome / 90;
      const avgDailyExpense = totalExpense / 90;

      const forecast = [];
      let balance = currentBalance;
      let daysWithGaps = 0;
      let minBalance = balance;

      for (let i = 1; i <= forecastDays; i++) {
        const date = new Date(Date.now() + i * 86_400_000);
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const expectedIncome = isWeekend ? 0 : avgDailyIncome;
        const expectedExpense = isWeekend ? avgDailyExpense * 0.3 : avgDailyExpense;
        const netFlow = expectedIncome - expectedExpense;
        balance += netFlow;
        const isGap = balance < 0;
        if (isGap) daysWithGaps++;
        if (balance < minBalance) minBalance = balance;

        forecast.push({
          date: date.toISOString().split('T')[0],
          dayOfWeek,
          expectedIncome: Math.round(expectedIncome),
          expectedExpense: Math.round(expectedExpense),
          netFlow: Math.round(netFlow),
          runningBalance: Math.round(balance),
          isGap,
        });
      }

      return {
        currentBalance,
        forecast,
        summary: {
          avgDailyIncome: Math.round(avgDailyIncome),
          avgDailyExpense: Math.round(avgDailyExpense),
          daysWithGaps,
          minBalance: Math.round(minBalance),
        },
      };
    });
  }

  // ─── Unit Economics ───
  async getUnitEconomics(filters: Record<string, unknown> = {}) {
    const months = Number(filters.months || 3);

    return cached(`unit-economics:${months}`, 300_000, async () => {
      const since = new Date();
      since.setMonth(since.getMonth() - months);

      const [childrenCount, transactions] = await Promise.all([
        prisma.child.count({ where: { status: 'ACTIVE' } }),
        prisma.financeTransaction.groupBy({
          by: ['type', 'category'],
          _sum: { amount: true },
          where: { date: { gte: since } },
        }),
      ]);

      const costByCategory: Record<string, number> = {};
      let totalIncome = 0;
      let totalExpense = 0;

      for (const t of transactions) {
        const amount = Number(t._sum.amount || 0);
        if (t.type === 'INCOME') {
          totalIncome += amount;
        } else {
          totalExpense += amount;
          const cat = t.category || 'OTHER';
          costByCategory[cat] = (costByCategory[cat] || 0) + amount;
        }
      }

      const perChild = childrenCount > 0 ? totalExpense / childrenCount : 0;
      const days = months * 30;
      const perChildDaily = childrenCount > 0 ? totalExpense / childrenCount / days : 0;

      return {
        period: { months, days },
        childrenCount,
        costs: costByCategory,
        totals: { totalExpense, totalIncome, perChild: Math.round(perChild), perChildDaily: Math.round(perChildDaily) },
        margin: totalIncome - totalExpense,
        marginPercent: totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0,
      };
    });
  }

  // ─── Inventory Risk ───
  async getInventoryRisk() {
    return cached('inventory-risk', 60_000, async () => {
      const lowItems = await prisma.inventoryItem.findMany({
        where: { quantity: { lt: 10 } },
        orderBy: { quantity: 'asc' },
        take: 10,
        select: { id: true, name: true, quantity: true, unit: true, type: true },
      });

      const totalLow = await prisma.inventoryItem.count({ where: { quantity: { lt: 10 } } });

      return { items: lowItems, totalLowStock: totalLow };
    });
  }

  // ─── Procurement Status ───
  async getProcurementStatus() {
    return cached('procurement-status', 120_000, async () => {
      const [byStatus, totalActive, recentOrders] = await Promise.all([
        prisma.purchaseOrder.groupBy({
          by: ['status'],
          _count: true,
          where: { status: { not: 'DELIVERED' } },
        }),
        prisma.purchaseOrder.count({ where: { status: { not: 'DELIVERED' } } }),
        prisma.purchaseOrder.findMany({
          where: { status: { not: 'DELIVERED' } },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            status: true,
            totalAmount: true,
            type: true,
            createdAt: true,
          },
        }),
      ]);

      return {
        totalActive,
        byStatus: byStatus.map(s => ({ status: s.status, count: s._count })),
        recentOrders: recentOrders.map(o => ({
          ...o,
          totalAmount: Number(o.totalAmount),
        })),
      };
    });
  }

  // ─── Menu Today ───
  async getMenuToday() {
    return cached('menu-today', 120_000, async () => {
      const today = startOfDay();
      const tomorrow = endOfDay();

      const [todayMenu, childrenOnMeals] = await Promise.all([
        prisma.menuDish.findMany({
          where: {
            menu: { date: { gte: today, lt: tomorrow } },
          },
          include: { dish: { select: { name: true } } },
        }),
        prisma.attendance.count({
          where: { date: { gte: today, lt: tomorrow }, isPresent: true, clubId: null },
        }),
      ]);

      return {
        date: today.toISOString().split('T')[0],
        items: todayMenu.map(m => ({ name: m.dish.name, mealType: m.mealType })),
        childrenOnMeals,
      };
    });
  }

  // ─── Maintenance Queue ───
  async getMaintenanceQueue() {
    return cached('maintenance-queue', 60_000, async () => {
      const [byStatus, recent] = await Promise.all([
        prisma.maintenanceRequest.groupBy({
          by: ['status'],
          _count: true,
          where: { status: { in: ['PENDING', 'APPROVED', 'IN_PROGRESS'] } },
        }),
        prisma.maintenanceRequest.findMany({
          where: { status: { in: ['PENDING', 'APPROVED', 'IN_PROGRESS'] } },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            description: true,
            status: true,
            type: true,
            createdAt: true,
            requester: { select: { firstName: true, lastName: true } },
          },
        }),
      ]);

      const totalActive = byStatus.reduce((sum, s) => sum + s._count, 0);

      return {
        totalActive,
        byStatus: byStatus.map(s => ({ status: s.status, count: s._count })),
        recent,
      };
    });
  }

  // ─── Security Summary ───
  async getSecuritySummary() {
    return cached('security-summary', 300_000, async () => {
      const thirtyDaysAgo = daysAgo(30);

      const [recentEvents, byType] = await Promise.all([
        prisma.securityLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            eventType: true,
            description: true,
            createdAt: true,
          },
        }),
        prisma.securityLog.groupBy({
          by: ['eventType'],
          _count: true,
          where: { createdAt: { gte: thirtyDaysAgo } },
        }),
      ]);

      return {
        recentEvents: recentEvents.map(e => ({
          id: e.id,
          type: e.eventType,
          description: e.description,
          createdAt: e.createdAt,
        })),
        last30Days: byType.map(t => ({ type: t.eventType, count: t._count })),
      };
    });
  }

  // ─── HR Alerts ───
  async getHrAlerts() {
    const threshold = daysAhead(30);
    const today = startOfDay();

    return cached('hr-alerts', 120_000, async () => {
      const [medicalExpiring, contractsExpiring] = await Promise.all([
        prisma.employee.findMany({
          where: {
            fireDate: null,
            medicalCheckupDate: { not: null, lte: threshold, gte: today },
          },
          select: { id: true, firstName: true, lastName: true, position: true, medicalCheckupDate: true },
          orderBy: { medicalCheckupDate: 'asc' },
          take: 10,
        }),
        prisma.employee.findMany({
          where: {
            fireDate: null,
            contractEndDate: { not: null, lte: threshold, gte: today },
          },
          select: { id: true, firstName: true, lastName: true, position: true, contractEndDate: true },
          orderBy: { contractEndDate: 'asc' },
          take: 10,
        }),
      ]);

      return {
        medicalExpiring,
        contractsExpiring,
        totalAlerts: medicalExpiring.length + contractsExpiring.length,
      };
    });
  }

  // ─── Calendar Today ───
  async getCalendarToday() {
    const today = startOfDay();
    const tomorrow = endOfDay();

    return cached('calendar-today', 120_000, async () => {
      const events = await prisma.event.findMany({
        where: {
          date: { gte: today, lt: tomorrow },
        },
        orderBy: { date: 'asc' },
        take: 10,
        select: {
          id: true,
          title: true,
          date: true,
          organizer: true,
        },
      });

      return { date: today.toISOString().split('T')[0], events };
    });
  }

  // ─── Notifications Feed ───
  async getNotificationsFeed(userId: number) {
    return cached(`notifications-feed:${userId}`, 30_000, async () => {
      const notifications = await prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
        },
      });

      return { notifications };
    });
  }

  // ─── Activity Stream ───
  async getActivityStream() {
    return cached('activity-stream', 30_000, async () => {
      const actions = await prisma.actionLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 20,
        select: {
          id: true,
          action: true,
          details: true,
          timestamp: true,
          user: { select: { email: true, role: true } },
        },
      });

      return { actions };
    });
  }
}

export const dashboardWidgetService = new DashboardWidgetServiceClass();
