import React, { useMemo, useState} from"react";
import {
 BookOpen,
 Building2,
 Database,
 FileText,
 RefreshCw,
 Users,
 Wallet,
} from"lucide-react";
import { toast} from"sonner";
import {
  CatalogsTab,
  DocumentsTab,
  ExtraCatalogsTab,
 HRTab,
 OneCSummaryCards,
 PayrollTab,
  useOneCSummary,
  useOneCSync,
} from"../features/onec";
import { Button } from "../components/ui/button";
import { LoadingCard } from "../components/ui/LoadingState";
import { PageHeader, PageSection, PageStack, PageToolbar } from "../components/ui/page";

type TabId ="catalogs"|"documents"|"hr"|"payroll"|"extra-catalogs";

const tabs: { id: TabId; label: string; icon: React.ReactNode}[] = [
 { id:"catalogs", label:"Справочники", icon: <Building2 className="h-4 w-4"/>},
 { id:"extra-catalogs", label:"Доп. справочники", icon: <BookOpen className="h-4 w-4"/>},
 { id:"documents", label:"Документы", icon: <FileText className="h-4 w-4"/>},
 { id:"hr", label:"Кадры", icon: <Users className="h-4 w-4"/>},
 { id:"payroll", label:"Зарплата", icon: <Wallet className="h-4 w-4"/>},
];

export default function OneCDataPage() {
 const [activeTab, setActiveTab] = useState<TabId>("catalogs");
 const { data: summary, loading: summaryLoading, refresh: refreshSummary} = useOneCSummary();
 const { syncing, sync} = useOneCSync();

 const totalRecords = useMemo(() => {
 if (!summary) return 0;

 return Object.values(summary.catalogs).reduce((sum, value) => sum + value, 0) +
 summary.universalCatalogs.total +
 summary.documents.total +
 summary.hrDocuments.total +
 summary.payrollDocuments.total +
 summary.registers.total;
}, [summary]);

 const handleSync = async () => {
 if (syncing) return;

 try {
 const report = await sync();
 if (!report) {
 toast.error("Синхронизация не вернула результат. Попробуйте повторить позже.");
 return;
}
 await refreshSummary();

 const totalUpserted = report.results.reduce((sum, item) => sum + item.upserted, 0);
 const totalErrors = report.results.reduce((sum, item) => sum + item.errors, 0);

 if (report.aborted) {
 toast.error("Синхронизация прервана", { description: report.error});
 return;
}

 if (totalErrors > 0) {
 toast.warning(`Синхронизация завершена с ошибками. Загружено: ${totalUpserted}, ошибок: ${totalErrors}`);
 return;
}

 toast.success(`Синхронизация завершена. Загружено ${totalUpserted} записей.`);
} catch (error: unknown) {
 const errorMessage = error instanceof Error ? error.message : String(error);
 toast.error("Ошибка синхронизации с 1С", { description: errorMessage});
}
};

  return (
  <PageStack>
  <PageHeader
  eyebrow="1С · синхронизация"
  title="Данные 1С"
  description={summaryLoading ? "Загружаем сводку по синхронизации..." : `${totalRecords.toLocaleString("ru-RU")} записей синхронизировано`}
  icon={<Database className="h-5 w-5"/>}
  meta={<span className="mezon-badge macos-badge-neutral">{tabs.find((tab) => tab.id === activeTab)?.label}</span>}
  actions={
  <Button onClick={handleSync} disabled={syncing}>
  <RefreshCw className={`h-4 w-4 ${syncing ?"animate-spin":""}`} />
  {syncing ?"Синхронизация...":"Синхронизировать"}
  </Button>
  }
  />

  <PageSection inset>
  {summaryLoading && !summary ? (
  <LoadingCard message="Загружаем показатели 1С..." height={180} />
  ) : summary ? (
  <OneCSummaryCards summary={summary} />
  ) : null}
  </PageSection>

  <PageToolbar>
  <div className="inline-flex w-fit max-w-full gap-1 overflow-x-auto rounded-[16px] border border-card bg-surface-primary p-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.06)] backdrop-blur-[24px]">
  <nav className="flex gap-1"aria-label="1C Data tabs">
  {tabs.map((tab) => (
  <button
  key={tab.id}
  onClick={() => setActiveTab(tab.id)}
  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[11px] font-medium uppercase tracking-widest macos-transition ${
  activeTab === tab.id
  ? 'bg-[rgba(255,255,255,0.9)] text-primary shadow-[0_8px_20px_rgba(15,23,42,0.08)]'
  : 'text-secondary hover:bg-[rgba(255,255,255,0.58)] hover:text-primary'
}`}
  >
  {tab.icon}
  {tab.label}
  </button>
  ))}
  </nav>
  </div>
  </PageToolbar>

  <PageSection>
  {activeTab ==="catalogs"&& <CatalogsTab summary={summary} />}
  {activeTab ==="extra-catalogs"&& <ExtraCatalogsTab summary={summary} />}
  {activeTab ==="documents"&& <DocumentsTab summary={summary} />}
  {activeTab ==="hr"&& <HRTab summary={summary} />}
  {activeTab ==="payroll"&& <PayrollTab summary={summary} />}
  </PageSection>
  </PageStack>
  );
}
