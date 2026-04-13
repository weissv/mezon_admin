import type { UserRole } from "../types/auth";

export type ModuleLink = {
  path: string;
  label: string;
  roles: UserRole[];
  section?: "workspace" | "academics" | "operations" | "administration" | "support";
  allowedUsers?: string[]; // Если указано, модуль доступен только этим пользователям (по email/login)
  isExternal?: boolean; // Внешняя ссылка (открывается в новой вкладке/отдельном приложении)
};

export type ModuleSection = NonNullable<ModuleLink["section"]>;

export const MODULE_SECTION_LABELS: Record<ModuleSection, string> = {
  workspace: "Рабочее место",
  academics: "Учебный контур",
  operations: "Операции",
  administration: "Администрирование",
  support: "Сервисы",
};

// Роли с полным доступом ко всем модулям (экспорт для использования в других местах)
export const FULL_ACCESS_ROLES: UserRole[] = ["DEVELOPER", "DIRECTOR"];

// Все роли для модулей с полным доступом
const ALL_ROLES: UserRole[] = ["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN", "ACCOUNTANT", "TEACHER", "ZAVHOZ"];

export const MODULE_LINKS: ModuleLink[] = [
  { path: "/dashboard", label: "Дашборд", roles: ALL_ROLES, section: "workspace" },
  { path: "/knowledge-base", label: "База знаний", roles: ALL_ROLES, section: "workspace" },
  { path: "/ai-assistant", label: "ИИ-Методист", roles: [...FULL_ACCESS_ROLES, "ADMIN", "TEACHER"], section: "workspace" },
  { path: "/children", label: "Дети", roles: [...FULL_ACCESS_ROLES, "ADMIN"], section: "academics" },
  { path: "/groups", label: "Классы", roles: [...FULL_ACCESS_ROLES, "ADMIN"], section: "academics" },
  { path: "/employees", label: "Сотрудники", roles: [...FULL_ACCESS_ROLES, "ADMIN"], section: "academics" },
  { path: "/schedule", label: "Расписание", roles: [...FULL_ACCESS_ROLES, "ADMIN", "TEACHER"], section: "academics" },
  { path: "/exams", label: "Контрольные", roles: [...FULL_ACCESS_ROLES, "DEPUTY", "ADMIN", "TEACHER"], section: "academics" },
  { path: "/clubs", label: "Кружки", roles: [...FULL_ACCESS_ROLES, "ADMIN", "ACCOUNTANT", "TEACHER"], section: "academics" },
  { path: "/attendance", label: "Посещаемость", roles: [...FULL_ACCESS_ROLES, "ADMIN", "TEACHER"], section: "academics" },
  { path: "/finance", label: "Финансы", roles: [...FULL_ACCESS_ROLES, "ADMIN", "ACCOUNTANT"], section: "operations" },
  { path: "/inventory", label: "Склад", roles: [...FULL_ACCESS_ROLES, "ADMIN", "ZAVHOZ"], section: "operations" },
  { path: "/menu", label: "Меню", roles: [...FULL_ACCESS_ROLES, "ADMIN", "ZAVHOZ"], section: "operations" },
  { path: "/recipes", label: "Рецепты", roles: [...FULL_ACCESS_ROLES, "ADMIN", "ZAVHOZ"], section: "operations" },
  { path: "/procurement", label: "Закупки", roles: [...FULL_ACCESS_ROLES, "ADMIN", "ACCOUNTANT", "ZAVHOZ"], section: "operations" },
  { path: "/maintenance", label: "Заявки", roles: [...FULL_ACCESS_ROLES, "ADMIN", "ZAVHOZ"], section: "operations" },
  { path: "/security", label: "Безопасность", roles: [...FULL_ACCESS_ROLES, "ADMIN", "ZAVHOZ"], section: "operations" },
  { path: "/documents", label: "Документы", roles: [...FULL_ACCESS_ROLES, "ADMIN"], section: "administration" },
  { path: "/calendar", label: "Календарь", roles: [...FULL_ACCESS_ROLES, "ADMIN", "ZAVHOZ"], section: "administration" },
  { path: "/notifications", label: "Уведомления", roles: [...FULL_ACCESS_ROLES, "ADMIN"], section: "administration" },
  { path: "/users", label: "Пользователи", roles: [...FULL_ACCESS_ROLES, "ADMIN"], section: "administration" },
  { path: "/staffing", label: "Штатное расписание", roles: FULL_ACCESS_ROLES, section: "administration" },
  { path: "/action-log", label: "Журнал действий", roles: [...FULL_ACCESS_ROLES, "ADMIN"], section: "administration" },
  { path: "/integration", label: "Импорт/Экспорт", roles: [...FULL_ACCESS_ROLES, "ADMIN", "ACCOUNTANT"], section: "support" },
  { path: "/onec-data", label: "Данные 1С", roles: [...FULL_ACCESS_ROLES, "ADMIN", "ACCOUNTANT"], section: "support" },
  { path: "/feedback", label: "Баг-репорт", roles: ALL_ROLES, section: "support" },
];

// Список всех модулей для управления правами
export const ALL_MODULES = MODULE_LINKS.map(m => ({ path: m.path, label: m.label }));

export const getLinksForRole = (role: UserRole, userEmail?: string) => 
  MODULE_LINKS.filter((link) => {
    // Проверяем роль
    if (!link.roles.includes(role)) return false;
    // Если указаны allowedUsers, проверяем что пользователь в списке
    if (link.allowedUsers && link.allowedUsers.length > 0) {
      if (!userEmail) return false;
      return link.allowedUsers.includes(userEmail);
    }
    return true;
  });

// Фильтрация модулей по правам из БД
export const getLinksWithPermissions = (
  role: UserRole,
  allowedModules: string[],
  isFullAccess: boolean,
  userEmail?: string
) => {
  // Для ролей с полным доступом возвращаем все модули
  if (isFullAccess || FULL_ACCESS_ROLES.includes(role)) {
    return MODULE_LINKS.filter((link) => {
      if (link.allowedUsers && link.allowedUsers.length > 0) {
        if (!userEmail) return false;
        return link.allowedUsers.includes(userEmail);
      }
      return true;
    });
  }

  // Для остальных ролей фильтруем по разрешённым модулям
  return MODULE_LINKS.filter((link) => {
    // Убираем начальный слэш для сравнения
    const moduleId = link.path.startsWith("/") ? link.path.slice(1) : link.path;
    
    // Проверяем что модуль разрешён
    if (!allowedModules.includes(moduleId)) return false;
    
    // Если указаны allowedUsers, проверяем что пользователь в списке
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
      links: links.filter((link) => (link.section ?? "support") === section),
    }))
    .filter((group) => group.links.length > 0);
};
