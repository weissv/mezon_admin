// src/app.ts
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { authMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/errorHandler";

// Импорты роутов
import authRoutes from "./routes/auth.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import childrenRoutes from "./routes/children.routes";
import employeesRoutes from "./routes/employees.routes";
import clubsRoutes from "./routes/clubs.routes";
import attendanceRoutes from "./routes/attendance.routes";
import financeRoutes from "./routes/finance.routes";
import inventoryRoutes from "./routes/inventory.routes";
import menuRoutes from "./routes/menu.routes";
import maintenanceRoutes from "./routes/maintenance.routes";
import securityRoutes from "./routes/security.routes";
import branchesRoutes from "./routes/branches.routes";
import actionlogRoutes from "./routes/actionlog.routes";
import groupsRoutes from "./routes/groups.routes";
import notificationsRoutes from "./routes/notifications.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Health check endpoint (public)
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Публичные роуты
app.use("/api/auth", authRoutes);

// Защита всех последующих роутов
app.use(authMiddleware);

// 3. Эти роуты теперь защищены:
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/children", childrenRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/clubs", clubsRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/branches", branchesRoutes);
app.use("/api/actionlog", actionlogRoutes);
app.use("/api/groups", groupsRoutes);
app.use("/api/notifications", notificationsRoutes);

// Обработчик ошибок
app.use(errorHandler);

export default app;