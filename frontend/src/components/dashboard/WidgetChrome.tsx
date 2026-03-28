// src/components/dashboard/WidgetChrome.tsx
// Обёртка каждого виджета: заголовок, сворачивание, actions, loading/error

import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, Maximize2, Minimize2, ExternalLink, AlertCircle } from 'lucide-react';

interface WidgetChromeProps {
  title: string;
  /** Категория для цветовой маркировки */
  category?: string;
  isLoading?: boolean;
  error?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onRefresh?: () => void;
  /** Ссылка для перехода в полный модуль */
  deepLink?: string;
  children: ReactNode;
}

export default function WidgetChrome({
  title,
  category,
  isLoading,
  error,
  isCollapsed,
  onToggleCollapse,
  onRefresh,
  deepLink,
  children,
}: WidgetChromeProps) {
  const categoryColors: Record<string, string> = {
    kpi: 'var(--mezon-teal)',
    finance: '#00A26A',
    operations: '#F1AE3D',
    hr: 'var(--mezon-accent)',
    alerts: '#F75C4C',
    activity: '#8F93C0',
    actions: 'var(--mezon-teal)',
  };

  const accentColor = categoryColors[category || ''] || 'var(--mezon-accent)';

  return (
    <div className="dashboard-widget" data-category={category}>
      {/* Header */}
      <div className="dashboard-widget__header">
        <div className="dashboard-widget__header-left">
          <div className="dashboard-widget__accent" style={{ backgroundColor: accentColor }} />
          <h3 className="dashboard-widget__title">{title}</h3>
          {isLoading && (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-[var(--mezon-text-soft)]" />
          )}
        </div>
        <div className="dashboard-widget__header-actions">
          {onRefresh && !isLoading && (
            <button onClick={onRefresh} className="dashboard-widget__action-btn" title="Обновить" aria-label="Обновить">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
          {deepLink && (
            <a href={deepLink} className="dashboard-widget__action-btn" title="Открыть модуль" aria-label="Открыть модуль">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {onToggleCollapse && (
            <button onClick={onToggleCollapse} className="dashboard-widget__action-btn" title={isCollapsed ? 'Развернуть' : 'Свернуть'} aria-label={isCollapsed ? 'Развернуть' : 'Свернуть'}>
              {isCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {!isCollapsed && (
        <div className="dashboard-widget__body">
          {error ? (
            <div className="dashboard-widget__error">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p>{error}</p>
            </div>
          ) : isLoading && !children ? (
            <div className="dashboard-widget__skeleton">
              <div className="dashboard-widget__skeleton-line" />
              <div className="dashboard-widget__skeleton-line w-3/4" />
              <div className="dashboard-widget__skeleton-line w-1/2" />
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}
