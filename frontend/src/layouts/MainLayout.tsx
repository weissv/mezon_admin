// src/layouts/MainLayout.tsx
import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { ArrowRight, LayoutGrid, Menu, GraduationCap, Sparkles } from "lucide-react";
import SideNav from "../components/SideNav";
import DoomGame from "../components/DoomGame";
import { Toaster } from "sonner";
import { useKonamiCode } from "../hooks/useKonamiCode";
import { useAuth } from "../hooks/useAuth";
import { ROLE_LABELS } from "../types/auth";
import { Spinner } from "../components/ui/LoadingState";

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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <span className="text-[13px] text-text-tertiary tracking-[-0.01em]">
            Загрузка рабочего пространства...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg-canvas px-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="mx-auto w-14 h-14 bg-tint-blue rounded-2xl flex items-center justify-center mb-2 shadow-[0_4px_16px_rgba(0,122,255,0.15)] border border-macos-blue/20">
            <svg className="w-7 h-7 text-macos-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <p className="text-[20px] font-semibold text-text-primary tracking-[-0.02em]">
            Сессия завершена
          </p>
          <p className="text-[14px] text-text-tertiary leading-relaxed">
            Вы не авторизованы или время действия вашей сессии истекло.
          </p>
          <Link
            to="/auth/login"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-[#0084FF] to-[#007AFF] px-6 py-2.5 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(0,122,255,0.3)] transition-all hover:brightness-105 active:scale-[0.98]"
          >
            Перейти к авторизации
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mezon-app">
      {showDoom && <DoomGame onClose={() => setShowDoom(false)} />}

      {/* ── Top Bar ── */}
      <header className="mezon-top-bar backdrop-blur-2xl bg-white/75 border-b border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.02)] sticky top-0 z-40">
        <div className="mezon-top-bar__leading">
          <button
            className="mezon-mobile-menu-btn text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
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
            <span className="flex items-center gap-1">
              Mezon ERP
              <Sparkles className="h-3 w-3 text-macos-blue inline" />
            </span>
            <strong>Операционный контур школы</strong>
          </div>
        </div>

        <div className="mezon-top-bar__cluster mezon-top-bar__cluster--compact hidden md:flex">
          <span className="mezon-chip bg-white/60 border border-black/[0.06] shadow-subtle font-medium text-[12px] text-text-secondary">
            <LayoutGrid className="h-3.5 w-3.5 text-macos-blue" />
            Рабочее место
          </span>
          <span className="mezon-chip bg-tint-blue/60 text-macos-blue border border-macos-blue/15 font-semibold text-[11px] uppercase tracking-[0.04em]">ERP</span>
        </div>

        <div className="mezon-top-bar__cluster">
          {user && (
            <span className="mezon-toolbar-pill mezon-toolbar-pill--strong bg-white/80 border border-black/[0.06] shadow-subtle hover:border-black/10 transition-all">
              <span className="mezon-toolbar-pill__dot bg-macos-green shadow-[0_0_0_3px_rgba(52,199,89,0.2)]" />
              <span className="truncate max-w-[180px] font-semibold text-[13px]">{userName}</span>
              <span className="hidden text-text-tertiary sm:inline text-[12px]">· {userRoleLabel}</span>
            </span>
          )}
          <Link
            to="/lms"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12px] font-semibold text-macos-blue bg-tint-blue hover:bg-macos-blue hover:text-white border border-macos-blue/20 shadow-subtle transition-all duration-200 cursor-pointer active:scale-[0.98]"
          >
            <GraduationCap className="h-3.5 w-3.5" />
            Школьная LMS
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="mezon-shell">
        <SideNav />
        <main className="mezon-main">
          <Toaster position="top-right" richColors />
          <div className="mezon-main-inner macos-animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

