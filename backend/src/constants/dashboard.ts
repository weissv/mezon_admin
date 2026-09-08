// src/constants/dashboard.ts
// Общие типы и реестр виджетов дашборда

import { Role } from '@prisma/client';

// ======================== WIDGET CATEGORIES ========================

export type WidgetCategory =
  | 'kpi'
  | 'finance'
  | 'operations'
  | 'hr'
  | 'alerts'
  | 'activity'
  | 'actions';

// ======================== WIDGET DEFINITION ========================

export interface WidgetDefinition {
  id: string;
  title: string;
  category: WidgetCategory;
  description: string;
  /** Роли, которым виджет доступен по умолчанию */
  allowedRoles: Role[];
  /** Размер по умолчанию в grid-единицах (cols x rows) */
  defaultSize: { w: number; h: number };
  /** Минимальный размер */
  minSize: { w: number; h: number };
  /** Максимальный размер (верхняя граница ресайза) */
  maxSize: { w: number; h: number };
  /** Можно ли скрыть этот виджет */
  canHide: boolean;
  /** Можно ли менять размер */
  canResize: boolean;
  /** Интервал автообновления в мс (0 = не обновляет) */
  refreshInterval: number;
  /** Endpoint для получения данных */
  dataEndpoint: string;
}

// ======================== LAYOUT ITEM ========================

export interface LayoutItem {
  widgetId: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

// ======================== WIDGET FILTER ========================

export interface WidgetFilters {
  [widgetId: string]: Record<string, unknown>;
}

// ======================== SAVED VIEW ========================

export interface SavedView {
  name: string;
  layout: LayoutItem[];
  enabledWidgets: string[];
  widgetFilters: WidgetFilters;
}

// ======================== USER PREFERENCES (API shape) ========================

export interface DashboardPreferencesPayload {
  layout: LayoutItem[];
  enabledWidgets: string[];
  collapsedSections: string[];
  pinnedActions: string[];
  widgetFilters: WidgetFilters;
  savedViews: SavedView[];
  activeView: string | null;
}

export interface DashboardOverviewMetric {
  id: string;
  label: string;
  value: number;
  hint: string;
  tone: 'primary' | 'success' | 'warning' | 'danger';
}

export interface DashboardOverviewAlert {
  id: string;
  label: string;
  value: number;
  tone: 'neutral' | 'warning' | 'danger';
  path: string;
}

export interface DashboardOverviewPayload {
  generatedAt: string;
  metrics: DashboardOverviewMetric[];
  alerts: DashboardOverviewAlert[];
  visibleWidgetCount: number;
  quickActionCount: number;
}

export interface DashboardBootstrapPayload {
  preferences: DashboardPreferencesPayload;
  availableWidgets: Omit<WidgetDefinition, 'allowedRoles' | 'dataEndpoint'>[];
  quickActions: QuickAction[];
  overview: DashboardOverviewPayload;
}

// ======================== QUICK ACTIONS ========================

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  path: string;
  roles: Role[];
}

// ======================== CONSTANTS ========================

const ALL_ROLES: Role[] = ['DEVELOPER', 'DIRECTOR', 'DEPUTY', 'ADMIN', 'TEACHER', 'ACCOUNTANT', 'ZAVHOZ'];
const ADMIN_ROLES: Role[] = ['DEVELOPER', 'DIRECTOR', 'DEPUTY', 'ADMIN'];
const FINANCE_ROLES: Role[] = ['DEVELOPER', 'DIRECTOR', 'DEPUTY', 'ADMIN', 'ACCOUNTANT'];
const OPERATIONS_ROLES: Role[] = ['DEVELOPER', 'DIRECTOR', 'DEPUTY', 'ADMIN', 'ZAVHOZ'];

// ======================== WIDGET CATALOGUE ========================

export const WIDGET_CATALOGUE: WidgetDefinition[] = [
  // Быстрые действия
  {
    id: 'quick-actions',
    title: 'Быстрые действия',
    category: 'actions',
    description: 'Закреплённые ярлыки и действия',
    allowedRoles: ALL_ROLES,
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    maxSize: { w: 6, h: 6 },
    canHide: false,
    canResize: true,
    refreshInterval: 0,
    dataEndpoint: '',
  },

  // KPI виджеты
  {
    id: 'kpi-overview',
    title: 'Ключевые показатели',
    category: 'kpi',
    description: 'Дети, сотрудники, кружки, доход/расход',
    allowedRoles: ALL_ROLES,
    defaultSize: { w: 6, h: 3 },
    minSize: { w: 4, h: 2 },
    maxSize: { w: 12, h: 4 },
    canHide: true,
    canResize: true,
    refreshInterval: 300_000,
    dataEndpoint: '/api/dashboard/widgets/kpi-overview',
  },

  // Финансы
  {
    id: 'finance-overview',
    title: 'Финансовый обзор',
    category: 'finance',
    description: 'Доходы, расходы, касса и банк',
    allowedRoles: FINANCE_ROLES,
    defaultSize: { w: 7, h: 4 },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 12, h: 6 },
    canHide: true,
    canResize: true,
    refreshInterval: 600_000,
    dataEndpoint: '/api/dashboard/widgets/finance-overview',
  },
  {
    id: 'cash-forecast',
    title: 'Кассовый прогноз',
    category: 'finance',
    description: 'Прогноз движения денег на 30 дней',
    allowedRoles: FINANCE_ROLES,
    defaultSize: { w: 5, h: 4 },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 8, h: 6 },
    canHide: true,
    canResize: true,
    refreshInterval: 900_000,
    dataEndpoint: '/api/dashboard/widgets/cash-forecast',
  },
  {
    id: 'unit-economics',
    title: 'Unit-экономика',
    category: 'finance',
    description: 'Структура расходов на одного ребёнка',
    allowedRoles: FINANCE_ROLES,
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 12, h: 6 },
    canHide: true,
    canResize: true,
    refreshInterval: 900_000,
    dataEndpoint: '/api/dashboard/widgets/unit-economics',
  },

  // Операции  
  {
    id: 'inventory-risk',
    title: 'Критичные запасы',
    category: 'operations',
    description: 'Товары с низким остатком на складе',
    allowedRoles: OPERATIONS_ROLES,
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 12, h: 6 },
    canHide: true,
    canResize: true,
    refreshInterval: 300_000,
    dataEndpoint: '/api/dashboard/widgets/inventory-risk',
  },
  {
    id: 'procurement-status',
    title: 'Закупки',
    category: 'operations',
    description: 'Статусы текущих заказов и поставок',
    allowedRoles: OPERATIONS_ROLES,
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 12, h: 6 },
    canHide: true,
    canResize: true,
    refreshInterval: 600_000,
    dataEndpoint: '/api/dashboard/widgets/procurement-status',
  },
  {
    id: 'menu-today',
    title: 'Меню столовой',
    category: 'operations',
    description: 'План питания на сегодня',
    allowedRoles: ALL_ROLES,
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 12, h: 6 },
    canHide: true,
    canResize: true,
    refreshInterval: 300_000,
    dataEndpoint: '/api/dashboard/widgets/menu-today',
  },

  // Заявки и безопасность
  {
    id: 'maintenance-queue',
    title: 'Заявки на ремонт',
    category: 'operations',
    description: 'Очередь текущих заявок на обслуживание',
    allowedRoles: ALL_ROLES,
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 12, h: 6 },
    canHide: true,
    canResize: true,
    refreshInterval: 300_000,
    dataEndpoint: '/api/dashboard/widgets/maintenance-queue',
  },
  {
    id: 'security-summary',
    title: 'Безопасность',
    category: 'operations',
    description: 'Статус пропускной системы и инцидентов',
    allowedRoles: ADMIN_ROLES,
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 12, h: 6 },
    canHide: true,
    canResize: true,
    refreshInterval: 600_000,
    dataEndpoint: '/api/dashboard/widgets/security-summary',
  },

  // HR
  {
    id: 'hr-alerts',
    title: 'Кадровые уведомления',
    category: 'hr',
    description: 'Медосмотры, контракты, аттестации',
    allowedRoles: ADMIN_ROLES,
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 12, h: 6 },
    canHide: true,
    canResize: true,
    refreshInterval: 600_000,
    dataEndpoint: '/api/dashboard/widgets/hr-alerts',
  },

  // Активность
  {
    id: 'attendance-today',
    title: 'Посещаемость сегодня',
    category: 'kpi',
    description: 'Дети и сотрудники сегодня',
    allowedRoles: ALL_ROLES,
    defaultSize: { w: 8, h: 4 },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 12, h: 6 },
    canHide: true,
    canResize: true,
    refreshInterval: 300_000,
    dataEndpoint: '/api/dashboard/widgets/attendance-today',
  },
  {
    id: 'calendar-today',
    title: 'Календарь и расписание',
    category: 'activity',
    description: 'События, уроки и задачи на сегодня',
    allowedRoles: ALL_ROLES,
    defaultSize: { w: 8, h: 4 },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 12, h: 8 },
    canHide: true,
    canResize: true,
    refreshInterval: 300_000,
    dataEndpoint: '/api/dashboard/widgets/calendar-today',
  },
  {
    id: 'notifications-feed',
    title: 'Уведомления',
    category: 'activity',
    description: 'Последние уведомления и события',
    allowedRoles: ALL_ROLES,
    defaultSize: { w: 5, h: 4 },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 8, h: 8 },
    canHide: true,
    canResize: true,
    refreshInterval: 120_000,
    dataEndpoint: '/api/dashboard/widgets/notifications-feed',
  },
  {
    id: 'activity-stream',
    title: 'Лента событий',
    category: 'activity',
    description: 'Последние действия в системе',
    allowedRoles: ADMIN_ROLES,
    defaultSize: { w: 7, h: 4 },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 12, h: 8 },
    canHide: true,
    canResize: true,
    refreshInterval: 120_000,
    dataEndpoint: '/api/dashboard/widgets/activity-stream',
  },
];

// ======================== QUICK ACTIONS CATALOGUE ========================

export const QUICK_ACTIONS_CATALOGUE: QuickAction[] = [
  { id: 'add-child', label: 'Добавить ребёнка', icon: 'UserPlus', path: '/children', roles: ADMIN_ROLES },
  { id: 'add-employee', label: 'Добавить сотрудника', icon: 'UserPlus', path: '/employees', roles: ADMIN_ROLES },
  { id: 'add-finance', label: 'Новая операция', icon: 'DollarSign', path: '/finance', roles: FINANCE_ROLES },
  { id: 'mark-attendance', label: 'Отметить посещаемость', icon: 'CheckSquare', path: '/attendance', roles: ALL_ROLES },
  { id: 'create-order', label: 'Создать заказ', icon: 'ShoppingCart', path: '/procurement', roles: OPERATIONS_ROLES },
  { id: 'create-maintenance', label: 'Подать заявку', icon: 'Wrench', path: '/maintenance', roles: ALL_ROLES },
  { id: 'view-menu', label: 'Сегодняшнее меню', icon: 'UtensilsCrossed', path: '/menu', roles: ALL_ROLES },
  { id: 'view-schedule', label: 'Расписание', icon: 'Calendar', path: '/schedule', roles: ALL_ROLES },
  { id: 'view-inventory', label: 'Склад', icon: 'Package', path: '/inventory', roles: OPERATIONS_ROLES },
  { id: 'ai-assistant', label: 'ИИ-Методист', icon: 'Bot', path: '/ai-assistant', roles: [...ADMIN_ROLES, 'TEACHER'] },
];

// ======================== DEFAULT LAYOUTS ========================

/** Генерирует сбалансированный 12-колоночный layout по умолчанию для роли */
export function getDefaultLayout(role: Role): LayoutItem[] {
  switch (role) {
    case 'DIRECTOR':
    case 'DEVELOPER':
      return [
        // Ряд 1: Посещаемость (8) + Быстрые действия (4) = 12
        { widgetId: 'attendance-today', x: 0, y: 0, w: 8, h: 4 },
        { widgetId: 'quick-actions', x: 8, y: 0, w: 4, h: 4 },
        // Ряд 2: Финансовый обзор (7) + Кассовый прогноз (5) = 12
        { widgetId: 'finance-overview', x: 0, y: 4, w: 7, h: 4 },
        { widgetId: 'cash-forecast', x: 7, y: 4, w: 5, h: 4 },
        // Ряд 3: Юнит-экономика (6) + Кадровые уведомления (6) = 12
        { widgetId: 'unit-economics', x: 0, y: 8, w: 6, h: 4 },
        { widgetId: 'hr-alerts', x: 6, y: 8, w: 6, h: 4 },
        // Ряд 4: Лента событий (7) + Уведомления (5) = 12
        { widgetId: 'activity-stream', x: 0, y: 12, w: 7, h: 4 },
        { widgetId: 'notifications-feed', x: 7, y: 12, w: 5, h: 4 },
      ];

    case 'DEPUTY':
      return [
        // Ряд 1: Расписание (8) + Быстрые действия (4) = 12
        { widgetId: 'calendar-today', x: 0, y: 0, w: 8, h: 4 },
        { widgetId: 'quick-actions', x: 8, y: 0, w: 4, h: 4 },
        // Ряд 2: Посещаемость (7) + Кадровые уведомления (5) = 12
        { widgetId: 'attendance-today', x: 0, y: 4, w: 7, h: 4 },
        { widgetId: 'hr-alerts', x: 7, y: 4, w: 5, h: 4 },
        // Ряд 3: Лента событий (7) + Уведомления (5) = 12
        { widgetId: 'activity-stream', x: 0, y: 8, w: 7, h: 4 },
        { widgetId: 'notifications-feed', x: 7, y: 8, w: 5, h: 4 },
      ];

    case 'TEACHER':
      return [
        // Ряд 1: Расписание (8) + Быстрые действия (4) = 12
        { widgetId: 'calendar-today', x: 0, y: 0, w: 8, h: 4 },
        { widgetId: 'quick-actions', x: 8, y: 0, w: 4, h: 4 },
        // Ряд 2: Посещаемость класса (6) + Уведомления (6) = 12
        { widgetId: 'attendance-today', x: 0, y: 4, w: 6, h: 4 },
        { widgetId: 'notifications-feed', x: 6, y: 4, w: 6, h: 4 },
      ];

    case 'ACCOUNTANT':
      return [
        // Ряд 1: Финансовый обзор (8) + Быстрые действия (4) = 12
        { widgetId: 'finance-overview', x: 0, y: 0, w: 8, h: 4 },
        { widgetId: 'quick-actions', x: 8, y: 0, w: 4, h: 4 },
        // Ряд 2: Кассовый прогноз (6) + Юнит-экономика (6) = 12
        { widgetId: 'cash-forecast', x: 0, y: 4, w: 6, h: 4 },
        { widgetId: 'unit-economics', x: 6, y: 4, w: 6, h: 4 },
        // Ряд 3: Лента событий (7) + Уведомления (5) = 12
        { widgetId: 'activity-stream', x: 0, y: 8, w: 7, h: 4 },
        { widgetId: 'notifications-feed', x: 7, y: 8, w: 5, h: 4 },
      ];

    case 'ZAVHOZ':
      return [
        // Ряд 1: Очередь ремонта (8) + Быстрые действия (4) = 12
        { widgetId: 'maintenance-queue', x: 0, y: 0, w: 8, h: 4 },
        { widgetId: 'quick-actions', x: 8, y: 0, w: 4, h: 4 },
        // Ряд 2: Риски склада (6) + Закупки (6) = 12
        { widgetId: 'inventory-risk', x: 0, y: 4, w: 6, h: 4 },
        { widgetId: 'procurement-status', x: 6, y: 4, w: 6, h: 4 },
        // Ряд 3: Меню столовой (6) + Уведомления (6) = 12
        { widgetId: 'menu-today', x: 0, y: 8, w: 6, h: 4 },
        { widgetId: 'notifications-feed', x: 6, y: 8, w: 6, h: 4 },
      ];

    case 'ADMIN':
    default:
      return [
        // Ряд 1: Посещаемость (8) + Быстрые действия (4) = 12
        { widgetId: 'attendance-today', x: 0, y: 0, w: 8, h: 4 },
        { widgetId: 'quick-actions', x: 8, y: 0, w: 4, h: 4 },
        // Ряд 2: Заявки на ремонт (6) + Безопасность (6) = 12
        { widgetId: 'maintenance-queue', x: 0, y: 4, w: 6, h: 4 },
        { widgetId: 'security-summary', x: 6, y: 4, w: 6, h: 4 },
        // Ряд 3: Кадровые уведомления (6) + Финансовый обзор (6) = 12
        { widgetId: 'hr-alerts', x: 0, y: 8, w: 6, h: 4 },
        { widgetId: 'finance-overview', x: 6, y: 8, w: 6, h: 4 },
        // Ряд 4: Лента событий (7) + Уведомления (5) = 12
        { widgetId: 'activity-stream', x: 0, y: 12, w: 7, h: 4 },
        { widgetId: 'notifications-feed', x: 7, y: 12, w: 5, h: 4 },
      ];
  }
}

/** Возвращает id виджетов, доступные для роли */
export function getWidgetsForRole(role: Role): string[] {
  return WIDGET_CATALOGUE
    .filter(w => w.allowedRoles.includes(role))
    .map(w => w.id);
}

/** Возвращает быстрые действия для роли */
export function getQuickActionsForRole(role: Role): QuickAction[] {
  return QUICK_ACTIONS_CATALOGUE.filter(a => a.roles.includes(role));
}
