// src/components/dashboard/widgets/AttendanceTodayWidget.tsx
import { Calendar, Users } from 'lucide-react';

interface AttendanceData {
  childrenPresent: number;
  childrenOnMeals: number;
  employeeAttendance: Record<string, number>;
  date: string;
}

const STATUS_LABELS: Record<string, string> = {
  PRESENT: 'На месте',
  SICK_LEAVE: 'Больничный',
  VACATION: 'Отпуск',
  ABSENT: 'Отсутствует',
};

export default function AttendanceTodayWidget({ data }: { data: AttendanceData | undefined }) {
  if (!data) return null;

  const employeeAttendance = data.employeeAttendance ?? {};

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="dashboard-stat-block">
          <Users className="h-4 w-4 text-[var(--mezon-teal)]" />
          <span className="text-2xl font-bold">{data.childrenPresent ?? 0}</span>
          <span className="text-xs text-gray-500">детей</span>
        </div>
        <div className="dashboard-stat-block">
          <Calendar className="h-4 w-4 text-[#F1AE3D]" />
          <span className="text-2xl font-bold">{data.childrenOnMeals}</span>
          <span className="text-xs text-gray-500">на питании</span>
        </div>
      </div>
      {Object.keys(employeeAttendance).length > 0 && (
        <div className="border-t pt-2">
          <p className="text-xs font-medium text-gray-500 mb-1">Сотрудники</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(employeeAttendance).map(([status, count]) => (
              <span key={status} className="dashboard-chip">
                {STATUS_LABELS[status] || status}: {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
