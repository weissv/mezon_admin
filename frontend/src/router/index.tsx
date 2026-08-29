// src/router/index.tsx
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import MainLayout from "../layouts/MainLayout";
import LmsLayout from "../layouts/LmsLayout";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import ChildrenPage from "../pages/ChildrenPage";
import ChildDetailPage from "../pages/ChildDetailPage";
import EmployeesPage from "../pages/EmployeesPage";
import ClubsPage from "../pages/ClubsPage";
import AttendancePage from "../pages/AttendancePage";
import FinancePage from "../pages/Finance";
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
import OneCDataPage from "../pages/OneCDataPage";
import UsersPage from "../pages/UsersPage";
import AiAssistantPage from "../pages/AiAssistantPage";
import GroupsPage from "../pages/GroupsPage";
import StaffingPage from "../pages/StaffingPage";
import SchedulePage from "../pages/SchedulePage";
import { useAuth } from "../hooks/useAuth";
import NotFoundPage from "../pages/NotFoundPage";
import { FULL_ACCESS_ROLES } from "../types/common";
import { Spinner } from "../components/ui/LoadingState";

import ClassProfilePage from "../pages/education/ClassProfilePage";
import SubjectPage from "../pages/education/SubjectPage";
import ScheduleConstructor from "../pages/education/ScheduleConstructor";
import CommunicationHub from "../pages/chat/CommunicationHub";
import JournalPage from '../pages/journal/JournalPage';

// LMS Pages
import LmsSchoolDashboard from "../pages/lms/LmsSchoolDashboard";
import LmsClassesPage from "../pages/lms/LmsClassesPage";
import LmsGradebookPage from "../pages/lms/LmsGradebookPage";
import LmsSchedulePage from "../pages/lms/LmsSchedulePage";
import LmsAssignmentsPage from "../pages/lms/LmsAssignmentsPage";
import LmsProgressPage from "../pages/lms/LmsProgressPage";
import LmsDiaryPage from "../pages/lms/LmsDiaryPage";

// Exam Pages
import ExamsPage from "../pages/ExamsPage";
import ExamEditorPage from "../pages/ExamEditorPage";
import ExamResultsPage from "../pages/ExamResultsPage";
import ExamTakePage from "../pages/ExamTakePage";

// Knowledge Base Pages
import ArticleList from "../pages/KnowledgeBase/ArticleList";
import ArticleView from "../pages/KnowledgeBase/ArticleView";

// ==========================================
// ТВОИ НОВЫЕ СТРАНИЦЫ (из новых папок)
// ==========================================
import ColorsTrainer from "../pages/education/subjects/languages/vocabulary/ColorsTrainer";
import ColorsTest from "../pages/education/subjects/languages/vocabulary/ColorsTest";
import GrammarFillBlank from "../pages/education/subjects/languages/grammar/GrammarFillBlank";
import ListeningExercise from "../pages/education/subjects/languages/listening/ListeningExercise";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-canvas">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <span className="text-[13px] text-text-tertiary">Загружаем рабочее пространство…</span>
      </div>
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

  // DEVELOPER, DIRECTOR, DEPUTY имеют полный доступ ко всему
  if (user && FULL_ACCESS_ROLES.includes(user.role)) {
    return <Outlet />;
  }

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

function UserRestrictedRoute({ roles, allowedUsers }: { roles: string[]; allowedUsers: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // DEVELOPER, DIRECTOR, DEPUTY имеют полный доступ ко всему
  if (user && FULL_ACCESS_ROLES.includes(user.role)) {
    return <Outlet />;
  }

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Проверяем что пользователь в списке разрешённых
  if (!allowedUsers.includes(user.email)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Outlet />;
}

function TeacherRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  const allowedRoles = ["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN", "TEACHER"];
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

export default function Router() {
  return (
    <Routes>
      {/* Публичный роут для прохождения контрольных (без авторизации) */}
      <Route path="/exam/:token" element={<ExamTakePage />} />

      <Route path="/auth" element={<AuthLayout />}>
        <Route index element={<Navigate to="login" replace />} />
        <Route path="login" element={<LoginPage />} />
      </Route>

      <Route element={<PrivateRoute />}>
        
        {/* НОВЫЙ ERP КОНТУР */}
        <Route path="education/schedule-constructor" element={<ScheduleConstructor />} />
        <Route path="chat" element={<CommunicationHub />} />
        <Route path="/journal" element={<JournalPage />} />
        
        <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="children" element={<ChildrenPage />} />
            <Route path="children/:id" element={<ChildDetailPage />} />
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
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="knowledge-base" element={<ArticleList />} />
            <Route path="knowledge-base/:slug" element={<ArticleView />} />

            <Route element={<RoleBasedRoute roles={["DEPUTY", "ADMIN"]} />}>
              <Route path="action-log" element={<ActionLogPage />} />
            </Route>

            <Route path="education/class/:classId/subject/:subjectId/trainer/:topicId" element={<ColorsTrainer />} />
            <Route path="education/class/:classId/subject/:subjectId/test/:topicId" element={<ColorsTest />} />
            <Route path="education/class/:classId/subject/:subjectId/grammar-trainer/:topicId" element={<GrammarFillBlank mode="trainer" />} />
            <Route path="education/class/:classId/subject/:subjectId/grammar-test/:topicId" element={<GrammarFillBlank mode="test" />} />
            <Route path="education/class/:classId/subject/:subjectId/listening-trainer/:topicId" element={<ListeningExercise mode="trainer" />} />
            <Route path="education/class/:classId/subject/:subjectId/listening-test/:topicId" element={<ListeningExercise mode="test" />} />

            <Route element={<RoleBasedRoute roles={["ADMIN"]} />}>
              <Route path="users" element={<UsersPage />} />
              <Route path="groups" element={<GroupsPage />} />
            </Route>

            <Route element={<UserRestrictedRoute roles={["DIRECTOR", "DEPUTY", "ADMIN"]} allowedUsers={["izumi"]} />}>
              <Route path="staffing" element={<StaffingPage />} />
            </Route>

            <Route element={<RoleBasedRoute roles={["DIRECTOR", "DEPUTY", "ADMIN"]} />}>
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>

            <Route element={<RoleBasedRoute roles={["DIRECTOR", "DEPUTY", "ADMIN"]} />}>
              <Route path="ai-assistant" element={<AiAssistantPage />} />
            </Route>

            <Route element={<RoleBasedRoute roles={["DIRECTOR", "DEPUTY", "ADMIN", "ACCOUNTANT"]} />}>
              <Route path="integration" element={<IntegrationPage />} />
              <Route path="onec-data" element={<OneCDataPage />} />
            </Route>

            {/* Контрольные работы - для учителей и админов */}
            <Route element={<TeacherRoute />}>
              <Route path="exams" element={<ExamsPage />} />
              <Route path="exams/new" element={<ExamEditorPage />} />
              <Route path="exams/:id/edit" element={<ExamEditorPage />} />
              <Route path="exams/:id/results" element={<ExamResultsPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>

        {/* LMS Routes - School Management System */}
        <Route path="/lms" element={<LmsLayout />}>
          <Route index element={<Navigate to="school" replace />} />
          <Route path="dashboard" element={<Navigate to="school" replace />} />
          
          <Route path="school" element={<LmsSchoolDashboard />} />
          <Route path="school/classes" element={<LmsClassesPage />} />
          <Route path="school/classes/:classId" element={<LmsClassesPage />} />
          <Route path="school/gradebook" element={<LmsGradebookPage />} />
          <Route path="school/schedule" element={<LmsSchedulePage />} />
          <Route path="school/homework" element={<LmsAssignmentsPage />} />
          <Route path="school/attendance" element={<LmsProgressPage />} />
          
          <Route path="diary" element={<LmsDiaryPage />} />
          <Route path="ai-assistant" element={<AiAssistantPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}