import type { UserRole } from "../types/auth";

export type ModuleLink = {
  path: string;
  label: string;
  roles: UserRole[];
  allowedUsers?: string[]; // Если указано, модуль доступен только этим пользователям (по email/login)
};

export const MODULE_LINKS: ModuleLink[] = [
  { path: "/dashboard", label: "Дашборд", roles: ["DIRECTOR", "DEPUTY", "ADMIN", "ACCOUNTANT", "TEACHER"] },
  { path: "/children", label: "Дети", roles: ["DIRECTOR", "DEPUTY", "ADMIN"] },
  { path: "/employees", label: "Сотрудники", roles: ["DIRECTOR", "DEPUTY", "ADMIN"] },
  { path: "/schedule", label: "Расписание", roles: ["DIRECTOR", "DEPUTY", "ADMIN", "TEACHER"] },
  { path: "/staffing", label: "Штатное расписание", roles: ["DIRECTOR", "DEPUTY", "ADMIN"], allowedUsers: ["izumi"] },
  { path: "/users", label: "Пользователи", roles: ["ADMIN"] },
  { path: "/groups", label: "Классы", roles: ["ADMIN"] },
  { path: "/clubs", label: "Кружки", roles: ["DIRECTOR", "DEPUTY", "ADMIN", "ACCOUNTANT", "TEACHER"] },
  { path: "/attendance", label: "Посещаемость", roles: ["DIRECTOR", "DEPUTY", "ADMIN", "TEACHER"] },
  { path: "/finance", label: "Финансы", roles: ["DIRECTOR", "ADMIN", "ACCOUNTANT"] },
  { path: "/inventory", label: "Склад", roles: ["DIRECTOR", "DEPUTY", "ADMIN"] },
  { path: "/menu", label: "Меню", roles: ["DIRECTOR", "DEPUTY", "ADMIN"] },
  { path: "/recipes", label: "Рецепты", roles: ["DIRECTOR", "DEPUTY", "ADMIN"] },
  { path: "/procurement", label: "Закупки", roles: ["DIRECTOR", "DEPUTY", "ADMIN", "ACCOUNTANT"] },
  { path: "/maintenance", label: "Заявки", roles: ["DIRECTOR", "DEPUTY", "ADMIN"] },
  { path: "/security", label: "Безопасность", roles: ["DIRECTOR", "DEPUTY", "ADMIN"] },
  { path: "/documents", label: "Документы", roles: ["DIRECTOR", "DEPUTY", "ADMIN"] },
  { path: "/calendar", label: "Календарь", roles: ["DIRECTOR", "DEPUTY", "ADMIN"] },
  { path: "/feedback", label: "Обратная связь", roles: ["DIRECTOR", "DEPUTY", "ADMIN"] },
  { path: "/integration", label: "Импорт/Экспорт", roles: ["DIRECTOR", "DEPUTY", "ADMIN", "ACCOUNTANT"] },
  { path: "/action-log", label: "Журнал действий", roles: ["DIRECTOR", "DEPUTY", "ADMIN"] },
  { path: "/notifications", label: "Уведомления", roles: ["DIRECTOR", "DEPUTY", "ADMIN"] },
  { path: "/ai-assistant", label: "ИИ-Методист", roles: ["DIRECTOR", "DEPUTY", "ADMIN", "TEACHER"] },
];

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
