import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { Card } from '../../../components/ui/card';
import { LoadingCard } from '../../../components/ui/LoadingState';
import { ErrorState } from '../../../components/ui/EmptyState';
import { Input } from '../../../components/ui/input';

export default function FinanceStatisticsView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (startDate) query.append('startDate', startDate);
      if (endDate) query.append('endDate', endDate);
      
      const res = await api.get(`/api/finance/statistics/expenses?${query.toString()}`);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки статистики');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [startDate, endDate]);

  if (loading && !data) return <LoadingCard message="Загрузка статистики..." />;
  if (error) return <ErrorState message={error} onRetry={fetchStats} />;

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-end bg-white p-4 rounded-[18px] shadow-sm">
        <div>
          <label className="text-sm text-secondary">Период с</label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-secondary">Период по</label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 flex flex-col justify-center items-center">
          <h3 className="text-sm font-medium text-secondary mb-2">Общие расходы</h3>
          <p className="text-3xl font-bold text-primary">{data?.totalExpenses?.toLocaleString()} UZS</p>
        </Card>
        <Card className="p-5 flex flex-col justify-center items-center">
          <h3 className="text-sm font-medium text-secondary mb-2">Расходы на 1 ученика</h3>
          <p className="text-3xl font-bold text-primary">{Math.round(data?.perChild || 0).toLocaleString()} UZS</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-bold text-primary mb-4">Расходы по категориям</h3>
          <div className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span>Продукты (FOOD)</span>
              <span className="font-semibold">{data?.byCategory?.FOOD?.toLocaleString() || 0} UZS</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>Хозтовары (HOUSEHOLD)</span>
              <span className="font-semibold">{data?.byCategory?.HOUSEHOLD?.toLocaleString() || 0} UZS</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>Канцтовары (STATIONERY)</span>
              <span className="font-semibold">{data?.byCategory?.STATIONERY?.toLocaleString() || 0} UZS</span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-bold text-primary mb-4">Выдано сотрудникам</h3>
          {data?.byEmployee?.length > 0 ? (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {data.byEmployee.map((emp: any) => (
                <div key={emp.name} className="flex justify-between border-b pb-2">
                  <span>{emp.name}</span>
                  <span className="font-semibold">{emp.amount?.toLocaleString()} ед.</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-secondary">Нет данных за этот период</p>
          )}
        </Card>
      </div>
    </div>
  );
}
