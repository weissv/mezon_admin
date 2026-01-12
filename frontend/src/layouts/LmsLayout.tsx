// src/layouts/LmsLayout.tsx
import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { Phone, Mail, Facebook, Instagram, Send, Menu, LayoutDashboard } from "lucide-react";
import LmsSideNav from "../components/LmsSideNav";
import { Toaster } from "sonner";
import { useAuth } from "../hooks/useAuth";

export default function LmsLayout() {
  const { user, isLoading } = useAuth();

  const contacts = [
    { icon: Phone, label: "+ 71 // 207 17 30" },
    { icon: Mail, label: "info@mezon.uz" },
  ];

  const socials = [
    { icon: Facebook, href: "https://www.facebook.com/MezonSchool/" },
    { icon: Instagram, href: "https://instagram.com/mezonschool" },
    { icon: Send, href: "http://t.me/mezon_school" },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <span className="text-sm text-gray-500">Загрузка...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <div className="max-w-md space-y-4">
          <p className="text-2xl font-semibold text-gray-800">Сессия потеряна</p>
          <p className="text-gray-600">
             Вы не авторизованы. Войдите для доступа к LMS.
          </p>
          <Link
            to="/auth/login"
            className="inline-flex items-center justify-center rounded-lg bg-[var(--mezon-accent)] px-6 py-3 font-semibold text-white shadow-lg shadow-[var(--mezon-accent-transparent)] transition hover:opacity-90"
          >
            Войти
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mezon-app">
      <header className="mezon-top-bar">
        {/* Mobile menu button */}
        <button 
          className="mezon-mobile-menu-btn"
          onClick={() => {
            if (typeof window !== 'undefined' && (window as any).toggleMobileMenu) {
              (window as any).toggleMobileMenu();
            }
          }}
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        
        <div className="mezon-top-bar__cluster">
          {contacts.map(({ icon: Icon, label }) => (
            <span key={label} className="mezon-chip">
              <Icon className="h-4 w-4" />
              {label}
            </span>
          ))}
        </div>
        <div className="mezon-top-bar__cluster">
          {/* Кнопка "Вернуться в ERP" доступна всем ролям включая учителей */}
          <Link
            to="/dashboard"
            className="mezon-chip mezon-chip--blue flex items-center gap-2 hover:bg-blue-600 transition-colors cursor-pointer"
          >
            <LayoutDashboard className="h-4 w-4" />
            Вернуться в ERP
          </Link>
          <div className="mezon-top-bar__social">
            {socials.map(({ icon: Icon, href }) => (
              <a key={href} href={href} target="_blank" rel="noreferrer">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </header>
      <div className="flex">
        <LmsSideNav />
        <main className="mezon-main">
          <Toaster position="top-right" richColors />
          <div className="mezon-main-inner">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
