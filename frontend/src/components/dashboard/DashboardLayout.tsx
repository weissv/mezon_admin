// src/components/dashboard/DashboardLayout.tsx
// Drag-and-drop grid layout для виджетов

import { useMemo, useCallback } from 'react';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import RGL from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import WidgetRenderer from './WidgetRenderer';
import type { WidgetDefinition, LayoutItem, DashboardPreferences, QuickAction } from '../../types/dashboard';

// react-grid-layout exports are CJS; re-export via default
const { Responsive, WidthProvider } = RGL as any;
const ResponsiveGridLayout = WidthProvider(Responsive);

/** Single item in the react-grid-layout */
interface RGLLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  static?: boolean;
  isResizable?: boolean;
}

interface DashboardLayoutProps {
  preferences: DashboardPreferences;
  availableWidgets: WidgetDefinition[];
  quickActions: QuickAction[];
  isEditMode: boolean;
  onLayoutChange: (layout: LayoutItem[]) => void;
  onToggleCollapse: (widgetId: string) => void;
}

/** Конвертирует наш LayoutItem[] в react-grid-layout Layout[] */
function toGridLayout(items: LayoutItem[], widgets: WidgetDefinition[]): RGLLayout[] {
  return items.map(item => {
    const def = widgets.find(w => w.id === item.widgetId);
    return {
      i: item.widgetId,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: def?.minSize.w ?? 2,
      minH: def?.minSize.h ?? 1,
      static: !def?.canResize && !def?.canHide,
      isResizable: def?.canResize ?? true,
    };
  });
}

/** Конвертирует react-grid-layout Layout[] обратно в LayoutItem[] */
function fromGridLayout(gridLayout: RGLLayout[]): LayoutItem[] {
  return gridLayout.map(item => ({
    widgetId: item.i,
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
  }));
}

export default function DashboardLayout({
  preferences,
  availableWidgets,
  quickActions,
  isEditMode,
  onLayoutChange,
  onToggleCollapse,
}: DashboardLayoutProps) {
  // Фильтруем виджеты: только enabled и доступные
  const visibleWidgets = useMemo(() => {
    return availableWidgets.filter(w => preferences.enabledWidgets.includes(w.id));
  }, [availableWidgets, preferences.enabledWidgets]);

  // Собираем layout только для видимых виджетов
  const visibleLayout = useMemo(() => {
    return preferences.layout.filter(item =>
      visibleWidgets.some(w => w.id === item.widgetId)
    );
  }, [preferences.layout, visibleWidgets]);

  const gridLayout = useMemo(
    () => toGridLayout(visibleLayout, availableWidgets),
    [visibleLayout, availableWidgets]
  );

  const layouts: Record<string, RGLLayout[]> = useMemo(() => ({
    lg: gridLayout,
    md: gridLayout.map(item => ({ ...item, w: Math.min(item.w, 6) })),
    sm: gridLayout.map(item => ({ ...item, w: 6, x: 0 })),
    xs: gridLayout.map(item => ({ ...item, w: 6, x: 0 })),
  }), [gridLayout]);

  const handleLayoutChange = useCallback(
    (currentLayout: RGLLayout[]) => {
      onLayoutChange(fromGridLayout(currentLayout));
    },
    [onLayoutChange]
  );

  return (
    <ResponsiveGridLayout
      className="dashboard-grid"
      layouts={layouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
      cols={{ lg: 12, md: 6, sm: 6, xs: 6 }}
      rowHeight={80}
      isDraggable={isEditMode}
      isResizable={isEditMode}
      onLayoutChange={handleLayoutChange}
      draggableHandle=".dashboard-widget__header"
      compactType="vertical"
      margin={[16, 16]}
    >
      {visibleWidgets.map(widget => (
        <div key={widget.id}>
          <WidgetRenderer
            definition={widget}
            isCollapsed={preferences.collapsedSections.includes(widget.id)}
            onToggleCollapse={() => onToggleCollapse(widget.id)}
            filters={(preferences.widgetFilters[widget.id] as Record<string, unknown>) || undefined}
            quickActionsData={widget.id === 'quick-actions' ? quickActions : undefined}
          />
        </div>
      ))}
    </ResponsiveGridLayout>
  );
}
