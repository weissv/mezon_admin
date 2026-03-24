// src/hooks/useDashboardPreferences.ts
// Хук для загрузки, сохранения и сброса настроек дашборда

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api';
import type { DashboardBootstrap, DashboardPreferences, LayoutItem } from '../types/dashboard';
import { toast } from 'sonner';

interface UseDashboardPreferencesReturn {
  bootstrap: DashboardBootstrap | null;
  preferences: DashboardPreferences | null;
  isLoading: boolean;
  error: string | null;
  /** Сохранить preferences (partial merge) */
  savePreferences: (patch: Partial<DashboardPreferences>) => Promise<void>;
  /** Сохранить layout отдельно (для drag-and-drop без debounce-задержки) */
  saveLayout: (layout: LayoutItem[]) => Promise<void>;
  /** Сбросить к значениям по умолчанию */
  resetPreferences: () => Promise<void>;
  /** Перезагрузить bootstrap */
  refetch: () => Promise<void>;
}

export function useDashboardPreferences(): UseDashboardPreferencesReturn {
  const [bootstrap, setBootstrap] = useState<DashboardBootstrap | null>(null);
  const [preferences, setPreferences] = useState<DashboardPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchBootstrap = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data: DashboardBootstrap = await api.get('/api/dashboard/bootstrap');
      if (!mountedRef.current) return;
      setBootstrap(data);
      setPreferences(data.preferences);
    } catch (err: any) {
      if (!mountedRef.current) return;
      setError(err?.message || 'Ошибка загрузки дашборда');
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchBootstrap();
    return () => { mountedRef.current = false; };
  }, [fetchBootstrap]);

  const savePreferences = useCallback(async (patch: Partial<DashboardPreferences>) => {
    if (!preferences) return;

    // Оптимистичное обновление
    const merged = { ...preferences, ...patch };
    setPreferences(merged);

    try {
      const saved: DashboardPreferences = await api.put('/api/dashboard/preferences', patch);
      if (mountedRef.current) setPreferences(saved);
    } catch (err: any) {
      // Откатываем
      if (mountedRef.current) setPreferences(preferences);
      toast.error('Не удалось сохранить настройки', { description: err?.message });
    }
  }, [preferences]);

  const saveLayout = useCallback(async (layout: LayoutItem[]) => {
    if (!preferences) return;

    // Оптимистичное обновление
    setPreferences(prev => prev ? { ...prev, layout } : prev);

    // Debounce: не сохраняем каждый drag
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.put('/api/dashboard/preferences', { layout });
      } catch {
        // Тихая ошибка для layout — не блокировать UX
      }
    }, 1000);
  }, [preferences]);

  const resetPreferences = useCallback(async () => {
    try {
      const defaults: DashboardPreferences = await api.post('/api/dashboard/preferences/reset', {});
      if (mountedRef.current) setPreferences(defaults);
      toast.success('Настройки дашборда сброшены');
    } catch (err: any) {
      toast.error('Не удалось сбросить настройки', { description: err?.message });
    }
  }, []);

  return {
    bootstrap,
    preferences,
    isLoading,
    error,
    savePreferences,
    saveLayout,
    resetPreferences,
    refetch: fetchBootstrap,
  };
}
