// src/components/dashboard/widgets/UnitEconomicsWidget.tsx
import { Calculator, Users } from 'lucide-react';

interface UnitEcon {
  totalCost: number;
  childCount: number;
  costPerChild: number;
  breakdown: { label: string; amount: number; pct: number }[];
}

const formatCompact = (n: number) =>
  new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

const BAR_COLORS = ['#EC4899', '#3B82F6', '#F59E0B', '#6366F1', '#10B981', '#F43F5E'];

export default function UnitEconomicsWidget({ data }: { data: UnitEcon | undefined }) {
  if (!data) return null;

  const breakdown = data.breakdown ?? [];

  return (
    <div className="flex flex-col gap-3.5 h-full">
      {/* Hero card */}
      <div className="p-3.5 rounded-xl bg-surface-primary dark:bg-slate-800/60 border border-separator/40 shadow-subtle flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Себестоимость / ребёнок</span>
          <p className="text-[26px] font-black text-text-primary tracking-tight leading-tight tabular-nums">
            {formatCompact(data.costPerChild ?? 0)}
          </p>
          <span className="text-[11px] text-text-tertiary">в месяц</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-tint-blue/80 dark:bg-blue-950/40 text-macos-blue border border-macos-blue/15">
          <Users className="h-4 w-4" />
          <span className="text-[13px] font-bold tabular-nums">{data.childCount}</span>
          <span className="text-[11px] font-medium">детей</span>
        </div>
      </div>

      {/* Cost breakdown list */}
      <div className="flex flex-col gap-2 flex-1 justify-center">
        {breakdown.map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 text-[12px]">
            <span className="w-28 text-text-secondary truncate text-[11px] font-medium shrink-0">
              {item.label}
            </span>
            <div className="flex-1 h-2 bg-fill-quaternary dark:bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max(item.pct, 2)}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
              />
            </div>
            <span className="w-10 text-right text-[11px] font-bold text-text-primary tabular-nums shrink-0">
              {item.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
