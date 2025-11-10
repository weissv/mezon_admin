// src/contexts/AuthContext.tsx
import { createContext, useEffect, useState } from "react";
import { api } from "../lib/api";

type User = { id: number; email: string; role: string; employee: any };

export const AuthContext = createContext<{
  user: User | null;
  token: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
}>({ user: null, token: null, login: async () => {}, logout: () => {} });

// Cookie helper functions
const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    // Try cookie first, fallback to localStorage
    return getCookie("auth_token") || localStorage.getItem("token");
  });
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!token) return;
    api.setToken(token);
    api.get("/api/auth/me").then((res) => setUser(res)).catch(() => {
      setUser(null);
      setToken(null);
      deleteCookie("auth_token");
      localStorage.removeItem("token");
    });
  }, [token]);

  const login = async (identifier: string, password: string) => {
    const res = await api.post("/api/auth/login", { login: identifier, password });
    setToken(res.token);
    // Save to both cookie and localStorage for compatibility
    setCookie("auth_token", res.token, 7); // 7 days
    localStorage.setItem("token", res.token);
    api.setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    deleteCookie("auth_token");
    localStorage.removeItem("token");
    api.setToken(null);
  };

  return <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>;
}
