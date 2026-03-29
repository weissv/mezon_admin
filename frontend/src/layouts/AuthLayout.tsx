// src/layouts/AuthLayout.tsx
import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";

export default function AuthLayout() {
  return (
    <div className="relative min-h-screen bg-[#F5F5F7] pb-16 pt-8">
      {/* Subtle gradient orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(0,122,255,0.06),transparent_70%)]" />
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(175,82,222,0.05),transparent_70%)]" />
      </div>
      <Toaster position="top-right" richColors />
      <Outlet />
    </div>
  );
}
