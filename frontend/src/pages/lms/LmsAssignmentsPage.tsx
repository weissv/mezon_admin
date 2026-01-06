// src/pages/lms/LmsAssignmentsPage.tsx
import { useState, useEffect } from "react";
import {
  ClipboardList,
  Clock,
  Calendar,
  FileText,
  ChevronRight,
  Search,
  CheckCircle2,
} from "lucide-react";
import { lmsApi } from "../../lib/lms-api";
import { LmsHomework } from "../../types/lms";
import { toast } from "sonner";

export default function LmsAssignmentsPage() {
  const [homework, setHomework] = useState<LmsHomework[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchHomework();
  }, []);

  const fetchHomework = async () => {
    setLoading(true);
    try {
      const data = await lmsApi.getHomework();
      setHomework(data);
    } catch (error) {
      console.error("Failed to fetch homework:", error);
      toast.error("Не удалось загрузить домашние задания");
    } finally {
      setLoading(false);
    }
  };

  const filteredHomework = homework.filter((h) => {
    const matchesSearch =
      h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.subject?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (date?: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("ru", {
      day: "numeric",
      month: "long",
    });
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
      <div>
        <h1 className="text-2xl font-bold text-[var(--mezon-dark)]">Домашние задания</h1>
        <p className="text-gray-500 mt-1">
          Текущие и выполненные задания
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по предмету или названию..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>

      {filteredHomework.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <ClipboardList className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Заданий нет</h3>
          <p className="text-gray-500">
            На данный момент у вас нет активных домашних заданий.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHomework.map((h) => {
            const isOverdue = new Date(h.dueDate) < new Date();
            
            return (
              <div
                key={h.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition group cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-100 text-blue-600">
                    <FileText className="h-6 w-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {h.subject?.name || "Предмет"}
                          </span>
                          {isOverdue && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                              Просрочено
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-teal-700 transition-colors">
                          {h.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {h.description}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Срок: {formatDate(h.dueDate)}
                      </span>
                      {h.maxPoints && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          Баллы: {h.maxPoints}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Создано: {formatDate(h.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
