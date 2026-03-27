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
        const payload = await DashboardWidgetService_1.dashboardWidgetService.getBootstrap(req.user.id, req.user.role, req.user.employeeId);
        if (payload.preferences.layout.length === 0) {
            payload.preferences = await DashboardPreferencesService_1.dashboardPreferencesService.get(req.user.id, req.user.role);
        }
        return res.json(payload);
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
        const data = await DashboardWidgetService_1.dashboardWidgetService.getWidgetData(widgetId, {
            role,
            userId,
            employeeId: req.user.employeeId,
            filters,
        });
        return res.json(data);
    }
    catch (error) {
        console.error(`Dashboard widget ${req.params.widgetId} error:`, error);
        return res.status(500).json({ error: "Ошибка загрузки данных виджета" });
    }
});
exports.default = router;
