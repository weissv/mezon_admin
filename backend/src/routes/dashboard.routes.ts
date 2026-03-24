// src/routes/dashboard.routes.ts
import { Router, Request, Response } from "express";
import { checkRole } from "../middleware/checkRole";
import { Role } from "@prisma/client";
import { dashboardPreferencesService } from "../services/dashboard/DashboardPreferencesService";
import { dashboardWidgetService } from "../services/dashboard/DashboardWidgetService";
import {
  WIDGET_CATALOGUE,
  QUICK_ACTIONS_CATALOGUE,
  getWidgetsForRole,
  getQuickActionsForRole,
} from "../constants/dashboard";

const router = Router();

const DASHBOARD_ROLES: Role[] = ["DIRECTOR", "DEPUTY", "ADMIN", "ACCOUNTANT", "TEACHER", "ZAVHOZ", "DEVELOPER"];

// ─── Bootstrap: каталог виджетов + preferences + quick actions ───
router.get(
  "/bootstrap",
  checkRole(DASHBOARD_ROLES),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const role = req.user!.role as Role;

      const [preferences, availableWidgets, quickActions] = await Promise.all([
        dashboardPreferencesService.get(userId, role),
        Promise.resolve(
          WIDGET_CATALOGUE.filter(w => w.allowedRoles.includes(role)).map(({ dataEndpoint, ...rest }) => rest)
        ),
        Promise.resolve(getQuickActionsForRole(role)),
      ]);

      return res.json({ preferences, availableWidgets, quickActions });
    } catch (error) {
      console.error("Dashboard bootstrap error:", error);
      return res.status(500).json({ error: "Ошибка загрузки дашборда" });
    }
  }
);

// ─── Preferences: чтение ───
router.get(
  "/preferences",
  checkRole(DASHBOARD_ROLES),
  async (req: Request, res: Response) => {
    try {
      const prefs = await dashboardPreferencesService.get(req.user!.id, req.user!.role as Role);
      return res.json(prefs);
    } catch (error) {
      console.error("Dashboard preferences GET error:", error);
      return res.status(500).json({ error: "Ошибка чтения настроек" });
    }
  }
);

// ─── Preferences: сохранение ───
router.put(
  "/preferences",
  checkRole(DASHBOARD_ROLES),
  async (req: Request, res: Response) => {
    try {
      const saved = await dashboardPreferencesService.save(req.user!.id, req.user!.role as Role, req.body);
      return res.json(saved);
    } catch (error) {
      console.error("Dashboard preferences PUT error:", error);
      return res.status(500).json({ error: "Ошибка сохранения настроек" });
    }
  }
);

// ─── Preferences: сброс ───
router.post(
  "/preferences/reset",
  checkRole(DASHBOARD_ROLES),
  async (req: Request, res: Response) => {
    try {
      const defaults = await dashboardPreferencesService.reset(req.user!.id, req.user!.role as Role);
      return res.json(defaults);
    } catch (error) {
      console.error("Dashboard preferences RESET error:", error);
      return res.status(500).json({ error: "Ошибка сброса настроек" });
    }
  }
);

// ─── Widget data endpoint (universal) ───
router.get(
  "/widgets/:widgetId",
  checkRole(DASHBOARD_ROLES),
  async (req: Request, res: Response) => {
    try {
      const { widgetId } = req.params;
      const role = req.user!.role as Role;
      const userId = req.user!.id;

      // Проверяем что виджет существует и доступен роли
      const widget = WIDGET_CATALOGUE.find(w => w.id === widgetId);
      if (!widget) {
        return res.status(404).json({ error: "Виджет не найден" });
      }
      if (!widget.allowedRoles.includes(role)) {
        return res.status(403).json({ error: "Нет доступа к этому виджету" });
      }

      const filters = req.query as Record<string, unknown>;

      let data: unknown;
      switch (widgetId) {
        case "kpi-overview":
          data = await dashboardWidgetService.getKpiOverview(role, { ...filters, employeeId: req.user!.employeeId });
          break;
        case "attendance-today":
          data = await dashboardWidgetService.getAttendanceToday();
          break;
        case "finance-overview":
          data = await dashboardWidgetService.getFinanceOverview(filters);
          break;
        case "cash-forecast":
          data = await dashboardWidgetService.getCashForecast(filters);
          break;
        case "unit-economics":
          data = await dashboardWidgetService.getUnitEconomics(filters);
          break;
        case "inventory-risk":
          data = await dashboardWidgetService.getInventoryRisk();
          break;
        case "procurement-status":
          data = await dashboardWidgetService.getProcurementStatus();
          break;
        case "menu-today":
          data = await dashboardWidgetService.getMenuToday();
          break;
        case "maintenance-queue":
          data = await dashboardWidgetService.getMaintenanceQueue();
          break;
        case "security-summary":
          data = await dashboardWidgetService.getSecuritySummary();
          break;
        case "hr-alerts":
          data = await dashboardWidgetService.getHrAlerts();
          break;
        case "calendar-today":
          data = await dashboardWidgetService.getCalendarToday();
          break;
        case "notifications-feed":
          data = await dashboardWidgetService.getNotificationsFeed(userId);
          break;
        case "activity-stream":
          data = await dashboardWidgetService.getActivityStream();
          break;
        default:
          return res.status(404).json({ error: "Данные виджета не реализованы" });
      }

      return res.json(data);
    } catch (error) {
      console.error(`Dashboard widget ${req.params.widgetId} error:`, error);
      return res.status(500).json({ error: "Ошибка загрузки данных виджета" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// LEGACY endpoints для обратной совместимости (будут удалены)
// ═══════════════════════════════════════════════════════════════

router.get(
  "/summary",
  checkRole(["DIRECTOR", "DEPUTY", "ADMIN", "ACCOUNTANT", "TEACHER"]),
  async (req: Request, res: Response) => {
    try {
      const role = req.user!.role as Role;
      const kpi = await dashboardWidgetService.getKpiOverview(role, { employeeId: req.user!.employeeId });

      return res.json({
        kpi: {
          childrenCount: kpi.childrenCount,
          employeesCount: kpi.employeesCount,
          activeClubs: kpi.activeClubs,
          financeLast30d: [
            { type: "INCOME", _sum: { amount: kpi.income } },
            { type: "EXPENSE", _sum: { amount: kpi.expense } },
          ],
        },
        alerts: {
          maintenanceActive: (await dashboardWidgetService.getMaintenanceQueue()).totalActive,
          procurementActive: (await dashboardWidgetService.getProcurementStatus()).totalActive,
          medicalExpiringSoon: (await dashboardWidgetService.getHrAlerts()).medicalExpiring.length,
          contractsExpiringSoon: (await dashboardWidgetService.getHrAlerts()).contractsExpiring.length,
        },
      });
    } catch (error) {
      console.error("Legacy summary error:", error);
      return res.status(500).json({ error: "Ошибка загрузки сводки" });
    }
  }
);

router.get(
  "/metrics",
  checkRole(["DIRECTOR", "DEPUTY", "ADMIN"]),
  async (req: Request, res: Response) => {
    try {
      const [kpi, attendance, inventory, maintenance, procurement, hr] = await Promise.all([
        dashboardWidgetService.getKpiOverview(req.user!.role as Role, {}),
        dashboardWidgetService.getAttendanceToday(),
        dashboardWidgetService.getInventoryRisk(),
        dashboardWidgetService.getMaintenanceQueue(),
        dashboardWidgetService.getProcurementStatus(),
        dashboardWidgetService.getHrAlerts(),
      ]);

      return res.json({
        childrenCount: kpi.childrenCount,
        employeesCount: kpi.employeesCount,
        activeClubs: kpi.activeClubs,
        lowInventory: inventory.items.slice(0, 5),
        attendance: { today: attendance.childrenPresent, date: attendance.date },
        nutrition: { childrenOnMeals: attendance.childrenOnMeals },
        maintenance: { activeRequests: maintenance.totalActive },
        procurement: { activeOrders: procurement.totalActive },
        employees: {
          needingMedicalCheckup: hr.medicalExpiring,
          contractsExpiringSoon: hr.contractsExpiring,
          attendanceToday: attendance.employeeAttendance,
        },
      });
    } catch (error) {
      console.error("Legacy metrics error:", error);
      return res.status(500).json({ error: "Ошибка загрузки метрик" });
    }
  }
);

export default router;
