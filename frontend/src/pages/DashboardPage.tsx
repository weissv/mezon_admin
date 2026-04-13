import { useState, useCallback} from 'react';
import { Settings, Pencil, X, RefreshCw, LayoutDashboard } from 'lucide-react';
import { Button} from '../components/ui/button';
import { useDashboardPreferences} from '../hooks/useDashboardPreferences';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import DashboardOverview from '../components/dashboard/DashboardOverview';
import PersonalizationPanel from '../components/dashboard/PersonalizationPanel';
import { ErrorState } from '../components/ui/EmptyState';
import { PageHeader, PageSection, PageStack } from '../components/ui/page';
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
      <PageSection>
        <ErrorState message={error ?? 'Не удалось загрузить дашборд'} onRetry={refetch} />
      </PageSection>
    );
  }

  return (
    <PageStack className="dashboard-root">
      <PageHeader
        eyebrow="Рабочее место"
        title="Операционный дашборд"
        icon={<LayoutDashboard className="h-5 w-5" />}
        meta={
          activeView ? (
            <span className="mezon-badge macos-badge-neutral">Вид: {activeView.name}</span>
          ) : (
            <span className="mezon-badge">Живые показатели</span>
          )
        }
        description="Главные сигналы по школе, быстрые действия и рабочие виджеты в одном ритме. Панель стала плотнее, чище и лучше приспособлена для ежедневных операторских сценариев."
        actions={
          <>
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
          </>
        }
      />

      {bootstrap.overview && (
        <PageSection inset>
          <DashboardOverview overview={bootstrap.overview} />
        </PageSection>
      )}

      <DashboardLayout
        preferences={preferences}
        availableWidgets={bootstrap.availableWidgets}
        quickActions={bootstrap.quickActions}
        isEditMode={isEditMode}
        onLayoutChange={handleLayoutChange}
        onToggleCollapse={handleToggleCollapse}
      />

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
    </PageStack>
  );
}
