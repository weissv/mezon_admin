// src/components/SideNav.tsx
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const linksByRole: Record<string, { to: string; label: string }[]> = {
  DIRECTOR: [
    { to: "/", label: "Дашборд" },
    { to: "/children", label: "Дети" },
    { to: "/employees", label: "Сотрудники" },
    { to: "/clubs", label: "Кружки" },
    { to: "/attendance", label: "Посещаемость" },
    { to: "/finance", label: "Финансы" },
    { to: "/inventory", label: "Склад" },
    { to: "/menu", label: "Меню" },
    { to: "/recipes", label: "Рецепты" },
    { to: "/procurement", label: "Закупки" },
    { to: "/maintenance", label: "Заявки" },
    { to: "/security", label: "Безопасность" },
    { to: "/documents", label: "Документы" },
    { to: "/calendar", label: "Календарь" },
    { to: "/feedback", label: "Обратная связь" },
    { to: "/action-log", label: "Журнал действий" },
    { to: "/notifications", label: "Уведомления" },
  ],
  ACCOUNTANT: [
    { to: "/", label: "Дашборд" },
    { to: "/finance", label: "Финансы" },
    { to: "/procurement", label: "Закупки" },
    { to: "/clubs", label: "Кружки" },
  ],
  TEACHER: [
    { to: "/", label: "Дашборд" },
    { to: "/clubs", label: "Кружки" },
    { to: "/attendance", label: "Посещаемость" },
  ],
  DEPUTY: [
    { to: "/", label: "Дашборд" },
    { to: "/children", label: "Дети" },
    { to: "/employees", label: "Сотрудники" },
    { to: "/clubs", label: "Кружки" },
    { to: "/attendance", label: "Посещаемость" },
    { to: "/inventory", label: "Склад" },
    { to: "/menu", label: "Меню" },
    { to: "/recipes", label: "Рецепты" },
    { to: "/procurement", label: "Закупки" },
    { to: "/maintenance", label: "Заявки" },
    { to: "/security", label: "Безопасность" },
    { to: "/documents", label: "Документы" },
    { to: "/calendar", label: "Календарь" },
    { to: "/feedback", label: "Обратная связь" },
    { to: "/action-log", label: "Журнал действий" },
    { to: "/notifications", label: "Уведомления" },
  ],
  ADMIN: [
    { to: "/", label: "Дашборд" },
    { to: "/children", label: "Дети" },
    { to: "/employees", label: "Сотрудники" },
    { to: "/clubs", label: "Кружки" },
    { to: "/attendance", label: "Посещаемость" },
    { to: "/finance", label: "Финансы" },
    { to: "/inventory", label: "Склад" },
    { to: "/menu", label: "Меню" },
    { to: "/recipes", label: "Рецепты" },
    { to: "/procurement", label: "Закупки" },
    { to: "/maintenance", label: "Заявки" },
    { to: "/security", label: "Безопасность" },
    { to: "/documents", label: "Документы" },
    { to: "/calendar", label: "Календарь" },
    { to: "/feedback", label: "Обратная связь" },
    { to: "/action-log", label: "Журнал действий" },
    { to: "/notifications", label: "Уведомления" },
  ],
};

export default function SideNav() {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const role = user?.role || "TEACHER";
  const links = role === "DIRECTOR" ? linksByRole.DIRECTOR : linksByRole[role] || [];

  return (
    <aside className="w-64 bg-white border-r h-screen flex flex-col">
      <div className="p-4 font-semibold">ERP</div>
      <nav className="flex-1">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`block px-4 py-2 hover:bg-gray-100 ${loc.pathname === l.to ? "bg-gray-100 font-medium" : ""}`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <button className="m-4 text-red-600" onClick={logout}>Выход</button>
    </aside>
  );
}
