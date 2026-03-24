// src/components/dashboard/widgets/FinanceOverviewWidget.tsx
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface FinanceData {
  period: number;
  income: { total: number; count: number };
  expense: { total: number; count: number };
  balance: number;
}

const currency = new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 });

function formatCompactCurrency(amount: number) {
  return new Intl.NumberFormat('ru-RU', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

export default function FinanceOverviewWidget({ data }: { data: FinanceData | undefined }) {
  if (!data) return null;

  const isPositive = data.balance >= 0;

  return (
    <div className="dashboard-finance-overview">
      <div className="dashboard-finance-overview__grid">
        <div className="dashboard-finance-card dashboard-finance-card--income">
          <TrendingUp className="h-4 w-4" />
          <p className="dashboard-finance-card__value">{formatCompactCurrency(data.income.total)}</p>
          <p className="dashboard-finance-card__meta">{data.income.count} операций</p>
        </div>
        <div className="dashboard-finance-card dashboard-finance-card--expense">
          <TrendingDown className="h-4 w-4" />
          <p className="dashboard-finance-card__value">{formatCompactCurrency(data.expense.total)}</p>
          <p className="dashboard-finance-card__meta">{data.expense.count} операций</p>
        </div>
      </div>
      <div className={`dashboard-balance ${isPositive ? 'dashboard-balance--positive' : 'dashboard-balance--negative'}`}>
        <BarChart3 className="h-4 w-4" />
        <span className="font-semibold">Баланс: {currency.format(data.balance)}</span>
      </div>
    </div>
  );
}
