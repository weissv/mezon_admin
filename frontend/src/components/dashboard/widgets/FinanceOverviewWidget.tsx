// src/components/dashboard/widgets/FinanceOverviewWidget.tsx
import { TrendingUp, TrendingDown, Wallet, Landmark } from 'lucide-react';

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

function formatCompact(amount: number) {
  return new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 }).format(amount);
}

export default function FinanceOverviewWidget({ data }: { data: FinanceData | undefined }) {
  if (!data) return null;

  const isPositive = data.balance >= 0;
  const hasCashBalances = data.balances && (data.balances.cash != null || data.balances.bank != null);

  return (
    <div className="flex flex-col gap-3 h-full justify-between">
      {/* Balance hero */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-surface-primary dark:bg-slate-800/60 border border-separator/40 shadow-subtle flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
            Баланс за {data.period} дн.
          </span>
          <p className={`text-[28px] font-black tracking-tight leading-tight tabular-nums ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {isPositive ? '+' : ''}{formatCompact(data.balance)}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPositive ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'}`}>
          {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
        </div>
      </div>

      {/* Income / expense row */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-xl bg-surface-primary/70 dark:bg-slate-800/40 border border-separator/40 shadow-subtle">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold uppercase">Доход</span>
          </div>
          <p className="text-[17px] font-bold text-text-primary tabular-nums">{formatCompact(data.income.total)}</p>
          <p className="text-[10px] text-text-tertiary mt-0.5">{data.income.count} операций</p>
        </div>

        <div className="p-3 rounded-xl bg-surface-primary/70 dark:bg-slate-800/40 border border-separator/40 shadow-subtle">
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 mb-1">
            <TrendingDown className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold uppercase">Расход</span>
          </div>
          <p className="text-[17px] font-bold text-text-primary tabular-nums">{formatCompact(data.expense.total)}</p>
          <p className="text-[10px] text-text-tertiary mt-0.5">{data.expense.count} операций</p>
        </div>
      </div>

      {/* Cash / bank balances */}
      {hasCashBalances && (
        <div className="grid grid-cols-2 gap-2.5">
          {data.balances!.cash != null && (
            <div className="p-2.5 rounded-xl bg-surface-primary/50 dark:bg-slate-800/30 border border-separator/30 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Wallet className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-text-tertiary leading-none">Касса</p>
                <p className="text-[13px] font-bold text-text-primary mt-1 leading-none tabular-nums truncate">
                  {formatCompact(data.balances!.cash!)}
                </p>
              </div>
            </div>
          )}
          {data.balances!.bank != null && (
            <div className="p-2.5 rounded-xl bg-surface-primary/50 dark:bg-slate-800/30 border border-separator/30 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Landmark className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-text-tertiary leading-none">Банк</p>
                <p className="text-[13px] font-bold text-text-primary mt-1 leading-none tabular-nums truncate">
                  {formatCompact(data.balances!.bank!)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
