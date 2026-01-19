// src/pages/ExamResultsPage.tsx
// Страница результатов контрольной для учителей
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  BarChart,
  Edit,
  Eye,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { examsApi } from "../lib/exams-api";
import { Exam, ExamSubmission, ExamAnswer } from "../types/exam";
import { toast } from "sonner";

export default function ExamResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<Exam | null>(null);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    completed: number;
    passed: number;
    avgScore: number;
    avgPercentage: number;
  } | null>(null);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<ExamSubmission | null>(null);

  useEffect(() => {
    if (id) fetchResults();
  }, [id]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const data = await examsApi.getResults(id!);
      setExam(data.exam);
      setSubmissions(data.submissions);
      setStats(data.stats);
    } catch (error) {
      toast.error("Не удалось загрузить результаты");
      navigate("/exams");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissionDetails = async (submissionId: string) => {
    try {
      const data = await examsApi.getSubmission(id!, submissionId);
      setSelectedSubmission(data);
    } catch (error) {
      toast.error("Не удалось загрузить детали");
    }
  };

  const handleGrade = async (answerId: string, score: number, feedback?: string) => {
    try {
      await examsApi.gradeAnswer(answerId, { score, feedback });
      toast.success("Оценка сохранена");
      if (selectedSubmission) {
        fetchSubmissionDetails(selectedSubmission.id);
      }
      fetchResults();
    } catch (error) {
      toast.error("Ошибка при сохранении оценки");
    }
  };

  const exportResults = async () => {
    if (!exam) return;
    
    try {
      // Используем серверный endpoint для полного экспорта
      const response = await fetch(`/api/exams/${id}/export`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exam.title}_результаты_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Результаты экспортированы");
    } catch (error) {
      // Fallback: локальный экспорт
      if (!submissions.length) {
        toast.error("Нет данных для экспорта");
        return;
      }
      
      const headers = ["Имя", "Класс", "Дата сдачи", "Баллы", "Процент", "Результат"];
      const rows = submissions.map((s) => [
        s.studentName,
        s.studentClass || "",
        s.submittedAt ? new Date(s.submittedAt).toLocaleString("ru") : "-",
        `${s.totalScore || 0}/${s.maxScore}`,
        `${Math.round(s.percentage || 0)}%`,
        s.passed ? "Зачёт" : "Незачёт",
      ]);

      const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exam.title}_результаты.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const formatDate = (date?: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("ru", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!exam) return null;

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/exams")}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--mezon-dark)]">
              Результаты: {exam.title}
            </h1>
            <p className="text-gray-500 text-sm mt-1">{exam.subject}</p>
          </div>
        </div>
        <button
          onClick={exportResults}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <Download className="h-5 w-5" />
          Экспорт CSV
        </button>
      </div>

      {/* Статистика */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Всего</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Завершено</p>
                <p className="text-xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Зачёт</p>
                <p className="text-xl font-bold text-gray-900">{stats.passed}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Средний балл</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.avgScore.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <BarChart className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Средний %</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.avgPercentage.toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Список прохождений */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900">Прохождения ({submissions.length})</h2>
        </div>

        {submissions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Пока никто не проходил контрольную</p>
          </div>
        ) : (
          <div className="divide-y">
            {submissions.map((submission) => (
              <div key={submission.id}>
                {/* Строка прохождения */}
                <div
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    if (expandedSubmission === submission.id) {
                      setExpandedSubmission(null);
                      setSelectedSubmission(null);
                    } else {
                      setExpandedSubmission(submission.id);
                      fetchSubmissionDetails(submission.id);
                    }
                  }}
                >
                  <div className="flex-shrink-0">
                    {submission.passed === true ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : submission.passed === false ? (
                      <XCircle className="h-6 w-6 text-red-500" />
                    ) : (
                      <Clock className="h-6 w-6 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{submission.studentName}</p>
                    <p className="text-sm text-gray-500">
                      {submission.studentClass && `${submission.studentClass} · `}
                      {formatDate(submission.submittedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {submission.totalScore ?? 0}/{submission.maxScore}
                    </p>
                    <p className="text-sm text-gray-500">
                      {Math.round(submission.percentage ?? 0)}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!submission.aiReviewCompleted && (
                      <span
                        className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded"
                        title="Ожидает AI проверки"
                      >
                        <AlertTriangle className="h-3 w-3 inline-block mr-1" />
                        AI
                      </span>
                    )}
                    {expandedSubmission === submission.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Детали прохождения */}
                {expandedSubmission === submission.id && selectedSubmission && (
                  <div className="border-t bg-gray-50 p-4">
                    <h3 className="font-medium text-gray-900 mb-4">Ответы студента</h3>
                    <div className="space-y-4">
                      {selectedSubmission.answers?.map((answer, i) => (
                        <AnswerCard
                          key={answer.id}
                          answer={answer}
                          index={i}
                          onGrade={handleGrade}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Компонент карточки ответа
function AnswerCard({
  answer,
  index,
  onGrade,
}: {
  answer: ExamAnswer;
  index: number;
  onGrade: (answerId: string, score: number, feedback?: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [score, setScore] = useState(answer.score ?? answer.aiScore ?? 0);
  const [feedback, setFeedback] = useState(answer.manualFeedback || answer.aiFeedback || "");

  const needsReview = !answer.aiChecked && !answer.manualChecked && 
    ["TEXT_LONG", "PROBLEM"].includes(answer.question?.type || "");

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <span
          className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium ${
            answer.isCorrect === true
              ? "bg-green-100 text-green-600"
              : answer.isCorrect === false
              ? "bg-red-100 text-red-600"
              : "bg-yellow-100 text-yellow-600"
          }`}
        >
          {index + 1}
        </span>
        <div className="flex-1">
          <p className="text-gray-900 font-medium mb-2">{answer.question?.content}</p>
          <div className="bg-gray-50 rounded p-2 mb-2">
            <p className="text-sm text-gray-500">Ответ студента:</p>
            <p className="text-gray-700">{answer.answer || "—"}</p>
          </div>

          {/* AI/Ручная оценка */}
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-gray-500">Баллы: </span>
              <span className="font-semibold">
                {answer.score ?? 0}/{answer.maxScore}
              </span>
            </div>
            {answer.aiChecked && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                AI: {answer.aiScore}
              </span>
            )}
            {answer.manualChecked && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                Ручная оценка
              </span>
            )}
          </div>

          {/* Отзыв */}
          {(answer.aiFeedback || answer.manualFeedback) && !editing && (
            <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
              💬 {answer.manualFeedback || answer.aiFeedback}
            </div>
          )}

          {/* Кнопка редактирования */}
          {needsReview && !editing && (
            <div className="mt-3">
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"
              >
                <Edit className="h-4 w-4" />
                Оценить вручную
              </button>
            </div>
          )}

          {/* Форма ручной оценки */}
          {editing && (
            <div className="mt-3 space-y-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <label className="text-sm text-gray-700">Баллы:</label>
                <input
                  type="number"
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  min={0}
                  max={answer.maxScore}
                  className="w-20 px-2 py-1 border rounded focus:ring-2 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-500">/ {answer.maxScore}</span>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Комментарий:</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-teal-500"
                  placeholder="Комментарий к оценке..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onGrade(answer.id, score, feedback);
                    setEditing(false);
                  }}
                  className="px-3 py-1.5 bg-teal-600 text-white rounded text-sm hover:bg-teal-700"
                >
                  Сохранить
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
