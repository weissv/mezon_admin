// src/contexts/AuthContext.tsx
import { createContext, useEffect, useState } from "react";
import { api } from "../lib/api";

type User = { id: number; email: string; role: string; employee: any };

const TOKEN_STORAGE_KEY = "auth_token";

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
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [isLoading, setIsLoading] = useState(true);

  // Attempt to restore session on mount using HttpOnly cookie or stored token fallback
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // First try cookie-based session (preferred)
        const response = await api.get("/api/auth/me");
        const resolvedUser = response?.user ?? response;
        setUser(resolvedUser);
        setToken(null);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        api.setToken(null);
        return;
      } catch (cookieError) {
        // Ignore and fallback to token storage if available
      }

      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (storedToken) {
        try {
          api.setToken(storedToken);
          const response = await api.get("/api/auth/me");
          const resolvedUser = response?.user ?? response;
          setUser(resolvedUser);
          setToken(storedToken);
          return;
        } catch (tokenError) {
          // Stored token is invalid - clean up
          api.setToken(null);
          setToken(null);
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
      }

      setUser(null);
    };

    initializeSession().finally(() => setIsLoading(false));
  }, []);

  const login = async (identifier: string, password: string) => {
    const res = await api.post("/api/auth/login", { login: identifier, password });
    const resolvedUser = res?.user ?? null;
    setUser(resolvedUser);

    if (res?.token) {
      api.setToken(res.token);
      setToken(res.token);
      localStorage.setItem(TOKEN_STORAGE_KEY, res.token);
    }
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      setToken(null);
      api.setToken(null);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
