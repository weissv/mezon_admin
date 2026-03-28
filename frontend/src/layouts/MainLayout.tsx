// src/layouts/MainLayout.tsx
import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { Phone, Mail, Facebook, Instagram, Send, Menu, GraduationCap } from "lucide-react";
import SideNav from "../components/SideNav";
import DoomGame from "../components/DoomGame";
import { Toaster } from "sonner";
import { useKonamiCode } from "../hooks/useKonamiCode";
import { useAuth } from "../hooks/useAuth";
import { ROLE_LABELS } from "../types/auth";

export default function MainLayout() {
  const { user, isLoading } = useAuth();
  const [showDoom, setShowDoom] = useState(false);
  const userName = user?.employee
    ? [user.employee.firstName, user.employee.lastName].filter(Boolean).join(" ")
    : user?.email;
  const userRoleLabel = user ? ROLE_LABELS[user.role] ?? user.role : "";

  // Konami Code Easter Egg
  useKonamiCode(() => {
    if (user) {
      setShowDoom(true);
    }
  });

  const contacts = [
    { icon: Phone, label: "+ 71 // 207 17 30" },
    { icon: Phone, label: "+ 90 // 006 31 37" },
    { icon: Mail, label: "info@mezon.uz" },
  ];

  const socials = [
    { icon: Facebook, href: "https://www.facebook.com/MezonSchool/" },
    { icon: Instagram, href: "https://instagram.com/mezonschool" },
    { icon: Send, href: "http://t.me/mezon_school" },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F7]">
        <span className="text-[13px] text-[#86868B]">Загрузка...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F7] px-6 text-center">
        <div className="max-w-md space-y-4">
          <p className="text-xl font-semibold text-[#1D1D1F] tracking-[-0.02em]">Сессия потеряна</p>
          <p className="text-[14px] text-[#86868B]">
            Вы не авторизованы или ваша сессия устарела. Чтобы продолжить работу с системой,
            войдите снова.
          </p>
          <Link
            to="/auth/login"
            className="inline-flex items-center justify-center rounded-[8px] bg-[#007AFF] px-5 py-2.5 text-[13px] font-medium text-white shadow-[0_0.5px_1px_rgba(0,0,0,0.12)] transition hover:bg-[#0071EE]"
          >
            Перейти к входу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mezon-app">
      {showDoom && <DoomGame onClose={() => setShowDoom(false)} />}
      
      <header className="mezon-top-bar">
        <div className="mezon-top-bar__leading">
          <button
            className="mezon-mobile-menu-btn"
            onClick={() => {
              if (typeof window !== "undefined" && (window as { toggleMobileMenu?: () => void }).toggleMobileMenu) {
                (window as { toggleMobileMenu?: () => void }).toggleMobileMenu?.();
              }
            }}
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="mezon-window-controls" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="mezon-top-bar__title">
            <span>Mezon admin</span>
            <strong>Единое рабочее пространство</strong>
          </div>
        </div>

        <div className="mezon-top-bar__cluster mezon-top-bar__cluster--compact">
          {contacts.map(({ icon: Icon, label }) => (
            <span key={label} className="mezon-chip">
              <Icon className="h-4 w-4" />
              {label}
            </span>
          ))}
        </div>
        <div className="mezon-top-bar__cluster">
          {user && (
            <span className="mezon-toolbar-pill">
              <span className="mezon-toolbar-pill__dot" />
              <span className="truncate max-w-[180px]">{userName}</span>
              <span className="hidden text-[var(--mezon-text-soft)] sm:inline">· {userRoleLabel}</span>
            </span>
          )}
          <Link
            to="/lms"
            className="mezon-chip mezon-chip--teal flex items-center gap-2 cursor-pointer"
          >
            <GraduationCap className="h-4 w-4" />
            Школьная LMS
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
      <div className="mezon-shell">
        <SideNav />
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
