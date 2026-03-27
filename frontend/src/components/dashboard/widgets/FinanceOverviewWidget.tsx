// src/components/dashboard/widgets/FinanceOverviewWidget.tsx
import { TrendingUp, TrendingDown, BarChart3, Wallet, Landmark } from 'lucide-react';

interface FinanceData {
  period: number;
  income: { total: number; count: number };
  expense: { total: number; count: number };
  balance: number;
  balances?: {
    cash: number | null;
    bank: number | null;
    snapshotDate: string | null;
  };
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
  const hasCashBalances = data.balances && (data.balances.cash != null || data.balances.bank != null);

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
      {hasCashBalances && (
        <div className="flex gap-3 text-xs mt-2">
          {data.balances!.cash != null && (
            <div className="flex items-center gap-1 text-green-700">
              <Wallet className="h-3 w-3" />
              <span>Касса: {formatCompactCurrency(data.balances!.cash)}</span>
            </div>
          )}
          {data.balances!.bank != null && (
            <div className="flex items-center gap-1 text-blue-700">
              <Landmark className="h-3 w-3" />
              <span>Банк: {formatCompactCurrency(data.balances!.bank)}</span>
            </div>
          )}
        </div>
      )}
      <div className={`dashboard-balance ${isPositive ? 'dashboard-balance--positive' : 'dashboard-balance--negative'}`}>
        <BarChart3 className="h-4 w-4" />
        <span className="font-semibold">Баланс: {currency.format(data.balance)}</span>
      </div>
    </div>
  );
}
