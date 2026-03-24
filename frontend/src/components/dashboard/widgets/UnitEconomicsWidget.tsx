// src/components/dashboard/widgets/UnitEconomicsWidget.tsx
import { Calculator, Users } from 'lucide-react';

interface UnitEcon {
  totalCost: number;
  childCount: number;
  costPerChild: number;
  breakdown: { label: string; amount: number; pct: number }[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(n);

const BAR_COLORS = ['bg-pink-500', 'bg-teal-500', 'bg-amber-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-rose-400'];

export default function UnitEconomicsWidget({ data }: { data: UnitEcon | undefined }) {
  if (!data) return null;

  const breakdown = data.breakdown ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-pink-50">
          <Calculator className="h-5 w-5 text-pink-600" />
        </div>
        <div>
          <p className="text-xl font-bold">{fmt(data.costPerChild ?? 0)}</p>
          <p className="text-xs text-gray-500">на 1 ребёнка / мес</p>
        </div>
        <div className="ml-auto text-right text-xs text-gray-400">
          <Users className="h-3 w-3 inline mr-1" />
          {data.childCount} детей
        </div>
      </div>

      <div className="space-y-2">
        {breakdown.map((item, i) => (
          <div key={i}>
            <div className="flex justify-between text-xs mb-0.5">
              <span>{item.label}</span>
              <span className="text-gray-500">{item.pct}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`}
                style={{ width: `${item.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
