// src/components/SideNav.tsx
import { useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";
import { Facebook, Instagram, Send, X } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../hooks/useAuth";
import { usePermissions } from "../contexts/PermissionsContext";
import { getLinksWithPermissions, FULL_ACCESS_ROLES } from "../lib/modules";
import type { UserRole } from "../types/auth";

export default function SideNav() {
  const { user, logout } = useAuth();
  const { permissions, isLoading: permissionsLoading } = usePermissions();
  const loc = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [isLogoSpinning, setIsLogoSpinning] = useState(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const role = (user?.role || "TEACHER") as UserRole;
  
  // Получаем ссылки на основе прав из БД
  const links = getLinksWithPermissions(
    role,
    permissions?.modules || [],
    permissions?.isFullAccess || FULL_ACCESS_ROLES.includes(role),
    user?.email
  );

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  
  // Expose function for parent to toggle menu
  if (typeof window !== 'undefined') {
    (window as any).toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);
  }

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const newClickCount = logoClicks + 1;
    setLogoClicks(newClickCount);

    // Clear existing timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    // Reset clicks after 2 seconds of no clicking
    clickTimeoutRef.current = setTimeout(() => {
      setLogoClicks(0);
    }, 2000);

    // Trigger spin animation on 10th click
    if (newClickCount === 10) {
      setIsLogoSpinning(true);
      setLogoClicks(0);
      
      // Reset spinning state after animation completes
      setTimeout(() => {
        setIsLogoSpinning(false);
      }, 1000);
    }
  };

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
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleLogoClick}>
            <img 
              src="/logo.png" 
              alt="Mezon"
              className={clsx(
                "transition-transform duration-1000",
                isLogoSpinning && "animate-spin-flip"
              )}
              style={{
                transformStyle: 'preserve-3d',
              }}
            />
          </div>
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
            const isActive = loc.pathname === l.path || loc.pathname.startsWith(`${l.path}/`);
            
            // Для внешних ссылок (LMS) используем обычный <a> с target
            if (l.isExternal) {
              return (
                <a 
                  key={l.path} 
                  href={l.path} 
                  className={clsx("mezon-nav-link")}
                  onClick={closeMobileMenu}
                > 
                  {l.label}
                </a>
              );
            }
            
            return (
              <Link 
                key={l.path} 
                to={l.path} 
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
