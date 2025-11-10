// src/lib/api.ts
const baseURL = (import.meta as any).env?.VITE_API_URL || "";

class API {
  private token: string | null = null;
  setToken(token: string | null) {
    this.token = token;
  }
  private async request(path: string, options: RequestInit = {}) {
    const headers: any = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    
    const res = await fetch(baseURL + path, { 
      ...options, 
      headers,
      credentials: 'include' // CRITICAL: Send cookies with requests
    });
    
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      // Возвращаем тело как есть: могут быть issues от Zod
      throw data || { message: "Request failed with status " + res.status };
    }
    return data;
  }
  get(path: string) { return this.request(path); }
  post(path: string, body?: any) { return this.request(path, { method: "POST", body: JSON.stringify(body) }); }
  put(path: string, body?: any) { return this.request(path, { method: "PUT", body: JSON.stringify(body) }); }
  delete(path: string) { return this.request(path, { method: "DELETE" }); }
}

export const api = new API();
