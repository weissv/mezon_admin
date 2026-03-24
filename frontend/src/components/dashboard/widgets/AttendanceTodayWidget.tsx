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
    <div className="dashboard-attendance">
      <div className="dashboard-attendance__stats">
        <div className="dashboard-stat-block dashboard-stat-block--accent">
          <Users className="h-4 w-4 text-[var(--mezon-teal)]" />
          <span className="dashboard-stat-block__value">{data.childrenPresent ?? 0}</span>
          <span className="dashboard-stat-block__label">детей</span>
        </div>
        <div className="dashboard-stat-block dashboard-stat-block--warm">
          <Calendar className="h-4 w-4 text-[#F1AE3D]" />
          <span className="dashboard-stat-block__value">{data.childrenOnMeals}</span>
          <span className="dashboard-stat-block__label">на питании</span>
        </div>
      </div>
      {Object.keys(employeeAttendance).length > 0 && (
        <div className="dashboard-attendance__footer">
          <p className="dashboard-attendance__caption">Сотрудники</p>
          <div className="dashboard-attendance__chips">
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
