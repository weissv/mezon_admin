// src/components/dashboard/widgets/CashForecastWidget.tsx
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ForecastDay {
  date: string;
  income: number;
  expense: number;
  cumulative: number;
}

interface CashForecastData {
  days: ForecastDay[];
  totalIncome: number;
  totalExpense: number;
  netChange: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

export default function CashForecastWidget({ data }: { data: CashForecastData | undefined }) {
  if (!data) return null;

  const days = data.days ?? [];
  const maxAbs = Math.max(...days.map(d => Math.abs(d.cumulative)), 1);

  return (
    <div className="flex flex-col gap-3.5 h-full justify-between">
      {/* Net forecast hero */}
      <div className="p-3.5 rounded-xl bg-surface-primary dark:bg-slate-800/60 border border-separator/40 shadow-subtle flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Прогноз нетто · 30 дн.</span>
          <p className={`text-[26px] font-black tracking-tight leading-tight tabular-nums ${data.netChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {data.netChange >= 0 ? '+' : ''}{fmt(data.netChange)}
          </p>
        </div>
        <div className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${data.netChange >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'}`}>
          {data.netChange >= 0 ? 'Профицит' : 'Дефицит'}
        </div>
      </div>

      {/* Bars container */}
      <div className="p-3 rounded-xl bg-surface-primary/60 dark:bg-slate-800/40 border border-separator/40 flex flex-col justify-end flex-1 min-h-[80px]">
        <div className="flex items-end gap-1 h-16 w-full">
          {days.map((d, i) => {
            const h = Math.round((Math.abs(d.cumulative) / maxAbs) * 100);
            const isPos = d.cumulative >= 0;
            return (
              <div
                key={i}
                className={`flex-1 rounded-t-sm transition-all duration-300 hover:opacity-80 ${isPos ? 'bg-emerald-500/80' : 'bg-rose-500/80'}`}
                style={{ height: `${Math.max(h, 6)}%` }}
                title={`${d.date}: ${fmt(d.cumulative)}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between items-center text-[9px] text-text-tertiary mt-1 pt-1 border-t border-separator/30">
          <span>День 1</span>
          <span>15</span>
          <span>День 30</span>
        </div>
      </div>

      {/* 3 summary cells */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-xl bg-surface-primary/70 dark:bg-slate-800/40 border border-separator/40 text-center">
          <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 mb-0.5">
            <TrendingUp className="h-3 w-3" />
            <span className="text-[10px] font-semibold uppercase">Доход</span>
          </div>
          <p className="text-[13px] font-bold text-text-primary tabular-nums">{fmt(data.totalIncome)}</p>
        </div>

        <div className="p-2.5 rounded-xl bg-surface-primary/70 dark:bg-slate-800/40 border border-separator/40 text-center">
          <div className="flex items-center justify-center gap-1 text-rose-600 dark:text-rose-400 mb-0.5">
            <TrendingDown className="h-3 w-3" />
            <span className="text-[10px] font-semibold uppercase">Расход</span>
          </div>
          <p className="text-[13px] font-bold text-text-primary tabular-nums">{fmt(data.totalExpense)}</p>
        </div>

        <div className="p-2.5 rounded-xl bg-surface-primary/70 dark:bg-slate-800/40 border border-separator/40 text-center">
          <div className="flex items-center justify-center gap-1 text-macos-blue mb-0.5">
            <Minus className="h-3 w-3" />
            <span className="text-[10px] font-semibold uppercase">Нетто</span>
          </div>
          <p className={`text-[13px] font-bold tabular-nums ${data.netChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {fmt(data.netChange)}
          </p>
        </div>
      </div>
    </div>
  );
}
