// src/components/dashboard/widgets/QuickActionsWidget.tsx
import { useNavigate } from 'react-router-dom';
import {
  Plus, FileText, UserPlus, ShoppingCart, ClipboardList,
  DollarSign, Package, UtensilsCrossed, Wrench, Calendar,
  type LucideIcon,
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  route: string;
  color: string;
}

interface QuickActionsData {
  actions: QuickAction[];
}

const ICON_MAP: Record<string, LucideIcon> = {
  plus: Plus,
  'file-text': FileText,
  'user-plus': UserPlus,
  'shopping-cart': ShoppingCart,
  'clipboard-list': ClipboardList,
  'dollar-sign': DollarSign,
  package: Package,
  'utensils-crossed': UtensilsCrossed,
  wrench: Wrench,
  calendar: Calendar,
};

export default function QuickActionsWidget({ data }: { data: QuickActionsData | undefined }) {
  const navigate = useNavigate();

  if (!data) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      {data.actions.map(action => {
        const Icon = ICON_MAP[action.icon] ?? Plus;
        return (
          <button
            key={action.id}
            onClick={() => navigate(action.route)}
            className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors text-left text-xs group"
          >
            <div
              className="p-1.5 rounded-md group-hover:scale-110 transition-transform"
              style={{ backgroundColor: `${action.color}15`, color: action.color }}
            >
              <Icon className="h-4 w-4" />
            </div>
            <span className="font-medium text-gray-700 leading-tight">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
