// src/lib/api.ts
const rawBaseUrl = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";
const normalizedHost = rawBaseUrl.replace(/\/+$/, "");
const apiBase = normalizedHost.endsWith("/api") ? normalizedHost : `${normalizedHost}/api`;

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

const buildUrl = (path: string) => {
  if (isAbsoluteUrl(path)) return path;
  const trimmed = path.replace(/^\/+/, "");
  if (!trimmed) return apiBase;
  const withoutApiPrefix = trimmed.startsWith("api/") ? trimmed.slice(4) : trimmed;
  return `${apiBase}/${withoutApiPrefix}`;
};

class API {
  private token: string | null = null;
  setToken(token: string | null) {
    this.token = token;
  }
  private normalizeHeaders(headers?: HeadersInit) {
    if (!headers) return {} as Record<string, string>;
    if (headers instanceof Headers) {
      const acc: Record<string, string> = {};
      headers.forEach((value, key) => {
        acc[key] = value;
      });
      return acc;
    }
    if (Array.isArray(headers)) {
      return headers.reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
    }
    return { ...headers } as Record<string, string>;
  }
  private async request(path: string, options: RequestInit = {}) {
    const headers = this.normalizeHeaders(options.headers);
    if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const target = buildUrl(path);
    const res = await fetch(target, {
      ...options,
      headers,
      credentials: "include", // CRITICAL: Send cookies with requests
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      // Возвращаем тело как есть: могут быть issues от Zod
      throw data || { message: "Request failed with status " + res.status };
    }
    return data;
  }
  get(path: string) {
    return this.request(path);
  }
  post(path: string, body?: any) {
    return this.request(path, { method: "POST", body: JSON.stringify(body) });
  }
  put(path: string, body?: any) {
    return this.request(path, { method: "PUT", body: JSON.stringify(body) });
  }
  delete(path: string) {
    return this.request(path, { method: "DELETE" });
  }

  async download(path: string, options: RequestInit = {}) {
    const headers = this.normalizeHeaders(options.headers);
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const target = buildUrl(path);
    const res = await fetch(target, {
      ...options,
      headers,
      credentials: "include",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Request failed with status ${res.status}`);
    }

    return res.blob();
  }
}

export const api = new API();
