import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, Calendar, Award, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import type { SchoolStats } from '../../types/lms';

function KPICard({ title, value, subtitle, icon: Icon, color = "blue" }: any) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  }[color as keyof typeof colorClasses] || "bg-gray-50 text-gray-600";

  return (
    <div className="mezon-card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold mt-1 text-gray-900">{value}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

export default function LmsSchoolDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SchoolStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/lms/school/school-stats');
        setStats(res as SchoolStats);
      } catch (error) {
        console.error("Failed to fetch stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="mezon-card animate-pulse h-64">Загрузка статистики...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--mezon-dark)]">Школьный обзор</h1>
          <p className="text-gray-500">Сводка по учебному процессу на сегодня</p>
        </div>
        <div className="flex gap-2">
            <Link to="/lms/school/schedule">
                <Button variant="outline">Расписание</Button>
            </Link>
            <Link to="/lms/diary">
                <Button className="bg-[var(--mezon-accent)] hover:bg-[var(--mezon-accent-dark)]">
                    Мой Дневник
                </Button>
            </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Учеников" 
          value={stats?.totalStudents || 0} 
          subtitle="Всего в школе"
          icon={Users} 
          color="blue" 
        />
        <KPICard 
          title="Посещаемость" 
          value={`${stats?.attendanceStats?.present || 0}`} 
          subtitle="Присутствует сегодня"
          icon={CheckCircle2} 
          color="green" 
        />
        <KPICard 
          title="Уроков сегодня" 
          value="42" 
          subtitle="По расписанию"
          icon={Calendar} 
          color="purple" 
        />
         <KPICard 
          title="Средний балл" 
          value="4.5" 
          subtitle="За неделю"
          icon={Award} 
          color="orange" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity / Grades */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Последние оценки</h2>
            <Link to="/lms/school/gradebook" className="text-sm text-[var(--mezon-accent)] hover:underline">Все оценки</Link>
          </div>
          
          <div className="mezon-card p-0 overflow-hidden">
            {stats?.recentGrades?.length ? (
              <div className="divide-y divide-gray-100">
                {stats.recentGrades.map((g) => {
                  const gradeValue = g.value ?? 0;
                  const studentName = g.student?.student
                    ? `${g.student.student.firstName} ${g.student.student.lastName}`
                    : '—';
                  const subjectName = g.subject?.name ?? '—';
                  const gradeColor = gradeValue >= 90 ? 'bg-green-500' : gradeValue >= 75 ? 'bg-blue-500' : 'bg-orange-500';

                  return (
                    <div key={g.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white
                          ${gradeColor}
                        `}>
                          {gradeValue}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{studentName}</p>
                          <p className="text-xs text-gray-500">{subjectName} • {new Date(g.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {g.comment && (
                          <span className="text-sm text-gray-400 italic max-w-[200px] truncate hidden sm:block">{g.comment}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">Нет свежих оценок</div>
            )}
          </div>
        </div>

        {/* Upcoming Homework / Events */}
        <div className="space-y-6">
           <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Ближайшие события</h2>
          </div>
          
          <div className="mezon-card">
            <div className="space-y-4">
                <div className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="bg-red-100 text-red-600 p-2 rounded-lg">
                        <AlertCircle className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">Родительское собрание</p>
                        <p className="text-sm text-gray-500 mt-1">10 декабря, 18:00. Актовый зал.</p>
                    </div>
                </div>
                 <div className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">Контрольная работа</p>
                        <p className="text-sm text-gray-500 mt-1">Математика, 5А класс. Завтра.</p>
                    </div>
                </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}