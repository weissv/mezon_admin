import { useState, useCallback} from 'react';
import { Settings, Pencil, X, RefreshCw} from 'lucide-react';
import { Button} from '../components/ui/button';
import { useDashboardPreferences} from '../hooks/useDashboardPreferences';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import DashboardOverview from '../components/dashboard/DashboardOverview';
import PersonalizationPanel from '../components/dashboard/PersonalizationPanel';
import type { LayoutItem, SavedView} from '../types/dashboard';

export default function DashboardPage() {
 const {
 bootstrap,
 preferences,
 isLoading,
 error,
 savePreferences,
 saveLayout,
 resetPreferences,
 refetch,
} = useDashboardPreferences();

 const [isEditMode, setIsEditMode] = useState(false);
 const [isPanelOpen, setIsPanelOpen] = useState(false);
 const activeView = preferences?.savedViews.find(view => view.id === preferences.activeView) ?? null;

 /* ---- Handlers ---- */

 const handleLayoutChange = useCallback(
 (layout: LayoutItem[]) => {
 saveLayout(layout);
},
 [saveLayout],
 );

 const handleToggleCollapse = useCallback(
 (widgetId: string) => {
 if (!preferences) return;
 const collapsed = preferences.collapsedSections.includes(widgetId)
 ? preferences.collapsedSections.filter(id => id !== widgetId)
 : [...preferences.collapsedSections, widgetId];
 savePreferences({ collapsedSections: collapsed});
},
 [preferences, savePreferences],
 );

 const handleToggleWidget = useCallback(
 (widgetId: string) => {
 if (!preferences) return;
 const enabled = preferences.enabledWidgets.includes(widgetId)
 ? preferences.enabledWidgets.filter(id => id !== widgetId)
 : [...preferences.enabledWidgets, widgetId];
 savePreferences({ enabledWidgets: enabled});
},
 [preferences, savePreferences],
 );

 const handleSaveView = useCallback(
 (name: string) => {
 if (!preferences) return;
 const view: SavedView = {
 id: crypto.randomUUID(),
 name,
 layout: preferences.layout,
 enabledWidgets: preferences.enabledWidgets,
 createdAt: new Date().toISOString(),
};
 const views = [...(preferences.savedViews ?? []), view];
 savePreferences({ savedViews: views});
},
 [preferences, savePreferences],
 );

 const handleLoadView = useCallback(
 (view: SavedView) => {
 savePreferences({
 layout: view.layout,
 enabledWidgets: view.enabledWidgets,
 activeView: view.id,
});
},
 [savePreferences],
 );

 const handleTogglePinnedAction = useCallback(
 (actionId: string) => {
 if (!preferences) return;
 const pinned = preferences.pinnedActions.includes(actionId)
 ? preferences.pinnedActions.filter(id => id !== actionId)
 : [...preferences.pinnedActions, actionId];
 savePreferences({ pinnedActions: pinned});
},
 [preferences, savePreferences],
 );

 /* ---- Render states ---- */

 if (isLoading) {
 return (
 <div className="space-y-4 animate-pulse">
 <div className="h-10 rounded-lg w-1/3 dashboard-skeleton"/>
 <div className="grid grid-cols-4 gap-4">
 {Array.from({ length: 8}).map((_, i) => (
 <div key={i} className="h-40 rounded-xl dashboard-skeleton"/>
 ))}
 </div>
 </div>
 );
}

  if (error || !bootstrap || !preferences) {
    return (
      <div className="rounded-xl border border-card bg-surface-primary shadow-subtle p-5 text-center py-12">
        <p className="font-semibold text-[14px] tracking-[-0.01em] text-macos-red mb-4">{error ?? 'Не удалось загрузить дашборд'}</p>
        <Button onClick={refetch}>Повторить</Button>
      </div>
    );
  }

  return (
    <div className="dashboard-root space-y-6">
      {/* ---- Header ---- */}
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-[0.01em] uppercase bg-fill-quaternary text-secondary">Mezon ERP</span>
          <h1 className="text-[24px] font-bold tracking-[-0.025em] text-primary leading-tight mt-2">Дашборд</h1>
          <p className="text-[15px] font-medium text-secondary leading-relaxed tracking-[-0.01em] mt-1">
            Единая рабочая поверхность для метрик, сигналов и быстрых действий по операционному контуру.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <span className="text-[11px] font-semibold tracking-[0.02em] uppercase text-tertiary">
              Виджетов: {bootstrap.overview.visibleWidgetCount}
            </span>
            <span className="text-[11px] font-semibold tracking-[0.02em] uppercase text-tertiary">
              Действий: {bootstrap.overview.quickActionCount}
            </span>
            {activeView && (
              <span className="text-[11px] font-semibold tracking-[0.02em] uppercase text-macos-blue">
                Вид: {activeView.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 sm:mt-0 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={refetch} title="Обновить">
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button
            variant={isEditMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsEditMode(prev => !prev)}
          >
            {isEditMode ? <X className="h-4 w-4 mr-1" /> : <Pencil className="h-4 w-4 mr-1" />}
            {isEditMode ? 'Готово' : 'Редактировать'}
          </Button>

          <Button variant="outline" size="sm" onClick={() => setIsPanelOpen(true)}>
            <Settings className="h-4 w-4 mr-1" />
            Настроить
          </Button>
        </div>
      </header>

 {/* ---- Overview strip ---- */}
 {bootstrap.overview && (
 <DashboardOverview overview={bootstrap.overview} />
 )}

 {/* ---- Grid ---- */}
 <DashboardLayout
 preferences={preferences}
 availableWidgets={bootstrap.availableWidgets}
 quickActions={bootstrap.quickActions}
 isEditMode={isEditMode}
 onLayoutChange={handleLayoutChange}
 onToggleCollapse={handleToggleCollapse}
 />

 {/* ---- Personalization side-panel ---- */}
 <PersonalizationPanel
 isOpen={isPanelOpen}
 onClose={() => setIsPanelOpen(false)}
 availableWidgets={bootstrap.availableWidgets}
 preferences={preferences}
 quickActions={bootstrap.quickActions}
 onToggleWidget={handleToggleWidget}
 onSaveView={handleSaveView}
 onLoadView={handleLoadView}
 onResetDefaults={resetPreferences}
 onTogglePinnedAction={handleTogglePinnedAction}
 />
 </div>
 );
}