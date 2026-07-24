import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import MainLayout from "../layouts/MainLayout";
import LmsLayout from "../layouts/LmsLayout";
import LoginPage from "../pages/LoginPage";
import { useAuth } from "../hooks/useAuth";
import NotFoundPage from "../pages/NotFoundPage";
import { Spinner } from "../components/ui/LoadingState";
import ClassProfilePage from "../pages/education/ClassProfilePage";
import SubjectPage from "../pages/education/SubjectPage";
import ScheduleConstructor from "../pages/education/ScheduleConstructor";
import CommunicationHub from "../pages/chat/CommunicationHub";
// LMS Pages (пока оставляем как есть, к ним не трогаем)
import LmsSchoolDashboard from "../pages/lms/LmsSchoolDashboard";
import LmsClassesPage from "../pages/lms/LmsClassesPage";
import LmsGradebookPage from "../pages/lms/LmsGradebookPage";
import LmsSchedulePage from "../pages/lms/LmsSchedulePage";
import LmsAssignmentsPage from "../pages/lms/LmsAssignmentsPage";
import LmsProgressPage from "../pages/lms/LmsProgressPage";
import LmsDiaryPage from "../pages/lms/LmsDiaryPage";
import ColorsTrainer from "../pages/education/subjects/languages/vocabulary/ColorsTrainer";
import ColorsTest from "../pages/education/subjects/languages/vocabulary/ColorsTest";
// Exam Pages (публичный маршрут, оставляем)
import ExamTakePage from "../pages/ExamTakePage";

// ==========================================
// ТВОИ НОВЫЕ СТРАНИЦЫ (из новых папок)
// ==========================================
import DashboardPage from "../pages/dashboard";
import FinancesPage from "../pages/finances";
import SalesPage from "../pages/sales";
import EducationPage from "../pages/education";
import AttendancePage from "../pages/attendance";
import PersonnelPage from "../pages/personnel";
import NutritionPage from "../pages/nutrition";
import ProjectsPage from "../pages/projects";
import DocumentsPage from "../pages/documents";
import NotificationsPage from "../pages/notifications";
import SettingsPage from "../pages/settings";


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

// Проверка авторизации (оставляем)
// ВРЕМЕННО ОТКЛЮЧАЕМ ЛОГИН ДЛЯ ПРОСМОТРА МЕНЮ
function PrivateRoute() {
  return <Outlet />;
}

export default function Router() {
  return (
    <Routes>
      {/* Публичный роут для контрольных */}
      <Route path="/exam/:token" element={<ExamTakePage />} />

      {/* Страница входа */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route index element={<Navigate to="login" replace />} />
        <Route path="login" element={<LoginPage />} />
      </Route>

      {/* ЗАКРЫТЫЙ КОНТУР (нужен логин) */}
      <Route element={<PrivateRoute />}>
        
        {/* НОВЫЙ ERP КОНТУР */}
        <Route path="education/schedule-constructor" element={<ScheduleConstructor />} />
        <Route path="chat" element={<CommunicationHub />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="education/class/:classId" element={<ClassProfilePage />} />
          <Route path="education/class/:classId/subject/:subjectId" element={<SubjectPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="finances" element={<FinancesPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="education" element={<EducationPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="personnel" element={<PersonnelPage />} />
          <Route path="nutrition" element={<NutritionPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<SettingsPage />} />

          <Route path="education/class/:classId/subject/:subjectId/trainer/:topicId" element={<ColorsTrainer />} />
                    <Route path="education/class/:classId/subject/:subjectId/test/:topicId" element={<ColorsTest />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* СТАРЫЙ LMS КОНТУР (пока не трогаем) */}
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
        </Route>

      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}