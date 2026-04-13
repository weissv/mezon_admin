// src/components/SideNav.tsx
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";
import { ChevronRight, Compass, LifeBuoy, X } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../hooks/useAuth";
import { usePermissions } from "../contexts/PermissionsContext";
import { getLinksWithPermissions, FULL_ACCESS_ROLES, groupModuleLinks } from "../lib/modules";
import { ROLE_LABELS, type UserRole } from "../types/auth";

export default function SideNav() {
  const { user, logout } = useAuth();
  const { permissions, isLoading: permissionsLoading } = usePermissions();
  const loc = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [isLogoSpinning, setIsLogoSpinning] = useState(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const role = (user?.role || "TEACHER") as UserRole;
  const userName = user?.employee
    ? [user.employee.firstName, user.employee.lastName].filter(Boolean).join(" ")
    : user?.email ?? "Пользователь";

  const links = getLinksWithPermissions(
    role,
    permissions?.modules || [],
    permissions?.isFullAccess || FULL_ACCESS_ROLES.includes(role),
    user?.email
  );
  const groupedLinks = groupModuleLinks(links);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as any).toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
    return () => { delete (window as any).toggleMobileMenu; };
  }, []);

  useEffect(() => {
    return () => { if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current); };
  }, []);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const newCount = logoClicks + 1;
    setLogoClicks(newCount);
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => setLogoClicks(0), 2000);
    if (newCount === 10) {
      setIsLogoSpinning(true);
      setLogoClicks(0);
      setTimeout(() => setIsLogoSpinning(false), 1000);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="mezon-mobile-overlay" onClick={closeMobileMenu} />
      )}

      <aside className={clsx("mezon-sidenav", isMobileMenuOpen && "mezon-sidenav--mobile-open")}>
        {/* Brand */}
        <div className="mezon-sidenav__brand">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={handleLogoClick}>
              <img
                src="/logo.png"
                alt="Mezon"
                className={clsx(
                  "transition-transform",
                  isLogoSpinning && "animate-spin-flip"
                )}
                style={{ transformStyle: 'preserve-3d' }}
              />
            </div>
            <button
              className="mezon-mobile-close"
              onClick={closeMobileMenu}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p>Управление школой из одного окна</p>
          <span className="mezon-sidenav__eyebrow">
            <Compass className="h-3.5 w-3.5" />
            ERP workspace
          </span>
        </div>

        {/* User card */}
        <div className="mezon-sidenav__user">
          <strong>{userName}</strong>
          <span>{ROLE_LABELS[role] ?? role}{permissionsLoading ? " · загрузка прав…" : ""}</span>
        </div>

        {/* Navigation */}
        <div className="mezon-sidenav__nav">
          {groupedLinks.map((group) => (
            <div key={group.id}>
              <p className="mezon-nav-label">{group.label}</p>
              <div className="flex flex-col gap-0.5">
                {group.links.map((l) => {
                  const isActive = loc.pathname === l.path || loc.pathname.startsWith(`${l.path}/`);

                  if (l.isExternal) {
                    return (
                      <a
                        key={l.path}
                        href={l.path}
                        className="mezon-nav-link"
                        onClick={closeMobileMenu}
                      >
                        <span className="mezon-nav-link__label">{l.label}</span>
                        <ChevronRight className="mezon-nav-link__indicator h-4 w-4" />
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
                      <span className="mezon-nav-link__label">{l.label}</span>
                      <ChevronRight className="mezon-nav-link__indicator h-4 w-4" />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mezon-sidenav__footer">
          <p className="inline-flex items-center gap-2">
            <LifeBuoy className="h-3.5 w-3.5" />
            Быстрый доступ к поддержке
          </p>
          <p className="font-semibold text-macos-blue text-[12px]">feedback · bugs · product notes</p>
          <Button type="button" className="mt-3 w-full" variant="outline" size="sm" onClick={logout}>
            Выйти
          </Button>
        </div>
      </aside>
    </>
  );
}
