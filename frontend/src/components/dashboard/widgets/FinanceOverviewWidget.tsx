// src/components/dashboard/widgets/FinanceOverviewWidget.tsx
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface FinanceData {
  period: number;
  income: { total: number; count: number };
  expense: { total: number; count: number };
  balance: number;
}

const currency = new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 });

export default function FinanceOverviewWidget({ data }: { data: FinanceData | undefined }) {
  if (!data) return null;

  const isPositive = data.balance >= 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="dashboard-finance-card dashboard-finance-card--income">
          <TrendingUp className="h-4 w-4" />
          <p className="text-lg font-bold">{currency.format(data.income.total)}</p>
          <p className="text-xs opacity-70">{data.income.count} операций</p>
        </div>
        <div className="dashboard-finance-card dashboard-finance-card--expense">
          <TrendingDown className="h-4 w-4" />
          <p className="text-lg font-bold">{currency.format(data.expense.total)}</p>
          <p className="text-xs opacity-70">{data.expense.count} операций</p>
        </div>
      </div>
      <div className={`dashboard-balance ${isPositive ? 'dashboard-balance--positive' : 'dashboard-balance--negative'}`}>
        <BarChart3 className="h-4 w-4" />
        <span className="font-semibold">Баланс: {currency.format(data.balance)}</span>
      </div>
    </div>
  );
}
