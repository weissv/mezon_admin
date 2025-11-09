"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const errorHandler_1 = require("./middleware/errorHandler");
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
const branches_routes_1 = __importDefault(require("./routes/branches.routes"));
const actionlog_routes_1 = __importDefault(require("./routes/actionlog.routes"));
const groups_routes_1 = __importDefault(require("./routes/groups.routes"));
const notifications_routes_1 = __importDefault(require("./routes/notifications.routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)("dev"));
// ... (rest of the file is same until the routes)
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
app.use("/api/branches", branches_routes_1.default);
app.use("/api/actionlog", actionlog_routes_1.default);
app.use("/api/groups", groups_routes_1.default);
app.use("/api/notifications", notifications_routes_1.default);
// Обработчик ошибок
app.use(errorHandler_1.errorHandler);
exports.default = app;
