// src/hooks/useApi.ts
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { toast } from 'sonner';

interface UseApiOptions<T> {
  url: string;
  initialPage?: number;
  initialPageSize?: number;
  initialSearch?: string;
  searchFields?: (keyof T)[];
}

export function useApi<T>({
  url,
  initialPage = 1,
  initialPageSize = 10,
  initialSearch = '',
  searchFields = [],
}: UseApiOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(initialPageSize),
      });
      if (search && searchFields.length > 0) {
        searchFields.forEach((field) => {
          params.append(field as string, search);
        });
      }
      const response = await api.get(`${url}?${params.toString()}`);
      setData(response.items);
      setTotal(response.total);
    } catch (error: any) {
      const msg = error?.message || error?.issues?.[0]?.message || 'Ошибка';
      toast.error('Ошибка загрузки данных', { description: msg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search]);

  return { data, total, page, search, loading, setPage, setSearch, fetchData };
}
