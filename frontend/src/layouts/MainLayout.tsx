// src/layouts/MainLayout.tsx
import { Outlet } from "react-router-dom";
import { Phone, Mail, Facebook, Instagram, Send } from "lucide-react";
import SideNav from "../components/SideNav";
import { Toaster } from "sonner";

export default function MainLayout() {
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

  return (
    <div className="mezon-app">
      <header className="mezon-top-bar">
        <div className="mezon-top-bar__cluster">
          {contacts.map(({ icon: Icon, label }) => (
            <span key={label} className="mezon-chip">
              <Icon className="h-4 w-4" />
              {label}
            </span>
          ))}
        </div>
        <div className="mezon-top-bar__cluster">
          <span className="mezon-chip mezon-chip--teal">STEAM // семейная школа</span>
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
