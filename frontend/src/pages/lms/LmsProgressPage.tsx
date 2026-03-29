// src/pages/lms/LmsProgressPage.tsx
import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  Filter,
} from "lucide-react";
import { lmsApi } from "../../lib/lms-api";
import { LmsStudentAttendance } from "../../types/lms";
import { toast } from "sonner";

export default function LmsProgressPage() {
  const [attendance, setAttendance] = useState<LmsStudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const data = await lmsApi.getAttendance();
      setAttendance(data);
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
      toast.error("Не удалось загрузить посещаемость");
    } finally {
      setLoading(false);
    }
  };

  const filteredAttendance = attendance.filter((record) => 
    filter === "all" ? true : record.status === filter
  );

  const stats = {
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length,
    excused: attendance.filter(a => a.status === 'excused').length,
    total: attendance.length
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'present': return { label: 'Присутствовал', icon: CheckCircle2, color: 'text-[var(--color-green)] bg-[rgba(52,199,89,0.06)]' };
      case 'absent': return { label: 'Отсутствовал', icon: XCircle, color: 'text-[var(--color-red)] bg-[rgba(255,59,48,0.06)]' };
      case 'late': return { label: 'Опоздал', icon: Clock, color: 'text-[var(--color-orange)] bg-[rgba(255,204,0,0.06)]' };
      case 'excused': return { label: 'Уважительная', icon: AlertCircle, color: 'text-[var(--color-blue)] bg-[rgba(0,122,255,0.06)]' };
      default: return { label: status, icon: CheckCircle2, color: 'text-[var(--text-secondary)] bg-[var(--fill-quaternary)]' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="macos-text-title text-[var(--mezon-dark)]">Посещаемость</h1>
        <p className="text-[var(--text-secondary)] mt-1">История посещений занятий</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[rgba(52,199,89,0.06)] p-4 rounded-xl border border-green-100">
          <p className="text-[var(--color-green)] macos-text-caption">Присутствовал</p>
          <p className="macos-text-title text-[var(--color-green)]">{stats.present}</p>
        </div>
        <div className="bg-[rgba(255,59,48,0.06)] p-4 rounded-xl border border-red-100">
          <p className="text-[var(--color-red)] macos-text-caption">Пропуски</p>
          <p className="macos-text-title text-[var(--color-red)]">{stats.absent}</p>
        </div>
        <div className="bg-[rgba(255,204,0,0.06)] p-4 rounded-xl border border-yellow-100">
          <p className="text-[var(--color-orange)] macos-text-caption">Опоздания</p>
          <p className="macos-text-title text-[var(--color-orange)]">{stats.late}</p>
        </div>
        <div className="bg-[rgba(0,122,255,0.06)] p-4 rounded-xl border border-blue-100">
          <p className="text-[var(--color-blue)] macos-text-caption">По уважительной</p>
          <p className="macos-text-title text-[var(--color-blue)]">{stats.excused}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex justify-end">
        <div className="inline-flex items-center bg-white mezon-field rounded-[8px] p-1">
          <Filter className="h-4 w-4 text-[var(--text-tertiary)] ml-2 mr-1" />
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="border-none bg-transparent text-sm focus:ring-0 text-[var(--text-secondary)] py-1 pr-8"
          >
            <option value="all">Все записи</option>
            <option value="present">Присутствовал</option>
            <option value="absent">Отсутствовал</option>
            <option value="late">Опоздал</option>
            <option value="excused">Уважительная причина</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-[12px] shadow-[var(--shadow-sm)] border border-[rgba(0,0,0,0.06)] overflow-hidden">
        {filteredAttendance.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredAttendance.map((record) => {
              const config = getStatusConfig(record.status);
              const Icon = config.icon;
              
              return (
                <div key={record.id} className="p-4 flex items-center justify-between hover:bg-[var(--fill-quaternary)] transition">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        {new Date(record.date).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)] capitalize">{config.label}</p>
                    </div>
                  </div>
                  {record.note && (
                    <div className="text-sm text-[var(--text-secondary)] bg-[var(--fill-quaternary)] px-3 py-1 rounded-lg max-w-xs truncate">
                      {record.note}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-[var(--text-secondary)]">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-[var(--text-quaternary)]" />
            Записей не найдено
          </div>
        )}
      </div>
    </div>
  );
}