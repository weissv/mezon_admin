import type { UserRole } from "../types/auth";

export type ModuleLink = {
  path: string;
  label: string;
  roles: UserRole[];
  section?: "core" | "business" | "school" | "system";
  allowedUsers?: string[]; 
  isExternal?: boolean; 
};

export type ModuleSection = NonNullable<ModuleLink["section"]>;

// Новые названия групп для левого меню
export const MODULE_SECTION_LABELS: Record<ModuleSection, string> = {
  core: "Основное",
  business: "Бизнес и финансы",
  school: "Школьные процессы",
  system: "Система",
};

// Роли с полным доступом
export const FULL_ACCESS_ROLES: UserRole[] = ["DEVELOPER", "DIRECTOR"];

// Пока даем ВСЕМ ролям доступ ко всему, чтобы ты видела все кнопки. Потом настроим!
const ALL_ROLES: UserRole[] = ["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN", "ACCOUNTANT", "TEACHER", "ZAVHOZ"];

// НОВЫЕ 11 ПУНКТОВ МЕНЮ
export const MODULE_LINKS: ModuleLink[] = [
  // --- Основное (Видят все) ---
  { path: "/dashboard", label: "Главная", roles: ["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN", "TEACHER", "PARENT"], section: "core" },
  { path: "/knowledge-base", label: "База знаний", roles: ["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN", "TEACHER"], section: "core" },
  { path: "/chat", label: "Связь / Уведомления", roles: ["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN", "TEACHER", "PARENT"], section: "core" },

  // --- Бизнес и финансы (Только руководство и бухгалтерия) ---
  { path: "/finances", label: "Финансы", roles: ["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN", "ACCOUNTANT"], section: "business" },
  { path: "/sales", label: "Продажи", roles: ["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN"], section: "business" },
  { path: "/projects", label: "Проекты и задачи", roles: ["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN"], section: "business" },
  { path: "/documents", label: "Документы", roles: ["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN"], section: "business" },

  // --- Школьные процессы (Учителя и Админы видят всё, Родитель видит только Образование) ---
  { path: "/education", label: "Образование", roles: ["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN", "TEACHER", "PARENT"], section: "school" },
  { path: "/attendance", label: "Посещаемость", roles: ["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN", "TEACHER"], section: "school" },
  { path: "/personnel", label: "Персонал", roles: ["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN"], section: "school" },
  { path: "/nutrition", label: "Питание", roles: ["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN", "ZAVHOZ"], section: "school" },

  // --- Система (Только Админы) ---
  { path: "/notifications", label: "Уведомления", roles: ["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN"], section: "system" },
  { path: "/settings", label: "Настройки", roles: ["DEVELOPER", "DIRECTOR", "ADMIN"], section: "system" },
];

// Список всех модулей для управления правами
export const ALL_MODULES = MODULE_LINKS.map(m => ({ path: m.path, label: m.label }));

export const getLinksForRole = (role: UserRole, userEmail?: string) => 
  MODULE_LINKS.filter((link) => {
    if (!link.roles.includes(role)) return false;
    if (link.allowedUsers && link.allowedUsers.length > 0) {
      if (!userEmail) return false;
      return link.allowedUsers.includes(userEmail);
    }
    return true;
  });

// Фильтрация модулей по правам из БД (оставляем как было)
export const getLinksWithPermissions = (
  role: UserRole,
  allowedModules: string[],
  isFullAccess: boolean,
  userEmail?: string
) => {
  if (isFullAccess || FULL_ACCESS_ROLES.includes(role)) {
    return MODULE_LINKS.filter((link) => {
      if (link.allowedUsers && link.allowedUsers.length > 0) {
        if (!userEmail) return false;
        return link.allowedUsers.includes(userEmail);
      }
      return true;
    });
  }

  return MODULE_LINKS.filter((link) => {
    const moduleId = link.path.startsWith("/") ? link.path.slice(1) : link.path;
    
    if (!allowedModules.includes(moduleId)) return false;
    
    if (link.allowedUsers && link.allowedUsers.length > 0) {
      if (!userEmail) return false;
      return link.allowedUsers.includes(userEmail);
    }
    
    return true;
  });
};

export const groupModuleLinks = (links: ModuleLink[]) => {
  return Object.entries(MODULE_SECTION_LABELS)
    .map(([section, label]) => ({
      id: section as ModuleSection,
      label,
      links: links.filter((link) => (link.section ?? "system") === section),
    }))
    .filter((group) => group.links.length > 0);
};