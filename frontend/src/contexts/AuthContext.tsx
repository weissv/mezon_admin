// src/contexts/AuthContext.tsx
import { createContext, useEffect, useState } from "react";
import { api } from "../lib/api";

type User = { id: number; email: string; role: string; employee: any };

export const AuthContext = createContext<{
  user: User | null;
  token: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}>({ 
  user: null, 
  token: null, 
  login: async () => {}, 
  logout: () => {},
  isLoading: true
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await api.get("/api/auth/me");
        setUser(response.user);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (identifier: string, password: string) => {
    const res = await api.post("/api/auth/login", { login: identifier, password });
    setUser(res.user); // Backend sets HttpOnly cookie automatically
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout"); // Backend clears the cookie
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
    }
  };

  // Show loading state while checking session
  if (isLoading) {
    return null; // Or a loading spinner component
  }

  return <AuthContext.Provider value={{ user, token: null, login, logout, isLoading }}>{children}</AuthContext.Provider>;
}
