import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate} from"react-router-dom";
import clsx from"clsx";
import { BookOpenCheck, ChevronRight, Compass, X } from "lucide-react";
import { Button} from"./ui/button";
import { useAuth} from"../hooks/useAuth";
import { ROLE_LABELS } from "../types/auth";
import type { UserRole} from"../types/auth";

export default function LmsSideNav() {
 const { user, logout} = useAuth();
 const loc = useLocation();
 const navigate = useNavigate();
 const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
 const [logoClicks, setLogoClicks] = useState(0);
 const [isLogoSpinning, setIsLogoSpinning] = useState(false);
 const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
 const role = (user?.role ||"TEACHER") as UserRole;

 const closeMobileMenu = () => setIsMobileMenuOpen(false);

 useEffect(() => {
  if (typeof window === "undefined") return;
  (window as any).toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  return () => {
    delete (window as any).toggleMobileMenu;
  };
 }, []);

 useEffect(() => {
  return () => {
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
  };
 }, []);

 const handleLogoClick = (e: React.MouseEvent) => {
 e.preventDefault();
 const newClickCount = logoClicks + 1;
 setLogoClicks(newClickCount);

 if (clickTimeoutRef.current) {
 clearTimeout(clickTimeoutRef.current);
}

 clickTimeoutRef.current = setTimeout(() => {
 setLogoClicks(0);
}, 2000);

 if (newClickCount === 10) {
 setIsLogoSpinning(true);
 setLogoClicks(0);
 setTimeout(() => {
 setIsLogoSpinning(false);
}, 1000);
}
};

 const handleLogout = () => {
  logout();
  navigate("/auth/login");
 };

 const links = [
 { path:"/lms/school", label:"Главный обзор", section: "workspace", roles: ["DEVELOPER","ADMIN","DIRECTOR","DEPUTY","TEACHER","ACCOUNTANT","ZAVHOZ"]},
 { path:"/lms/school/classes", label:"Мои классы", section: "learning", roles: ["DEVELOPER","ADMIN","DIRECTOR","DEPUTY","TEACHER"]},
 { path:"/lms/school/schedule", label:"Расписание", section: "learning", roles: ["DEVELOPER","ADMIN","DIRECTOR","DEPUTY","TEACHER","ACCOUNTANT","ZAVHOZ"]},
 { path:"/lms/school/gradebook", label:"Журнал оценок", section: "learning", roles: ["DEVELOPER","ADMIN","DIRECTOR","DEPUTY","TEACHER"]},
 { path:"/lms/school/homework", label:"Домашние задания", section: "learning", roles: ["DEVELOPER","ADMIN","DIRECTOR","DEPUTY","TEACHER"]},
 { path:"/lms/school/attendance", label:"Посещаемость", section: "learning", roles: ["DEVELOPER","ADMIN","DIRECTOR","DEPUTY","TEACHER"]},
 { path:"/lms/ai-assistant", label:"ИИ-методист", section: "workspace", roles: ["DEVELOPER","ADMIN","DIRECTOR","DEPUTY","TEACHER"]},
 { path:"/lms/diary", label:"Дневник", section: "student", roles: ["STUDENT","PARENT"]},
 ];
 
 const filteredLinks = links.filter(l => l.roles.includes(role) || l.roles.includes("STUDENT"));
 const groupedLinks = [
  { id: "workspace", label: "Рабочее место", links: filteredLinks.filter((link) => link.section === "workspace") },
  { id: "learning", label: "Учебный процесс", links: filteredLinks.filter((link) => link.section === "learning") },
  { id: "student", label: "Личные сценарии", links: filteredLinks.filter((link) => link.section === "student") },
 ].filter((group) => group.links.length > 0);

 return (
 <>
 {isMobileMenuOpen && (
 <div 
 className="mezon-mobile-overlay"
 onClick={closeMobileMenu}
 />
 )}
 
  <aside className={clsx("mezon-sidenav", isMobileMenuOpen &&"mezon-sidenav--mobile-open")}>
  <div className="mezon-sidenav__brand">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3 cursor-pointer"onClick={handleLogoClick}>
 <img 
 src="/logo.png"
 alt="Mezon"
 className={clsx(
"transition-transform 0",
 isLogoSpinning &&"animate-spin-flip"
 )}
 style={{
 transformStyle: 'preserve-3d',
}}
 />
 </div>
 <button 
 className="mezon-mobile-close"
 onClick={closeMobileMenu}
 aria-label="Close menu"
 >
 <X className="h-6 w-6"/>
 </button>
 </div>
        <p className="font-semibold text-[13px] mt-2 text-macos-blue">ШКОЛА (LMS)</p>
        <span className="mezon-sidenav__eyebrow">
          <Compass className="h-3.5 w-3.5" />
          Learning flow
        </span>
      </div>

  <div className="mezon-sidenav__user">
    <strong>{user?.employee?.firstName || user?.email || "Пользователь"}</strong>
    <span>{ROLE_LABELS[role] ?? role}</span>
  </div>

  <div className="mezon-sidenav__nav">
  {groupedLinks.map((group) => (
    <div key={group.id}>
      <p className="mezon-nav-label">{group.label}</p>
      <div className="flex flex-col gap-1">
      {group.links.map((l) => {
      const isActive = loc.pathname === l.path || (l.path !== '/lms/school' && loc.pathname.startsWith(l.path));
      return (
      <Link 
      key={l.path} 
      to={l.path} 
      className={clsx("mezon-nav-link", isActive &&"mezon-nav-link--active")}
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

  <div className="mezon-sidenav__footer">
  <p className="inline-flex items-center gap-2">
    <BookOpenCheck className="h-3.5 w-3.5" />
    Сфокусированная учебная навигация
  </p>
  <Button type="button"className="mt-4 w-full"variant="outline"onClick={handleLogout}>
  Выйти
  </Button>
 </div>
 </aside>
 </>
 );
}
