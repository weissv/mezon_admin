// src/contexts/AuthContext.tsx
import { createContext, useEffect, useState } from "react";
import { api } from "../lib/api";

type User = { id: number; email: string; role: string; employee: any };

export const AuthContext = createContext<{
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}>({ user: null, token: null, login: async () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!token) return;
    api.setToken(token);
    api.get("/api/auth/me").then((res) => setUser(res)).catch(() => setUser(null));
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post("/api/auth/login", { email, password });
    setToken(res.token);
    localStorage.setItem("token", res.token);
    api.setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    api.setToken(null);
  };

  return <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>;
}
