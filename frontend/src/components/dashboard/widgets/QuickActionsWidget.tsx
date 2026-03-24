// src/components/dashboard/widgets/QuickActionsWidget.tsx
import { useNavigate } from 'react-router-dom';
import {
  Plus, FileText, UserPlus, ShoppingCart, ClipboardList,
  DollarSign, Package, UtensilsCrossed, Wrench, Calendar, CheckSquare, Bot,
  type LucideIcon,
} from 'lucide-react';
import type { QuickAction } from '../../../types/dashboard';

const ICON_MAP: Record<string, LucideIcon> = {
  Plus,
  FileText,
  UserPlus,
  ShoppingCart,
  ClipboardList,
  DollarSign,
  Package,
  UtensilsCrossed,
  Wrench,
  Calendar,
  CheckSquare,
  Bot,
};

const ACTION_COLORS: Record<string, string> = {
  'add-child': '#2563eb',
  'add-employee': '#0f766e',
  'add-finance': '#16a34a',
  'mark-attendance': '#7c3aed',
  'create-order': '#ea580c',
  'create-maintenance': '#dc2626',
  'view-menu': '#ca8a04',
  'view-schedule': '#0891b2',
  'view-inventory': '#4f46e5',
  'ai-assistant': '#a21caf',
};

export default function QuickActionsWidget({ data }: { data: QuickAction[] | undefined }) {
  const navigate = useNavigate();
  const actions = Array.isArray(data) ? data : [];

  if (actions.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.map(action => {
        const Icon = ICON_MAP[action.icon] ?? Plus;
        const accentColor = ACTION_COLORS[action.id] ?? '#6b7280';
        return (
          <button
            key={action.id}
            onClick={() => navigate(action.path)}
            className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors text-left text-xs group"
          >
            <div
              className="p-1.5 rounded-md group-hover:scale-110 transition-transform"
              style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
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
