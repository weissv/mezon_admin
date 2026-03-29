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

  useKonamiCode(() => {
    if (user) setShowDoom(true);
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
          <span className="text-[13px] text-[#86868B] tracking-[-0.01em]">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F7] px-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="mx-auto w-14 h-14 bg-[rgba(0,122,255,0.08)] rounded-[14px] flex items-center justify-center mb-2">
            <svg className="w-7 h-7 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <p className="text-[18px] font-semibold text-[#1D1D1F] tracking-[-0.02em]">Сессия потеряна</p>
          <p className="text-[14px] text-[#86868B] leading-relaxed">
            Вы не авторизованы или ваша сессия устарела.
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

      {/* ── Top Bar ── */}
      <header className="mezon-top-bar">
        <div className="mezon-top-bar__leading">
          <button
            className="mezon-mobile-menu-btn"
            onClick={() => {
              (window as any).toggleMobileMenu?.();
            }}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="mezon-window-controls" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="mezon-top-bar__title">
            <span>Mezon Admin</span>
            <strong>Единое рабочее пространство</strong>
          </div>
        </div>

        <div className="mezon-top-bar__cluster mezon-top-bar__cluster--compact">
          {contacts.map(({ icon: Icon, label }) => (
            <span key={label} className="mezon-chip">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </span>
          ))}
        </div>

        <div className="mezon-top-bar__cluster">
          {user && (
            <span className="mezon-toolbar-pill">
              <span className="mezon-toolbar-pill__dot" />
              <span className="truncate max-w-[180px]">{userName}</span>
              <span className="hidden text-[#86868B] sm:inline">· {userRoleLabel}</span>
            </span>
          )}
          <Link
            to="/lms"
            className="mezon-chip mezon-chip--teal flex items-center gap-2 cursor-pointer"
          >
            <GraduationCap className="h-3.5 w-3.5" />
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

      {/* ── Body ── */}
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
