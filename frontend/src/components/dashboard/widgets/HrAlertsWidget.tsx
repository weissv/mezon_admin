// src/components/dashboard/widgets/HrAlertsWidget.tsx
import { UserCheck, Calendar, AlertTriangle, FileText} from 'lucide-react';

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

const ALERT_CONFIG: Record<string, { icon: typeof UserCheck; color: string; label: string}> = {
 medical: { icon: UserCheck, color: 'text-macos-red', label: 'Мед. осмотр'},
 contract: { icon: FileText, color: 'text-amber-500', label: 'Договор'},
 document: { icon: Calendar, color: 'text-blue-500', label: 'Документ'},
};

export default function HrAlertsWidget({ data}: { data: HrAlertsData | undefined}) {
 if (!data) return null;

 const alerts = data.alerts ?? [];

 return (
 <div className="space-y-3">
 <div className="grid grid-cols-2 gap-2">
 <div className="p-2 bg-red-50 rounded-lg text-center">
 <p className="text-lg font-bold text-macos-red">{data.medicalExpiring ?? 0}</p>
 <p className="text-xs text-macos-red">Мед. осмотры</p>
 </div>
 <div className="p-2 bg-amber-50 rounded-lg text-center">
 <p className="text-lg font-bold text-amber-600">{data.contractsExpiring}</p>
 <p className="text-xs text-amber-500">Договоры</p>
 </div>
 </div>

 <div className="space-y-1.5">
 {alerts.slice(0, 5).map((alert, i) => {
 const cfg = ALERT_CONFIG[alert.type] ?? ALERT_CONFIG.document;
 const Icon = cfg.icon;
 return (
 <div key={i} className="flex items-center gap-2 text-xs">
 <Icon className={`h-3 w-3 flex-shrink-0 ${cfg.color}`} />
 <div className="truncate flex-1">
 <span className="font-medium">{alert.employeeName}</span>
 <span className="text-tertiary"> — {alert.detail}</span>
 </div>
 <span className={`whitespace-nowrap ${alert.overdue ? 'text-macos-red font-medium' : 'text-tertiary'}`}>
 {new Date(alert.dueDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short'})}
 </span>
 {alert.overdue && <AlertTriangle className="h-3 w-3 text-macos-red flex-shrink-0"/>}
 </div>
 );
})}
 </div>
 </div>
 );
}
