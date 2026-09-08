// src/components/dashboard/DashboardLayout.tsx
// Drag-and-drop grid layout для виджетов

import { useMemo, useCallback } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import WidgetRenderer from './WidgetRenderer';
import type { WidgetDefinition, LayoutItem, DashboardPreferences, QuickAction } from '../../types/dashboard';

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
  maxW?: number;
  maxH?: number;
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
      minW: def?.minSize.w ?? 3,
      minH: def?.minSize.h ?? 2,
      maxW: def?.maxSize.w ?? 12,
      maxH: def?.maxSize.h ?? 8,
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

function sanitizeClientLayout(layout: LayoutItem[], widgets: WidgetDefinition[]): LayoutItem[] {
  if (!layout || layout.length === 0) return [];
  const isSquashedLeft = layout.length >= 3 && layout.every(item => item.x === 0 && item.w <= 6);
  if (!isSquashedLeft) return layout;

  let curX = 0;
  let curY = 0;
  return layout.map(item => {
    const def = widgets.find(w => w.id === item.widgetId);
    const w = def?.defaultSize.w ?? item.w ?? 6;
    const h = def?.defaultSize.h ?? item.h ?? 4;

    if (curX + w > 12) {
      curX = 0;
      curY += 4;
    }

    const res = { ...item, x: curX, y: curY, w, h };
    curX += w;
    if (curX >= 12) {
      curX = 0;
      curY += h;
    }
    return res;
  });
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

  // Собираем layout: для видимых виджетов без layout-записи генерируем позиции
  const visibleLayout = useMemo(() => {
    const sanitizedPreferencesLayout = sanitizeClientLayout(preferences.layout, availableWidgets);
    const existing = sanitizedPreferencesLayout.filter(item =>
      visibleWidgets.some(w => w.id === item.widgetId)
    );
    const existingIds = new Set(existing.map(item => item.widgetId));
    const maxY = existing.reduce((max, item) => Math.max(max, item.y + item.h), 0);

    let offsetY = maxY;
    let offsetX = 0;
    const generated: LayoutItem[] = [];
    for (const w of visibleWidgets) {
      if (!existingIds.has(w.id)) {
        const itemW = w.defaultSize.w || 6;
        const itemH = w.defaultSize.h || 4;

        if (offsetX + itemW > 12) {
          offsetY += 4;
          offsetX = 0;
        }

        generated.push({
          widgetId: w.id,
          x: offsetX,
          y: offsetY,
          w: itemW,
          h: itemH,
        });

        offsetX += itemW;
        if (offsetX >= 12) {
          offsetX = 0;
          offsetY += itemH;
        }
      }
    }

    return [...existing, ...generated];
  }, [preferences.layout, visibleWidgets, availableWidgets]);

  const gridLayout = useMemo(
    () => toGridLayout(visibleLayout, availableWidgets),
    [visibleLayout, availableWidgets]
  );

  const layouts: Record<string, RGLLayout[]> = useMemo(() => ({
    lg: gridLayout,
    md: gridLayout.map(item => ({
      ...item,
      w: Math.min(item.w, 6),
      x: item.x >= 6 ? Math.max(0, item.x - 6) : item.x,
    })),
    sm: gridLayout.map(item => ({ ...item, w: 6, x: 0 })),
    xs: gridLayout.map(item => ({ ...item, w: 6, x: 0 })),
  }), [gridLayout]);

  const handleLayoutChange = useCallback(
    (currentLayout: RGLLayout[], allLayouts: Partial<Record<string, RGLLayout[]>>) => {
      // КРИТИЧНО: сохраняем раскладку ТОЛЬКО в режиме редактирования!
      // И сохраняем именно 12-колоночную раскладку lg, а не сжатые мобильные координаты
      if (!isEditMode) return;
      const canonicalLayout = allLayouts.lg && allLayouts.lg.length > 0 ? allLayouts.lg : currentLayout;
      onLayoutChange(fromGridLayout(canonicalLayout));
    },
    [isEditMode, onLayoutChange]
  );

  return (
    <ResponsiveGridLayout
      className="dashboard-grid"
      layouts={layouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
      cols={{ lg: 12, md: 6, sm: 6, xs: 6 }}
      rowHeight={84}
      isDraggable={isEditMode}
      isResizable={isEditMode}
      onLayoutChange={handleLayoutChange}
      draggableHandle=".widget-drag-handle"
      compactType="vertical"
      margin={[18, 18]}
    >
      {visibleWidgets.map(widget => (
        <div key={widget.id}>
          <WidgetRenderer
            definition={widget}
            isCollapsed={preferences.collapsedSections.includes(widget.id)}
            isEditMode={isEditMode}
            onToggleCollapse={() => onToggleCollapse(widget.id)}
            filters={(preferences.widgetFilters[widget.id] as Record<string, unknown>) || undefined}
            quickActionsData={widget.id === 'quick-actions' ? quickActions : undefined}
            pinnedActions={widget.id === 'quick-actions' ? preferences.pinnedActions : undefined}
          />
        </div>
      ))}
    </ResponsiveGridLayout>
  );
}
