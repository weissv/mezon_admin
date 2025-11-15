// src/components/SideNav.tsx
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";
import { Facebook, Instagram, Send, X } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../hooks/useAuth";

const linksByRole: Record<string, { to: string; label: string }[]> = {
  DIRECTOR: [
    { to: "/dashboard", label: "Дашборд" },
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
    { to: "/dashboard", label: "Дашборд" },
    { to: "/finance", label: "Финансы" },
    { to: "/procurement", label: "Закупки" },
    { to: "/clubs", label: "Кружки" },
  ],
  TEACHER: [
    { to: "/dashboard", label: "Дашборд" },
    { to: "/clubs", label: "Кружки" },
    { to: "/attendance", label: "Посещаемость" },
  ],
  DEPUTY: [
    { to: "/dashboard", label: "Дашборд" },
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
    { to: "/dashboard", label: "Дашборд" },
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const role = user?.role || "TEACHER";
  const links = role === "DIRECTOR" ? linksByRole.DIRECTOR : linksByRole[role] || [];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  
  // Expose function for parent to toggle menu
  if (typeof window !== 'undefined') {
    (window as any).toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);
  }

  const socialLinks = [
    { icon: Facebook, href: "https://www.facebook.com/MezonSchool/" },
    { icon: Instagram, href: "https://instagram.com/mezonschool" },
    { icon: Send, href: "http://t.me/mezon_school" },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mezon-mobile-overlay" 
          onClick={closeMobileMenu}
        />
      )}
      
      <aside className={clsx("mezon-sidenav", isMobileMenuOpen && "mezon-sidenav--mobile-open")}>
      <div className="mezon-sidenav__brand">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3" onClick={closeMobileMenu}>
            <img src="/logo.png" alt="Mezon"/>
          </Link>
          {/* Close button for mobile */}
          <button 
            className="mezon-mobile-close" 
            onClick={closeMobileMenu}
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <p>Системность и уют из Mezon school теперь и в управлении.</p>
      </div>

      <div className="mezon-sidenav__nav">
        <p className="mezon-nav-label">Модули</p>
        <div className="flex flex-col gap-1">
          {links.map((l) => {
            const isActive = loc.pathname === l.to || loc.pathname.startsWith(`${l.to}/`);
            return (
              <Link 
                key={l.to} 
                to={l.to} 
                className={clsx("mezon-nav-link", isActive && "mezon-nav-link--active")}
                onClick={closeMobileMenu}
              > 
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mezon-sidenav__footer">
        <p>Есть вопрос? Свяжитесь с нами:</p>
        <p className="font-semibold text-[var(--mezon-accent)]">+ 71 // 207 17 30</p>
        <div className="mt-2 mezon-top-bar__social">
          {socialLinks.map(({ icon: Icon, href }) => (
            <a key={href} href={href} target="_blank" rel="noreferrer">
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
        <Button type="button" className="mt-4 w-full" variant="outline" onClick={logout}>
          Выйти
        </Button>
      </div>
    </aside>
    </>
  );
}
