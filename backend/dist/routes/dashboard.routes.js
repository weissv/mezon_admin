"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/dashboard.routes.ts
const express_1 = require("express");
const checkRole_1 = require("../middleware/checkRole");
const DashboardPreferencesService_1 = require("../services/dashboard/DashboardPreferencesService");
const DashboardWidgetService_1 = require("../services/dashboard/DashboardWidgetService");
const dashboard_1 = require("../constants/dashboard");
const router = (0, express_1.Router)();
const DASHBOARD_ROLES = ["DIRECTOR", "DEPUTY", "ADMIN", "ACCOUNTANT", "TEACHER", "ZAVHOZ", "DEVELOPER"];
// ─── Bootstrap: каталог виджетов + preferences + quick actions ───
router.get("/bootstrap", (0, checkRole_1.checkRole)(DASHBOARD_ROLES), async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const [preferences, availableWidgets, quickActions] = await Promise.all([
            DashboardPreferencesService_1.dashboardPreferencesService.get(userId, role),
            Promise.resolve(dashboard_1.WIDGET_CATALOGUE.filter(w => w.allowedRoles.includes(role)).map(({ dataEndpoint, ...rest }) => rest)),
            Promise.resolve((0, dashboard_1.getQuickActionsForRole)(role)),
        ]);
        return res.json({ preferences, availableWidgets, quickActions });
    }
    catch (error) {
        console.error("Dashboard bootstrap error:", error);
        return res.status(500).json({ error: "Ошибка загрузки дашборда" });
    }
});
// ─── Preferences: чтение ───
router.get("/preferences", (0, checkRole_1.checkRole)(DASHBOARD_ROLES), async (req, res) => {
    try {
        const prefs = await DashboardPreferencesService_1.dashboardPreferencesService.get(req.user.id, req.user.role);
        return res.json(prefs);
    }
    catch (error) {
        console.error("Dashboard preferences GET error:", error);
        return res.status(500).json({ error: "Ошибка чтения настроек" });
    }
});
// ─── Preferences: сохранение ───
router.put("/preferences", (0, checkRole_1.checkRole)(DASHBOARD_ROLES), async (req, res) => {
    try {
        const saved = await DashboardPreferencesService_1.dashboardPreferencesService.save(req.user.id, req.user.role, req.body);
        return res.json(saved);
    }
    catch (error) {
        console.error("Dashboard preferences PUT error:", error);
        return res.status(500).json({ error: "Ошибка сохранения настроек" });
    }
});
// ─── Preferences: сброс ───
router.post("/preferences/reset", (0, checkRole_1.checkRole)(DASHBOARD_ROLES), async (req, res) => {
    try {
        const defaults = await DashboardPreferencesService_1.dashboardPreferencesService.reset(req.user.id, req.user.role);
        return res.json(defaults);
    }
    catch (error) {
        console.error("Dashboard preferences RESET error:", error);
        return res.status(500).json({ error: "Ошибка сброса настроек" });
    }
});
// ─── Widget data endpoint (universal) ───
router.get("/widgets/:widgetId", (0, checkRole_1.checkRole)(DASHBOARD_ROLES), async (req, res) => {
    try {
        const { widgetId } = req.params;
        const role = req.user.role;
        const userId = req.user.id;
        // Проверяем что виджет существует и доступен роли
        const widget = dashboard_1.WIDGET_CATALOGUE.find(w => w.id === widgetId);
        if (!widget) {
            return res.status(404).json({ error: "Виджет не найден" });
        }
        if (!widget.allowedRoles.includes(role)) {
            return res.status(403).json({ error: "Нет доступа к этому виджету" });
        }
        const filters = req.query;
        let data;
        switch (widgetId) {
            case "kpi-overview":
                data = await DashboardWidgetService_1.dashboardWidgetService.getKpiOverview(role, { ...filters, employeeId: req.user.employeeId });
                break;
            case "attendance-today":
                data = await DashboardWidgetService_1.dashboardWidgetService.getAttendanceToday();
                break;
            case "finance-overview":
                data = await DashboardWidgetService_1.dashboardWidgetService.getFinanceOverview(filters);
                break;
            case "cash-forecast":
                data = await DashboardWidgetService_1.dashboardWidgetService.getCashForecast(filters);
                break;
            case "unit-economics":
                data = await DashboardWidgetService_1.dashboardWidgetService.getUnitEconomics(filters);
                break;
            case "inventory-risk":
                data = await DashboardWidgetService_1.dashboardWidgetService.getInventoryRisk();
                break;
            case "procurement-status":
                data = await DashboardWidgetService_1.dashboardWidgetService.getProcurementStatus();
                break;
            case "menu-today":
                data = await DashboardWidgetService_1.dashboardWidgetService.getMenuToday();
                break;
            case "maintenance-queue":
                data = await DashboardWidgetService_1.dashboardWidgetService.getMaintenanceQueue();
                break;
            case "security-summary":
                data = await DashboardWidgetService_1.dashboardWidgetService.getSecuritySummary();
                break;
            case "hr-alerts":
                data = await DashboardWidgetService_1.dashboardWidgetService.getHrAlerts();
                break;
            case "calendar-today":
                data = await DashboardWidgetService_1.dashboardWidgetService.getCalendarToday();
                break;
            case "notifications-feed":
                data = await DashboardWidgetService_1.dashboardWidgetService.getNotificationsFeed(userId);
                break;
            case "activity-stream":
                data = await DashboardWidgetService_1.dashboardWidgetService.getActivityStream();
                break;
            default:
                return res.status(404).json({ error: "Данные виджета не реализованы" });
        }
        return res.json(data);
    }
    catch (error) {
        console.error(`Dashboard widget ${req.params.widgetId} error:`, error);
        return res.status(500).json({ error: "Ошибка загрузки данных виджета" });
    }
});
// ═══════════════════════════════════════════════════════════════
// LEGACY endpoints для обратной совместимости (будут удалены)
// ═══════════════════════════════════════════════════════════════
router.get("/summary", (0, checkRole_1.checkRole)(["DIRECTOR", "DEPUTY", "ADMIN", "ACCOUNTANT", "TEACHER"]), async (req, res) => {
    try {
        const role = req.user.role;
        const kpi = await DashboardWidgetService_1.dashboardWidgetService.getKpiOverview(role, { employeeId: req.user.employeeId });
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
                maintenanceActive: (await DashboardWidgetService_1.dashboardWidgetService.getMaintenanceQueue()).totalActive,
                procurementActive: (await DashboardWidgetService_1.dashboardWidgetService.getProcurementStatus()).totalActive,
                medicalExpiringSoon: (await DashboardWidgetService_1.dashboardWidgetService.getHrAlerts()).medicalExpiring.length,
                contractsExpiringSoon: (await DashboardWidgetService_1.dashboardWidgetService.getHrAlerts()).contractsExpiring.length,
            },
        });
    }
    catch (error) {
        console.error("Legacy summary error:", error);
        return res.status(500).json({ error: "Ошибка загрузки сводки" });
    }
});
router.get("/metrics", (0, checkRole_1.checkRole)(["DIRECTOR", "DEPUTY", "ADMIN"]), async (req, res) => {
    try {
        const [kpi, attendance, inventory, maintenance, procurement, hr] = await Promise.all([
            DashboardWidgetService_1.dashboardWidgetService.getKpiOverview(req.user.role, {}),
            DashboardWidgetService_1.dashboardWidgetService.getAttendanceToday(),
            DashboardWidgetService_1.dashboardWidgetService.getInventoryRisk(),
            DashboardWidgetService_1.dashboardWidgetService.getMaintenanceQueue(),
            DashboardWidgetService_1.dashboardWidgetService.getProcurementStatus(),
            DashboardWidgetService_1.dashboardWidgetService.getHrAlerts(),
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
    }
    catch (error) {
        console.error("Legacy metrics error:", error);
        return res.status(500).json({ error: "Ошибка загрузки метрик" });
    }
});
exports.default = router;
