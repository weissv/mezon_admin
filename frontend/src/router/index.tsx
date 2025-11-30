// src/router/index.tsx
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import MainLayout from "../layouts/MainLayout";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import ChildrenPage from "../pages/ChildrenPage";
import EmployeesPage from "../pages/EmployeesPage";
import ClubsPage from "../pages/ClubsPage";
import AttendancePage from "../pages/AttendancePage";
import FinancePage from "../pages/FinancePage";
import InventoryPage from "../pages/InventoryPage";
import MenuPage from "../pages/MenuPage";
import MaintenancePage from "../pages/MaintenancePage";
import SecurityPage from "../pages/SecurityPage";
import ActionLogPage from "../pages/ActionLogPage";
import NotificationsPage from "../pages/NotificationsPage";
import DocumentsPage from "../pages/DocumentsPage";
import CalendarPage from "../pages/CalendarPage";
import FeedbackPage from "../pages/FeedbackPage";
import ProcurementPage from "../pages/ProcurementPage";
import RecipesPage from "../pages/RecipesPage";
import IntegrationPage from "../pages/IntegrationPage";
import UsersPage from "../pages/UsersPage";
import { useAuth } from "../hooks/useAuth";
import NotFoundPage from "../pages/NotFoundPage";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <span className="text-sm text-gray-500">Оно грузится. Терпите....</span>
    </div>
  );
}

function PrivateRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }
  return <Outlet />;
}

function RoleBasedRoute({ roles }: { roles: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

export default function Router() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthLayout />}>
        <Route index element={<Navigate to="login" replace />} />
        <Route path="login" element={<LoginPage />} />
      </Route>

      <Route element={<PrivateRoute />}>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="children" element={<ChildrenPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="clubs" element={<ClubsPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="finance" element={<FinancePage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="maintenance" element={<MaintenancePage />} />
          <Route path="security" element={<SecurityPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="procurement" element={<ProcurementPage />} />
          <Route path="recipes" element={<RecipesPage />} />

          <Route element={<RoleBasedRoute roles={["DEPUTY", "ADMIN"]} />}>
            <Route path="action-log" element={<ActionLogPage />} />
          </Route>

          <Route element={<RoleBasedRoute roles={["ADMIN"]} />}>
            <Route path="users" element={<UsersPage />} />
          </Route>

          <Route element={<RoleBasedRoute roles={["DIRECTOR", "DEPUTY", "ADMIN"]} />}>
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>

          <Route element={<RoleBasedRoute roles={["DIRECTOR", "DEPUTY", "ADMIN", "ACCOUNTANT"]} />}>
            <Route path="integration" element={<IntegrationPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
