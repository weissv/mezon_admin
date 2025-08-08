// src/router/index.tsx
import { Routes, Route, Navigate } from "react-router-dom";
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
import BranchesPage from "../pages/BranchesPage";
import ActionLogPage from "../pages/ActionLogPage";
import { useAuth } from "../hooks/useAuth";

function PrivateRoute({ children, roles }: { children: JSX.Element; roles?: string[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role) && user.role !== "DIRECTOR") {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<MainLayout />}>
        <Route
          path="/"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/children"
          element={
            <PrivateRoute roles={["DEPUTY", "ADMIN", "TEACHER", "ACCOUNTANT"]}>
              <ChildrenPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <PrivateRoute roles={["DEPUTY", "ADMIN"]}>
              <EmployeesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/clubs"
          element={
            <PrivateRoute roles={["DEPUTY", "ADMIN", "ACCOUNTANT", "TEACHER"]}>
              <ClubsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <PrivateRoute roles={["DEPUTY", "ADMIN", "TEACHER"]}>
              <AttendancePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/finance"
          element={
            <PrivateRoute roles={["ACCOUNTANT", "DEPUTY", "ADMIN"]}>
              <FinancePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <PrivateRoute roles={["DEPUTY", "ADMIN"]}>
              <InventoryPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/menu"
          element={
            <PrivateRoute roles={["DEPUTY", "ADMIN"]}>
              <MenuPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/maintenance"
          element={
            <PrivateRoute roles={["DEPUTY", "ADMIN", "TEACHER"]}>
              <MaintenancePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/security"
          element={
            <PrivateRoute roles={["DEPUTY", "ADMIN"]}>
              <SecurityPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/branches"
          element={
            <PrivateRoute roles={["ADMIN"]}>
              <BranchesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/action-log"
          element={
            <PrivateRoute roles={["DEPUTY", "ADMIN"]}>
              <ActionLogPage />
            </PrivateRoute>
          }
        />
      </Route>
    </Routes>
  );
}
