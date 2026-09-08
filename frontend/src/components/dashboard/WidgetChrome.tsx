// src/components/dashboard/WidgetChrome.tsx
import { ReactNode } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface WidgetChromeProps {
  title: string;
  category?: string;
  isLoading?: boolean;
  error?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onRefresh?: () => void;
  deepLink?: string;
  isEditMode?: boolean;
  children: ReactNode;
}

const CATEGORY_DOT: Record<string, string> = {
  kpi: 'bg-indigo-500 shadow-[0_0_0_2px_rgba(99,102,241,0.2)]',
  finance: 'bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]',
  operations: 'bg-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.2)]',
  hr: 'bg-rose-500 shadow-[0_0_0_2px_rgba(225,29,72,0.2)]',
  alerts: 'bg-red-500 shadow-[0_0_0_2px_rgba(220,38,38,0.2)]',
  activity: 'bg-purple-500 shadow-[0_0_0_2px_rgba(124,58,237,0.2)]',
  actions: 'bg-blue-500 shadow-[0_0_0_2px_rgba(37,99,235,0.2)]',
};

export default function WidgetChrome({
  title,
  category,
  isLoading,
  error,
  isCollapsed,
  onToggleCollapse,
  onRefresh,
  deepLink,
  isEditMode,
  children,
}: WidgetChromeProps) {
  const dotClass = (category && CATEGORY_DOT[category]) || 'bg-macos-blue shadow-[0_0_0_2px_rgba(0,122,255,0.2)]';

  return (
    <div
      className={clsx(
        "group relative flex flex-col h-full rounded-2xl transition-all duration-200 overflow-hidden",
        "bg-surface-primary/90 dark:bg-slate-900/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08]",
        "shadow-[0_2px_12px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)]",
        "hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]",
        isEditMode && "ring-2 ring-macos-blue/60 ring-offset-2 ring-offset-bg-canvas border-dashed"
      )}
      data-cat={category}
    >
      {/* Header — draggable handle */}
      <div
        className={clsx(
          "widget-drag-handle flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-separator/40 bg-fill-quaternary/20 select-none shrink-0",
          isEditMode && "cursor-grab active:cursor-grabbing hover:bg-fill-quaternary/40"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={clsx("w-2 h-2 rounded-full shrink-0", dotClass)} />
          <h3 className="text-[13px] sm:text-[14px] font-bold text-text-primary tracking-[-0.01em] truncate">{title}</h3>
          {isLoading && (
            <RefreshCw className="h-3 w-3 text-macos-blue animate-spin shrink-0" />
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onRefresh && !isLoading && (
            <button
              onClick={(e) => { e.stopPropagation(); onRefresh(); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-fill-tertiary transition-all cursor-pointer"
              title="Обновить"
              aria-label="Обновить"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
          {deepLink && (
            <a
              href={deepLink}
              onClick={(e) => e.stopPropagation()}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-tertiary hover:text-macos-blue hover:bg-fill-tertiary transition-all cursor-pointer"
              title="Открыть модуль"
              aria-label="Открыть модуль"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {onToggleCollapse && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-fill-tertiary transition-all cursor-pointer"
              title={isCollapsed ? 'Развернуть' : 'Свернуть'}
              aria-label={isCollapsed ? 'Развернуть' : 'Свернуть'}
            >
              {isCollapsed
                ? <ChevronDown className="h-3.5 w-3.5" />
                : <ChevronUp className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Body with adaptive smooth scroll */}
      <div className={clsx("flex-1 p-4 sm:p-5 overflow-y-auto mezon-scrollbar flex flex-col min-h-0 transition-all duration-200", isCollapsed && "hidden")}>
        {error ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-tint-red/80 border border-macos-red/20 text-macos-red">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-[13px] font-medium leading-relaxed">{error}</p>
          </div>
        ) : isLoading && !children ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-fill-tertiary rounded-md w-[80%]" />
            <div className="h-4 bg-fill-tertiary rounded-md w-[60%]" />
            <div className="h-4 bg-fill-tertiary rounded-md w-[45%]" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

