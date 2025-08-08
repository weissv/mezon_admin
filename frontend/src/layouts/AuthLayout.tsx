// mezon_admin/frontend/src/layouts/AuthLayout.tsx
import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <Outlet /> {/* Этот компонент будет отображать LoginPage */}
    </div>
  );
}