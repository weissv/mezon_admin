// src/components/dashboard/widgets/CashForecastWidget.tsx
import { TrendingUp, TrendingDown, Minus} from 'lucide-react';

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
 new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0}).format(n);

export default function CashForecastWidget({ data}: { data: CashForecastData | undefined}) {
 if (!data) return null;

 const days = data.days ?? [];
 const maxAbs = Math.max(...days.map(d => Math.abs(d.cumulative)), 1);

 return (
 <div className="space-y-3">
 <div className="flex justify-between text-xs text-[var(--text-secondary)]">
 <span>Прогноз на 30 дней</span>
 <span className={data.netChange >= 0 ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}>
 {data.netChange >= 0 ? '+' : ''}{fmt(data.netChange)}
 </span>
 </div>

 {/* Mini bar chart */}
 <div className="flex items-end gap-px h-16">
 {days.map((d, i) => {
 const h = Math.round((Math.abs(d.cumulative) / maxAbs) * 100);
 return (
 <div
 key={i}
 className={`flex-1 rounded-t macos-transition ${d.cumulative >= 0 ? 'bg-green-400' : 'bg-red-400'}`}
 style={{ height: `${Math.max(h, 4)}%`}}
 title={`${d.date}: ${fmt(d.cumulative)}`}
 />
 );
})}
 </div>

 <div className="grid grid-cols-3 gap-2 text-center text-xs">
 <div>
 <TrendingUp className="h-3 w-3 mx-auto text-[var(--color-green)]"/>
 <p className="font-medium">{fmt(data.totalIncome)}</p>
 <p className="text-[var(--text-tertiary)]">Доход</p>
 </div>
 <div>
 <TrendingDown className="h-3 w-3 mx-auto text-[var(--color-red)]"/>
 <p className="font-medium">{fmt(data.totalExpense)}</p>
 <p className="text-[var(--text-tertiary)]">Расход</p>
 </div>
 <div>
 <Minus className="h-3 w-3 mx-auto text-blue-500"/>
 <p className="font-medium">{fmt(data.netChange)}</p>
 <p className="text-[var(--text-tertiary)]">Нетто</p>
 </div>
 </div>
 </div>
 );
}
