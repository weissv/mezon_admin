// src/layouts/MainLayout.tsx
import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { Phone, Mail, Facebook, Instagram, Send, Menu, GraduationCap } from "lucide-react";
import SideNav from "../components/SideNav";
import DoomGame from "../components/DoomGame";
import { Toaster } from "sonner";
import { useKonamiCode } from "../hooks/useKonamiCode";
import { useAuth } from "../hooks/useAuth";

export default function MainLayout() {
  const { user, isLoading } = useAuth();
  const [showDoom, setShowDoom] = useState(false);

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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <span className="text-sm text-gray-500">Оно грузится. Терпите....</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <div className="max-w-md space-y-4">
          <p className="text-2xl font-semibold text-gray-800">Сессия потеряна</p>
          <p className="text-gray-600">
            Вы не авторизованы или ваша сессия устарела. Чтобы продолжить работу с системой,
            войдите снова.
          </p>
          <Link
            to="/auth/login"
            className="inline-flex items-center justify-center rounded-lg bg-[var(--mezon-accent)] px-6 py-3 font-semibold text-white shadow-lg shadow-[var(--mezon-accent-transparent)] transition hover:opacity-90"
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
          <Link
            to="/lms"
            className="mezon-chip mezon-chip--teal flex items-center gap-2 hover:bg-teal-600 transition-colors cursor-pointer"
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
      <div className="flex">
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
