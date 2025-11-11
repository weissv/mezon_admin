// src/contexts/AuthContext.tsx
import { createContext, useCallback, useEffect, useState, ReactNode } from "react";
import { api } from "../lib/api";

type User = { id: number; email: string; role: string; employee: any };

const TOKEN_STORAGE_KEY = "auth_token";
const USER_STORAGE_KEY = "auth_user";

const readStoredUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch (error) {
    console.warn("Failed to parse stored auth user", error);
    if (typeof window !== "undefined") {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
    return null;
  }
};

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredUser());
  const [token, setToken] = useState<string | null>(() =>
    typeof window === "undefined" ? null : localStorage.getItem(TOKEN_STORAGE_KEY)
  );
  const [isLoading, setIsLoading] = useState(true);

  const persistSession = useCallback((nextToken: string | null, nextUser: User | null) => {
    setToken(nextToken);
    setUser(nextUser);

    if (typeof window !== "undefined") {
      if (nextToken) {
        localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }

      if (nextUser) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }

    api.setToken(nextToken);
  }, []);

  useEffect(() => {
    const initializeSession = async () => {
      // Attempt to use HttpOnly cookie session first
      try {
        const response = await api.get("/api/auth/me");
        const resolvedUser = response?.user ?? response ?? null;
        if (resolvedUser) {
          persistSession(null, resolvedUser);
          return;
        }
      } catch (cookieError) {
        // Ignore errors and continue with token fallback
      }

  const storedToken = typeof window === "undefined" ? null : localStorage.getItem(TOKEN_STORAGE_KEY);
      const storedUser = readStoredUser();

      if (storedToken) {
        try {
          api.setToken(storedToken);
          const response = await api.get("/api/auth/me");
          const resolvedUser = response?.user ?? response ?? storedUser ?? null;
          persistSession(storedToken, resolvedUser);
          return;
        } catch (error: any) {
          const message = String(error?.message || "").toLowerCase();
          if (message.includes("unauthorized") || message.includes("invalid")) {
            persistSession(null, null);
            return;
          }

          if (storedUser) {
            // Keep optimistic session if network temporarily failed
            persistSession(storedToken, storedUser);
            return;
          }

          persistSession(null, null);
          return;
        }
      }

      if (storedUser) {
        persistSession(null, storedUser);
        return;
      }

      persistSession(null, null);
    };

    initializeSession().finally(() => setIsLoading(false));
  }, [persistSession]);

  const login = async (identifier: string, password: string) => {
    const res = await api.post("/api/auth/login", { login: identifier, password });
    const resolvedUser = res?.user ?? null;
    const resolvedToken = res?.token ?? null;

    persistSession(resolvedToken, resolvedUser);
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      persistSession(null, null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
