// src/components/dashboard/widgets/AttendanceTodayWidget.tsx
import { Calendar, Users } from 'lucide-react';

interface AttendanceData {
  childrenPresent: number;
  childrenOnMeals: number;
  employeeAttendance: Record<string, number>;
  date: string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PRESENT:    { label: 'На месте',    bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  SICK_LEAVE: { label: 'Больничный', bg: 'bg-amber-50 dark:bg-amber-950/40',   text: 'text-amber-700 dark:text-amber-300',   dot: 'bg-amber-500' },
  VACATION:   { label: 'Отпуск',     bg: 'bg-blue-50 dark:bg-blue-950/40',     text: 'text-blue-700 dark:text-blue-300',     dot: 'bg-blue-500' },
  ABSENT:     { label: 'Отсутствует', bg: 'bg-rose-50 dark:bg-rose-950/40',     text: 'text-rose-700 dark:text-rose-300',     dot: 'bg-rose-500' },
};

export default function AttendanceTodayWidget({ data }: { data: AttendanceData | undefined }) {
  if (!data) return null;

  const employeeAttendance = data.employeeAttendance ?? {};
  const totalEmployees = Object.values(employeeAttendance).reduce((sum, val) => sum + val, 0);
  const presentEmployees = employeeAttendance.PRESENT ?? 0;

  return (
    <div className="flex flex-col gap-3.5 h-full">
      {/* Top statistics pair */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3.5 rounded-xl bg-surface-primary dark:bg-slate-800/60 border border-separator/40 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 text-text-tertiary">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Дети</span>
            <Users className="h-3.5 w-3.5 text-macos-blue" />
          </div>
          <div className="mt-1.5">
            <span className="text-[28px] font-black text-text-primary leading-none tabular-nums">
              {data.childrenPresent ?? 0}
            </span>
            <p className="text-[11px] text-text-secondary mt-1">присутствуют сегодня</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-primary dark:bg-slate-800/60 border border-separator/40 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 text-text-tertiary">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Питание</span>
            <Calendar className="h-3.5 w-3.5 text-macos-orange" />
          </div>
          <div className="mt-1.5">
            <span className="text-[28px] font-black text-text-primary leading-none tabular-nums">
              {data.childrenOnMeals ?? 0}
            </span>
            <p className="text-[11px] text-text-secondary mt-1">на питании в столовой</p>
          </div>
        </div>
      </div>

      {/* Staff Attendance Section */}
      <div className="p-3.5 rounded-xl bg-surface-primary/70 dark:bg-slate-800/40 border border-separator/40 shadow-subtle flex-1 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-bold text-text-primary">Педагогический состав</span>
          {totalEmployees > 0 && (
            <span className="text-[11px] font-medium text-text-tertiary tabular-nums">
              {presentEmployees} из {totalEmployees} на месте
            </span>
          )}
        </div>

        {Object.keys(employeeAttendance).length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {Object.entries(employeeAttendance).map(([status, count]) => {
              const cfg = STATUS_CONFIG[status] || {
                label: status,
                bg: 'bg-fill-quaternary',
                text: 'text-text-secondary',
                dot: 'bg-text-tertiary',
              };
              return (
                <div
                  key={status}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-black/[0.04] dark:border-white/[0.06] ${cfg.bg} ${cfg.text}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  <span>{cfg.label}:</span>
                  <span className="tabular-nums font-bold">{count}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[11px] text-text-tertiary py-1">Нет данных по сотрудникам</p>
        )}
      </div>
    </div>
  );
}
