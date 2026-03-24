// src/components/dashboard/widgets/QuickActionsWidget.tsx
import { useNavigate } from 'react-router-dom';
import {
  Plus, FileText, UserPlus, ShoppingCart, ClipboardList,
  DollarSign, Package, UtensilsCrossed, Wrench, Calendar, CheckSquare, Bot,
  Sparkles,
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

export default function QuickActionsWidget({ data }: { data: { actions: QuickAction[]; pinnedActions?: string[] } | undefined }) {
  const navigate = useNavigate();
  const allActions = Array.isArray(data?.actions) ? data.actions : [];
  const pinned = data?.pinnedActions ?? [];

  // Show pinned first, then rest
  const sorted = pinned.length > 0
    ? [
        ...allActions.filter(a => pinned.includes(a.id)),
        ...allActions.filter(a => !pinned.includes(a.id)),
      ]
    : allActions;

  if (sorted.length === 0) return null;

  return (
    <div className="dashboard-quick-actions">
      {sorted.map(action => {
        const Icon = ICON_MAP[action.icon] ?? Plus;
        const accentColor = ACTION_COLORS[action.id] ?? '#6b7280';
        const isPinned = pinned.includes(action.id);
        return (
          <button
            key={action.id}
            onClick={() => navigate(action.path)}
            className={`dashboard-quick-actions__item ${
              isPinned ? 'dashboard-quick-actions__item--pinned' : ''
            }`}
            title={action.label}
          >
            <div
              className="dashboard-quick-actions__icon"
              style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="dashboard-quick-actions__content">
              <span className="dashboard-quick-actions__label">{action.label}</span>
              {isPinned && (
                <span className="dashboard-quick-actions__badge">
                  <Sparkles className="h-3 w-3" />
                  Закреплено
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
