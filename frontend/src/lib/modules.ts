import type { UserRole } from "../types/auth";

export type ModuleLink = {
  path: string;
  label: string;
  roles: UserRole[];
};

export const MODULE_LINKS: ModuleLink[] = [
  { path: "/dashboard", label: "Дашборд", roles: ["DIRECTOR", "DEPUTY", "ADMIN", "ACCOUNTANT", "TEACHER"] },
  { path: "/children", label: "Дети", roles: ["DIRECTOR", "DEPUTY", "ADMIN"] },
  { path: "/employees", label: "Сотрудники", roles: ["DIRECTOR", "DEPUTY", "ADMIN"] },
  { path: "/users", label: "Пользователи", roles: ["ADMIN"] },
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

export const getLinksForRole = (role: UserRole) => MODULE_LINKS.filter((link) => link.roles.includes(role));
