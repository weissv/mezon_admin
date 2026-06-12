import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { Card } from '../../../components/ui/Card';
import { LoadingCard } from '../../../components/ui/LoadingState';
import { ErrorState } from '../../../components/ui/EmptyState';
import { Input } from '../../../components/ui/input';

export default function FinanceStatisticsView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expensesData, setExpensesData] = useState<any>(null);
  const [employeeUsage, setEmployeeUsage] = useState<any[]>([]);
  
  const [period, setPeriod] = useState<string>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      query.append('period', period);
      if (period === 'custom') {
        if (startDate) query.append('startDate', startDate);
        if (endDate) query.append('endDate', endDate);
      }
      
      const [expensesRes, usageRes] = await Promise.all([
        api.get(`/api/analytics/expenses?${query.toString()}`),
        api.get(`/api/analytics/employee-usage?${query.toString()}`)
      ]);
      setExpensesData(expensesRes);
      setEmployeeUsage(usageRes);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки статистики');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [period, startDate, endDate]);

  if (loading && !expensesData) return <LoadingCard message="Загрузка статистики..." />;
  if (error) return <ErrorState message={error} onRetry={fetchStats} />;

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-end bg-white p-4 rounded-[18px] shadow-sm">
        <div>
          <label className="text-sm text-secondary">Период</label>
          <select 
            className="mezon-input block w-[200px]" 
            value={period} 
            onChange={e => setPeriod(e.target.value)}
          >
            <option value="month">Текущий месяц</option>
            <option value="quarter">Текущий квартал</option>
            <option value="year">Текущий год</option>
            <option value="custom">Произвольный период</option>
          </select>
        </div>
        {period === 'custom' && (
          <>
            <div>
              <label className="text-sm text-secondary">Период с</label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-secondary">Период по</label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 flex flex-col justify-center items-center">
          <h3 className="text-sm font-medium text-secondary mb-2">Общие расходы со склада (Сумма)</h3>
          <p className="text-3xl font-bold text-primary">{expensesData?.expenses?.total?.toLocaleString()} UZS</p>
          <p className="text-xs text-secondary mt-1">Основано на выдаче со склада (OUT)</p>
        </Card>
        <Card className="p-5 flex flex-col justify-center items-center">
          <h3 className="text-sm font-medium text-secondary mb-2">Расходы на 1 ученика</h3>
          <p className="text-3xl font-bold text-primary">{Math.round(expensesData?.students?.expensesPerChild || 0).toLocaleString()} UZS</p>
          <p className="text-xs text-secondary mt-1">Активных учеников за период: {expensesData?.students?.activeCount || 0}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-bold text-primary mb-4">Расходы по категориям</h3>
          <div className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span>Продукты (FOOD)</span>
              <span className="font-semibold">{expensesData?.expenses?.food?.toLocaleString() || 0} UZS</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>Хозтовары (HOUSEHOLD)</span>
              <span className="font-semibold">{expensesData?.expenses?.household?.toLocaleString() || 0} UZS</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>Канцтовары (STATIONERY)</span>
              <span className="font-semibold">{expensesData?.expenses?.stationery?.toLocaleString() || 0} UZS</span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-bold text-primary mb-4">Выдано сотрудникам (по заявкам)</h3>
          {employeeUsage?.length > 0 ? (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {employeeUsage.map((emp: any) => (
                <div key={emp.employeeId} className="border border-mezon-border-subtle rounded-xl p-3 bg-mezon-base-neutral">
                  <h4 className="font-semibold text-primary">{emp.employeeName} <span className="text-xs font-normal text-secondary ml-2">{emp.employeePosition}</span></h4>
                  <ul className="mt-2 space-y-1">
                    {emp.usage.map((item: any) => (
                      <li key={item.itemName} className="flex justify-between text-sm text-secondary">
                        <span>{item.itemName}</span>
                        <span className="font-medium text-primary">{item.quantity} {item.unit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-secondary">Нет данных о выдаче за выбранный период</p>
          )}
        </Card>
      </div>

      {expensesData?.itemsUsage && expensesData.itemsUsage.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-bold text-primary mb-4">Детализация количественного расхода ТМЦ</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b">
                <tr>
                  <th className="pb-2 font-medium">Товар</th>
                  <th className="pb-2 font-medium">Категория</th>
                  <th className="pb-2 font-medium text-right">Выдано со склада</th>
                  <th className="pb-2 font-medium text-right">Общая сумма</th>
                  <th className="pb-2 font-medium text-right">На 1 ученика</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mezon-border-subtle">
                {expensesData.itemsUsage.map((item: any) => (
                  <tr key={item.id} className="hover:bg-mezon-base-neutral">
                    <td className="py-3 font-medium text-primary">{item.name}</td>
                    <td className="py-3 text-secondary text-xs">{item.type}</td>
                    <td className="py-3 text-right">{item.quantity.toLocaleString()} {item.unit}</td>
                    <td className="py-3 text-right text-secondary">{item.cost.toLocaleString()} UZS</td>
                    <td className="py-3 text-right font-bold text-mezon-accent">
                      {(item.quantityPerChild).toFixed(3)} {item.unit}/чел
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
