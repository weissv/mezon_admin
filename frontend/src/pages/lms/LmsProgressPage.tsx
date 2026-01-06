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
      case 'present': return { label: 'Присутствовал', icon: CheckCircle2, color: 'text-green-600 bg-green-50' };
      case 'absent': return { label: 'Отсутствовал', icon: XCircle, color: 'text-red-600 bg-red-50' };
      case 'late': return { label: 'Опоздал', icon: Clock, color: 'text-yellow-600 bg-yellow-50' };
      case 'excused': return { label: 'Уважительная', icon: AlertCircle, color: 'text-blue-600 bg-blue-50' };
      default: return { label: status, icon: CheckCircle2, color: 'text-gray-600 bg-gray-50' };
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
        <h1 className="text-2xl font-bold text-[var(--mezon-dark)]">Посещаемость</h1>
        <p className="text-gray-500 mt-1">История посещений занятий</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
          <p className="text-green-600 text-sm font-medium">Присутствовал</p>
          <p className="text-2xl font-bold text-green-700">{stats.present}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
          <p className="text-red-600 text-sm font-medium">Пропуски</p>
          <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
          <p className="text-yellow-600 text-sm font-medium">Опоздания</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.late}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <p className="text-blue-600 text-sm font-medium">По уважительной</p>
          <p className="text-2xl font-bold text-blue-700">{stats.excused}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex justify-end">
        <div className="inline-flex items-center bg-white border border-gray-200 rounded-lg p-1">
          <Filter className="h-4 w-4 text-gray-400 ml-2 mr-1" />
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="border-none bg-transparent text-sm focus:ring-0 text-gray-600 py-1 pr-8"
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
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredAttendance.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredAttendance.map((record) => {
              const config = getStatusConfig(record.status);
              const Icon = config.icon;
              
              return (
                <div key={record.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(record.date).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">{config.label}</p>
                    </div>
                  </div>
                  {record.note && (
                    <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-lg max-w-xs truncate">
                      {record.note}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            Записей не найдено
          </div>
        )}
      </div>
    </div>
  );
}