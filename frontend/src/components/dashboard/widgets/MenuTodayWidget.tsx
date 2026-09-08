// src/components/dashboard/widgets/MenuTodayWidget.tsx
import { UtensilsCrossed, Users } from 'lucide-react';

interface MenuItem {
  name: string;
  mealType: string;
}

interface MenuTodayData {
  date: string;
  items: MenuItem[];
  childrenOnMeals: number;
  totalChildren: number;
}

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Завтрак',
  lunch:     'Обед',
  snack:     'Полдник',
  dinner:    'Ужин',
};

const MEAL_ORDER = ['breakfast', 'lunch', 'snack', 'dinner'];

export default function MenuTodayWidget({ data }: { data: MenuTodayData | undefined }) {
  if (!data) return null;

  const items = data.items ?? [];

  const grouped = MEAL_ORDER
    .map(type => ({
      type,
      label: MEAL_LABELS[type] ?? type,
      items: items.filter(i => i.mealType === type),
    }))
    .filter(g => g.items.length > 0);

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Meals header card */}
      <div className="p-3 rounded-xl bg-surface-primary dark:bg-slate-800/60 border border-separator/40 shadow-subtle flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <UtensilsCrossed className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="font-bold text-text-primary tabular-nums">
              {data.childrenOnMeals} из {data.totalChildren}
            </span>
            <span className="text-text-tertiary ml-1">на питании</span>
          </div>
        </div>
        <span className="text-[11px] text-text-tertiary tabular-nums">
          {new Date(data.date).toLocaleDateString('ru-RU')}
        </span>
      </div>

      {/* Meals groups */}
      <div className="flex flex-col gap-2.5 flex-1">
        {grouped.map(group => (
          <div key={group.type} className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              {group.label}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {group.items.map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-amber-50/80 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 border border-amber-200/50 dark:border-amber-900/40"
                >
                  <UtensilsCrossed className="h-3 w-3 opacity-60 shrink-0" />
                  <span>{item.name}</span>
                </span>
              ))}
            </div>
          </div>
        ))}

        {grouped.length === 0 && (
          <div className="p-4 text-center text-text-tertiary text-[12px] my-auto">
            Меню на сегодня не заполнено
          </div>
        )}
      </div>
    </div>
  );
}
