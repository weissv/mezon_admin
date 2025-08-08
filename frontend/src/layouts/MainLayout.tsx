// src/layouts/MainLayout.tsx
import { Outlet } from "react-router-dom";
import SideNav from "../components/SideNav";
import { Toaster } from "sonner";

export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SideNav />
      <main className="flex-1 p-6">
        <Toaster position="top-right" richColors />
        <Outlet />
      </main>
    </div>
  );
}
