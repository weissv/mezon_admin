// src/components/dashboard/widgets/HrAlertsWidget.tsx
import { UserCheck, Calendar, FileText, AlertTriangle } from 'lucide-react';

interface HrAlert {
  type: 'medical' | 'contract' | 'document';
  employeeName: string;
  detail: string;
  dueDate: string;
  overdue: boolean;
}

interface HrAlertsData {
  alerts: HrAlert[];
  medicalExpiring: number;
  contractsExpiring: number;
}

const ALERT_CONFIG: Record<string, { icon: typeof UserCheck; badgeCls: string; label: string }> = {
  medical:  { icon: UserCheck, badgeCls: 'bento-badge--red',   label: 'Мед. осмотр' },
  contract: { icon: FileText,  badgeCls: 'bento-badge--amber', label: 'Договор' },
  document: { icon: Calendar,  badgeCls: 'bento-badge--blue',  label: 'Документ' },
};

export default function HrAlertsWidget({ data }: { data: HrAlertsData | undefined }) {
  if (!data) return null;

  const alerts = data.alerts ?? [];

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* 2 count cells */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/50 dark:border-rose-900/40 text-center">
          <p className="text-[22px] font-black text-rose-600 dark:text-rose-400 leading-none tabular-nums">
            {data.medicalExpiring ?? 0}
          </p>
          <p className="text-[10px] font-semibold text-rose-700/80 dark:text-rose-300 mt-1 uppercase tracking-wider">
            Мед. осмотры
          </p>
        </div>

        <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40 text-center">
          <p className="text-[22px] font-black text-amber-600 dark:text-amber-400 leading-none tabular-nums">
            {data.contractsExpiring ?? 0}
          </p>
          <p className="text-[10px] font-semibold text-amber-700/80 dark:text-amber-300 mt-1 uppercase tracking-wider">
            Договоры
          </p>
        </div>
      </div>

      {/* Alerts list */}
      <div className="flex flex-col gap-1.5 flex-1">
        {alerts.length === 0 ? (
          <div className="p-4 text-center text-text-tertiary text-[12px] my-auto">
            Кадровых предупреждений нет
          </div>
        ) : (
          alerts.map((alert, i) => {
            const cfg = ALERT_CONFIG[alert.type] ?? ALERT_CONFIG.document;
            const Icon = cfg.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-primary/70 dark:bg-slate-800/40 border border-separator/30 hover:bg-surface-primary transition-all text-[12px]"
              >
                <div className="w-7 h-7 rounded-lg bg-fill-quaternary dark:bg-slate-700/60 flex items-center justify-center shrink-0">
                  <Icon className="h-3.5 w-3.5 text-text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-primary truncate leading-tight">{alert.employeeName}</p>
                  <p className="text-[10px] text-text-tertiary truncate mt-0.5 leading-tight">{alert.detail}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[10px] tabular-nums ${alert.overdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-text-tertiary'}`}>
                    {new Date(alert.dueDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                  </span>
                  {alert.overdue && <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0" />}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
