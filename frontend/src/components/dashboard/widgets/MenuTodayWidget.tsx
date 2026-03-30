// src/components/dashboard/widgets/MenuTodayWidget.tsx
import { UtensilsCrossed, Users} from 'lucide-react';

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
 lunch: 'Обед',
 snack: 'Полдник',
 dinner: 'Ужин',
};

const MEAL_ORDER = ['breakfast', 'lunch', 'snack', 'dinner'];

export default function MenuTodayWidget({ data}: { data: MenuTodayData | undefined}) {
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
 <div className="space-y-3">
 <div className="flex items-center justify-between text-xs text-secondary">
 <div className="flex items-center gap-1">
 <Users className="h-3 w-3"/>
 <span>{data.childrenOnMeals} / {data.totalChildren} на питании</span>
 </div>
 <span>{new Date(data.date).toLocaleDateString('ru-RU')}</span>
 </div>

 {grouped.map(group => (
 <div key={group.type}>
 <p className="text-xs font-semibold text-secondary mb-1">{group.label}</p>
 <div className="flex flex-wrap gap-1">
 {group.items.map((item, i) => (
 <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs">
 <UtensilsCrossed className="h-2.5 w-2.5"/>
 {item.name}
 </span>
 ))}
 </div>
 </div>
 ))}

 {grouped.length === 0 && (
 <p className="text-sm text-tertiary text-center py-2">Меню не задано</p>
 )}
 </div>
 );
}
