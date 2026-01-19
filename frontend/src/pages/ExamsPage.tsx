// src/pages/ExamsPage.tsx
// Страница списка контрольных для учителей/админов
import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  FileText,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  BarChart,
  Play,
  Archive,
} from "lucide-react";
import { examsApi } from "../lib/exams-api";
import { Exam, ExamStatus } from "../types/exam";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";

const statusLabels: Record<ExamStatus, string> = {
  DRAFT: "Черновик",
  PUBLISHED: "Опубликовано",
  CLOSED: "Закрыто",
  ARCHIVED: "В архиве",
};

const statusColors: Record<ExamStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PUBLISHED: "bg-green-100 text-green-700",
  CLOSED: "bg-yellow-100 text-yellow-700",
  ARCHIVED: "bg-blue-100 text-blue-700",
};

export default function ExamsPage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    fetchExams();
  }, [statusFilter]);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const data = await examsApi.getExams({
        status: statusFilter || undefined,
      });
      setExams(data);
    } catch (error) {
      console.error("Failed to fetch exams:", error);
      toast.error("Не удалось загрузить контрольные");
    } finally {
      setLoading(false);
    }
  };

  const filteredExams = exams.filter((exam) =>
    exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (exam.subject || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePublish = async (exam: Exam) => {
    if (!exam._count?.questions || exam._count.questions === 0) {
      toast.error("Добавьте хотя бы один вопрос перед публикацией");
      return;
    }
    try {
      await examsApi.publishExam(exam.id);
      toast.success("Контрольная опубликована");
      fetchExams();
    } catch (error) {
      toast.error("Ошибка при публикации");
    }
  };

  const handleClose = async (examId: string) => {
    try {
      await examsApi.closeExam(examId);
      toast.success("Контрольная закрыта");
      fetchExams();
    } catch (error) {
      toast.error("Ошибка при закрытии");
    }
  };

  const handleDelete = async (examId: string) => {
    if (!confirm("Вы уверены, что хотите удалить контрольную?")) return;
    try {
      await examsApi.deleteExam(examId);
      toast.success("Контрольная удалена");
      fetchExams();
    } catch (error) {
      toast.error("Ошибка при удалении");
    }
  };

  const copyPublicLink = (exam: Exam) => {
    const url = exam.publicUrl || `${window.location.origin}/exam/${exam.publicToken}`;
    navigator.clipboard.writeText(url);
    toast.success("Ссылка скопирована в буфер обмена");
  };

  const formatDate = (date?: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("ru", {
      day: "numeric",
      month: "short",
      year: "numeric",
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
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--mezon-dark)]">Контрольные работы</h1>
          <p className="text-gray-500 mt-1">Создавайте и управляйте контрольными</p>
        </div>
        <button
          onClick={() => navigate("/exams/new")}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Создать контрольную
        </button>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по названию или предмету..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="">Все статусы</option>
            <option value="DRAFT">Черновики</option>
            <option value="PUBLISHED">Опубликованные</option>
            <option value="CLOSED">Закрытые</option>
            <option value="ARCHIVED">В архиве</option>
          </select>
        </div>
      </div>

      {/* Список контрольных */}
      {filteredExams.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Нет контрольных</h3>
          <p className="text-gray-500 mb-6">Создайте первую контрольную работу</p>
          <button
            onClick={() => navigate("/exams/new")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <Plus className="h-5 w-5" />
            Создать контрольную
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredExams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Основная информация */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[exam.status]}`}>
                      {statusLabels[exam.status]}
                    </span>
                  </div>
                  {exam.description && (
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{exam.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    {exam.subject && (
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {exam.subject}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {exam._count?.questions || 0} вопросов
                    </span>
                    {exam.timeLimit && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {exam.timeLimit} мин
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {exam._count?.submissions || 0} прохождений
                    </span>
                    {exam.startDate && (
                      <span className="flex items-center gap-1">
                        Начало: {formatDate(exam.startDate)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Действия */}
                <div className="flex flex-wrap items-center gap-2">
                  {exam.status === "DRAFT" && (
                    <>
                      <button
                        onClick={() => navigate(`/exams/${exam.id}/edit`)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        <Edit className="h-4 w-4" />
                        Редактировать
                      </button>
                      <button
                        onClick={() => handlePublish(exam)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
                      >
                        <Play className="h-4 w-4" />
                        Опубликовать
                      </button>
                    </>
                  )}

                  {exam.status === "PUBLISHED" && (
                    <>
                      <button
                        onClick={() => copyPublicLink(exam)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100"
                        title="Скопировать ссылку для студентов"
                      >
                        <Copy className="h-4 w-4" />
                        Ссылка
                      </button>
                      <a
                        href={`/exam/${exam.publicToken}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Открыть
                      </a>
                      <button
                        onClick={() => handleClose(exam.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-yellow-700 bg-yellow-50 rounded-lg hover:bg-yellow-100"
                      >
                        <XCircle className="h-4 w-4" />
                        Закрыть
                      </button>
                    </>
                  )}

                  {(exam.status === "PUBLISHED" || exam.status === "CLOSED") && (
                    <button
                      onClick={() => navigate(`/exams/${exam.id}/results`)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100"
                    >
                      <BarChart className="h-4 w-4" />
                      Результаты
                    </button>
                  )}

                  {exam.status === "DRAFT" && (
                    <button
                      onClick={() => handleDelete(exam.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-red-700 bg-red-50 rounded-lg hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                      Удалить
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
