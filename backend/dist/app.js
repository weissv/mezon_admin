"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_1 = require("./middleware/auth");
const errorHandler_1 = require("./middleware/errorHandler");
const config_1 = require("./config");
// Импорты роутов
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const children_routes_1 = __importDefault(require("./routes/children.routes"));
const employees_routes_1 = __importDefault(require("./routes/employees.routes"));
const clubs_routes_1 = __importDefault(require("./routes/clubs.routes"));
const attendance_routes_1 = __importDefault(require("./routes/attendance.routes"));
const finance_routes_1 = __importDefault(require("./routes/finance.routes"));
const inventory_routes_1 = __importDefault(require("./routes/inventory.routes"));
const menu_routes_1 = __importDefault(require("./routes/menu.routes"));
const maintenance_routes_1 = __importDefault(require("./routes/maintenance.routes"));
const security_routes_1 = __importDefault(require("./routes/security.routes"));
const actionlog_routes_1 = __importDefault(require("./routes/actionlog.routes"));
const groups_routes_1 = __importDefault(require("./routes/groups.routes"));
const notifications_routes_1 = __importDefault(require("./routes/notifications.routes"));
const documents_routes_1 = __importDefault(require("./routes/documents.routes"));
const calendar_routes_1 = __importDefault(require("./routes/calendar.routes"));
const feedback_routes_1 = __importDefault(require("./routes/feedback.routes"));
const procurement_routes_1 = __importDefault(require("./routes/procurement.routes"));
const recipes_routes_1 = __importDefault(require("./routes/recipes.routes"));
const staffing_routes_1 = __importDefault(require("./routes/staffing.routes"));
const export_routes_1 = __importDefault(require("./routes/export.routes"));
const users_routes_1 = __importDefault(require("./routes/users.routes"));
const ai_routes_1 = __importDefault(require("./routes/ai.routes"));
const schedule_routes_1 = __importDefault(require("./routes/schedule.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
const lms_school_routes_1 = __importDefault(require("./routes/lms-school.routes"));
const permissions_routes_1 = __importDefault(require("./routes/permissions.routes"));
const exams_routes_1 = __importDefault(require("./routes/exams.routes"));
const public_exams_routes_1 = __importDefault(require("./routes/public-exams.routes"));
const app = (0, express_1.default)();
const allowedOrigins = new Set(config_1.config.corsOrigins);
const allowPattern = [/\.onrender\.com$/, /mezon\.uz$/];
const corsOptions = {
    origin(origin, callback) {
        if (!origin) {
            return callback(null, true);
        }
        if (allowedOrigins.has(origin) || allowPattern.some((regex) => regex.test(origin))) {
            return callback(null, true);
        }
        console.log(`CORS blocked origin: ${origin}`);
        return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Origin", "Accept"],
    exposedHeaders: ["Set-Cookie"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
};
app.use((0, cors_1.default)(corsOptions));
app.options("*", (0, cors_1.default)(corsOptions));
app.use(express_1.default.json({ limit: "10mb" }));
app.use((0, cookie_parser_1.default)());
app.use((0, morgan_1.default)("dev"));
// Health check endpoint (public)
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// Публичные роуты
app.use("/api/auth", auth_routes_1.default);
app.use("/api/public/exams", public_exams_routes_1.default); // Публичный доступ к контрольным для студентов
// Защита всех последующих роутов
app.use(auth_1.authMiddleware);
// 3. Эти роуты теперь защищены:
app.use("/api/dashboard", dashboard_routes_1.default);
app.use("/api/children", children_routes_1.default);
app.use("/api/employees", employees_routes_1.default);
app.use("/api/clubs", clubs_routes_1.default);
app.use("/api/attendance", attendance_routes_1.default);
app.use("/api/finance", finance_routes_1.default);
app.use("/api/inventory", inventory_routes_1.default);
app.use("/api/menu", menu_routes_1.default);
app.use("/api/maintenance", maintenance_routes_1.default);
app.use("/api/security", security_routes_1.default);
app.use("/api/actionlog", actionlog_routes_1.default);
app.use("/api/groups", groups_routes_1.default);
app.use("/api/notifications", notifications_routes_1.default);
app.use("/api/documents", documents_routes_1.default);
app.use("/api/calendar", calendar_routes_1.default);
app.use("/api/feedback", feedback_routes_1.default);
app.use("/api/procurement", procurement_routes_1.default);
app.use("/api/recipes", recipes_routes_1.default);
app.use("/api/staffing", staffing_routes_1.default);
app.use("/api/integration", export_routes_1.default);
app.use("/api/users", users_routes_1.default);
app.use("/api/ai", ai_routes_1.default);
app.use("/api/schedule", schedule_routes_1.default);
app.use("/api/settings", settings_routes_1.default);
app.use("/api/lms/school", lms_school_routes_1.default);
app.use("/api/permissions", permissions_routes_1.default);
app.use("/api/exams", exams_routes_1.default); // Управление контрольными для учителей/админов
// Обработчик ошибок
app.use(errorHandler_1.errorHandler);
exports.default = app;
