// src/services/dashboard/DashboardPreferencesService.ts
import { prisma } from '../../prisma';
import { Role } from '@prisma/client';
import {
  DashboardPreferencesPayload,
  LayoutItem,
  SavedView,
  WidgetFilters,
  getDefaultLayout,
  getWidgetsForRole,
  WIDGET_CATALOGUE,
} from '../../constants/dashboard';

class DashboardPreferencesServiceClass {
  /**
   * Санитизирует и выравнивает layout под 12-колоночную десктопную сетку
   */
  sanitizeLayout(layout: LayoutItem[], role: Role): LayoutItem[] {
    if (!Array.isArray(layout) || layout.length === 0) {
      return getDefaultLayout(role);
    }

    // Проверяем признак схлопывания мобильным/планшетным брейкпоинтом (все x=0 и w<=6)
    const isSquashedLeft = layout.length >= 3 && layout.every(item => item.x === 0 && item.w <= 6);
    if (isSquashedLeft) {
      return getDefaultLayout(role);
    }

    // Проверяем корректность координат
    const sanitized: LayoutItem[] = [];
    for (const item of layout) {
      const def = WIDGET_CATALOGUE.find(w => w.id === item.widgetId);
      const minH = def?.minSize.h ?? 2;
      const minW = def?.minSize.w ?? 4;
      sanitized.push({
        widgetId: item.widgetId,
        x: Math.max(0, Math.min(11, item.x || 0)),
        y: Math.max(0, item.y || 0),
        w: Math.max(minW, Math.min(12, item.w || 6)),
        h: Math.max(minH, Math.min(8, item.h || 4)),
      });
    }

    return sanitized;
  }

  /**
   * Получить preferences пользователя (или default по роли)
   */
  async get(userId: number, role: Role): Promise<DashboardPreferencesPayload> {
    const record = await prisma.dashboardPreference.findUnique({
      where: { userId },
    });

    if (!record) {
      return this.getDefaults(role);
    }

    const rawLayout = record.layout as unknown as LayoutItem[];
    const layout = this.sanitizeLayout(rawLayout, role);

    return {
      layout,
      enabledWidgets: record.enabledWidgets,
      collapsedSections: record.collapsedSections,
      pinnedActions: record.pinnedActions,
      widgetFilters: record.widgetFilters as unknown as WidgetFilters,
      savedViews: record.savedViews as unknown as SavedView[],
      activeView: record.activeView,
    };
  }

  /**
   * Сохранить или обновить preferences (полная перезапись)
   */
  async save(userId: number, role: Role, data: Partial<DashboardPreferencesPayload>): Promise<DashboardPreferencesPayload> {
    const current = await this.get(userId, role);
    const allowedWidgetIds = getWidgetsForRole(role);

    // Фильтруем enabledWidgets только по доступным
    const enabledWidgets = (data.enabledWidgets ?? current.enabledWidgets)
      .filter(id => allowedWidgetIds.includes(id));

    // Фильтруем layout: оставляем только доступные виджеты
    let layout = (data.layout ?? current.layout)
      .filter(item => allowedWidgetIds.includes(item.widgetId));

    layout = this.sanitizeLayout(layout, role);

    // Не позволяем скрыть обязательные виджеты
    const requiredWidgets = WIDGET_CATALOGUE.filter(w => !w.canHide).map(w => w.id);
    for (const rw of requiredWidgets) {
      if (allowedWidgetIds.includes(rw) && !enabledWidgets.includes(rw)) {
        enabledWidgets.push(rw);
      }
    }

    const merged: DashboardPreferencesPayload = {
      layout,
      enabledWidgets,
      collapsedSections: data.collapsedSections ?? current.collapsedSections,
      pinnedActions: data.pinnedActions ?? current.pinnedActions,
      widgetFilters: data.widgetFilters ?? current.widgetFilters,
      savedViews: data.savedViews ?? current.savedViews,
      activeView: data.activeView !== undefined ? data.activeView : current.activeView,
    };

    await prisma.dashboardPreference.upsert({
      where: { userId },
      update: {
        layout: merged.layout as any,
        enabledWidgets: merged.enabledWidgets,
        collapsedSections: merged.collapsedSections,
        pinnedActions: merged.pinnedActions,
        widgetFilters: merged.widgetFilters as any,
        savedViews: merged.savedViews as any,
        activeView: merged.activeView,
      },
      create: {
        userId,
        layout: merged.layout as any,
        enabledWidgets: merged.enabledWidgets,
        collapsedSections: merged.collapsedSections,
        pinnedActions: merged.pinnedActions,
        widgetFilters: merged.widgetFilters as any,
        savedViews: merged.savedViews as any,
        activeView: merged.activeView,
      },
    });

    return merged;
  }

  /**
   * Сбросить preferences к значениям по умолчанию
   */
  async reset(userId: number, role: Role): Promise<DashboardPreferencesPayload> {
    await prisma.dashboardPreference.deleteMany({ where: { userId } });
    return this.getDefaults(role);
  }

  /**
   * Значения по умолчанию для данной роли
   */
  getDefaults(role: Role): DashboardPreferencesPayload {
    const defaultLayout = getDefaultLayout(role);
    return {
      layout: defaultLayout,
      enabledWidgets: defaultLayout.map(item => item.widgetId),
      collapsedSections: [],
      pinnedActions: [],
      widgetFilters: {},
      savedViews: [],
      activeView: null,
    };
  }
}

export const dashboardPreferencesService = new DashboardPreferencesServiceClass();
