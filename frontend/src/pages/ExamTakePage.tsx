// src/pages/ExamTakePage.tsx
// Публичная страница прохождения контрольной для студентов
import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  ChevronLeft,
  ChevronRight,
  FileText,
  Award,
} from "lucide-react";
import { publicExamsApi } from "../lib/exams-api";
import { PublicExam, PublicExamQuestion, ExamStartResponse, ExamResult } from "../types/exam";
import { toast } from "sonner";

type Stage = "intro" | "taking" | "completed";

export default function ExamTakePage() {
  const { token } = useParams<{ token: string }>();
  
  const [stage, setStage] = useState<Stage>("intro");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Данные экзамена
  const [exam, setExam] = useState<PublicExam | null>(null);
  const [submission, setSubmission] = useState<ExamStartResponse | null>(null);
  
  // Форма студента
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  
  // Ответы
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  
  // Таймер
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  // Результат
  const [result, setResult] = useState<ExamResult | null>(null);

  // Загрузка экзамена
  useEffect(() => {
    if (!token) return;
    loadExam();
  }, [token]);

  const loadExam = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await publicExamsApi.getExam(token!);
      setExam(data);
    } catch (err: any) {
      setError(err.message || "Контрольная недоступна");
    } finally {
      setLoading(false);
    }
  };

  // Таймер
  useEffect(() => {
    if (stage !== "taking" || !submission?.timeLimit) return;
    
    const startTime = new Date(submission.startedAt).getTime();
    const endTime = startTime + submission.timeLimit * 60 * 1000;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        handleSubmit();
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [stage, submission]);

  // Начать экзамен
  const handleStart = async () => {
    if (!studentName.trim()) {
      toast.error("Введите ваше имя");
      return;
    }
    
    setLoading(true);
    try {
      const response = await publicExamsApi.startExam(token!, {
        studentName: studentName.trim(),
        studentClass: studentClass.trim() || undefined,
      });
      setSubmission(response);
      setStage("taking");
      if (response.timeLimit) {
        setTimeLeft(response.timeLimit * 60);
      }
    } catch (err: any) {
      toast.error(err.message || "Не удалось начать контрольную");
    } finally {
      setLoading(false);
    }
  };

  // Отправить ответы
  const handleSubmit = async () => {
    if (!submission || !exam) return;
    
    const unanswered = exam.questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      const confirm = window.confirm(
        `У вас ${unanswered.length} вопросов без ответа. Всё равно отправить?`
      );
      if (!confirm) return;
    }
    
    setLoading(true);
    try {
      const formattedAnswers = exam.questions.map(q => ({
        questionId: q.id,
        answer: answers[q.id] ?? null,
      }));
      
      const response = await publicExamsApi.submitExam(token!, {
        submissionId: submission.submissionId,
        answers: formattedAnswers,
      });
      
      setResult(response);
      setStage("completed");
      toast.success("Контрольная сдана!");
    } catch (err: any) {
      toast.error(err.message || "Ошибка при отправке");
    } finally {
      setLoading(false);
    }
  };

  // Изменение ответа
  const setAnswer = useCallback((questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }, []);

  // Форматирование времени
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Экран загрузки
  if (loading && !exam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  // Экран ошибки
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Контрольная недоступна</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  // Начальный экран
  if (stage === "intro" && exam) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center mb-8">
              <FileText className="h-16 w-16 text-teal-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{exam.title}</h1>
              {exam.subject && <p className="text-teal-600 font-medium">{exam.subject}</p>}
            </div>

            {exam.description && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-gray-600">{exam.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-gray-500">Вопросов</p>
                <p className="text-2xl font-bold text-gray-900">{exam.totalQuestions}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-gray-500">Всего баллов</p>
                <p className="text-2xl font-bold text-gray-900">{exam.totalPoints}</p>
              </div>
              {exam.timeLimit && (
                <div className="col-span-2 bg-yellow-50 rounded-lg p-4 text-center">
                  <Clock className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
                  <p className="text-yellow-700 font-medium">
                    Ограничение времени: {exam.timeLimit} минут
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ваше имя <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Иванов Иван"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Класс / Группа
                </label>
                <input
                  type="text"
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  placeholder="10-А"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={loading || !studentName.trim()}
              className="w-full mt-6 px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Загрузка..." : "Начать контрольную"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Экран прохождения
  if (stage === "taking" && exam) {
    const question = exam.questions[currentQuestion];
    const progress = Object.keys(answers).length;

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Шапка с таймером */}
        <header className="bg-white shadow-sm py-4 px-6 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="font-semibold text-gray-900 truncate">{exam.title}</h1>
              <p className="text-sm text-gray-500">
                Вопрос {currentQuestion + 1} из {exam.totalQuestions}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                Отвечено: {progress}/{exam.totalQuestions}
              </span>
              {timeLeft !== null && (
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                    timeLeft < 300 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Прогресс бар */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex gap-1 py-2 overflow-x-auto">
              {exam.questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestion(i)}
                  className={`min-w-[32px] h-8 text-xs font-medium rounded ${
                    i === currentQuestion
                      ? "bg-teal-600 text-white"
                      : answers[q.id]
                      ? "bg-teal-100 text-teal-700"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Вопрос */}
        <main className="flex-1 py-8 px-4">
          <div className="max-w-2xl mx-auto">
            <QuestionView
              question={question}
              value={answers[question.id]}
              onChange={(value) => setAnswer(question.id, value)}
            />
          </div>
        </main>

        {/* Навигация */}
        <footer className="bg-white border-t py-4 px-6 sticky bottom-0">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5" />
              Назад
            </button>

            {currentQuestion < exam.totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                className="flex items-center gap-2 px-4 py-2 text-white bg-teal-600 rounded-lg hover:bg-teal-700"
              >
                Далее
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
                {loading ? "Отправка..." : "Завершить и отправить"}
              </button>
            )}
          </div>
        </footer>
      </div>
    );
  }

  // Экран результатов
  if (stage === "completed" && result) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center mb-6">
            <Award
              className={`h-20 w-20 mx-auto mb-4 ${
                result.result?.passed ? "text-green-500" : "text-yellow-500"
              }`}
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {result.result?.passed ? "Поздравляем!" : "Контрольная завершена"}
            </h1>
            <p className="text-gray-500 mb-6">{result.message}</p>

            {result.result && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Набрано баллов</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {result.result.totalScore}
                    <span className="text-lg text-gray-400">/{result.result.maxScore}</span>
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Процент</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {Math.round(result.result.percentage)}%
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Результат</p>
                  <p
                    className={`text-xl font-bold ${
                      result.result.passed ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {result.result.passed ? "Зачёт" : "Незачёт"}
                  </p>
                </div>
              </div>
            )}

            {result.pendingAiReview && (
              <div className="bg-yellow-50 text-yellow-700 rounded-lg p-4 text-sm">
                <AlertTriangle className="h-5 w-5 inline-block mr-2" />
                Некоторые ответы ожидают проверки AI. Результат может измениться.
              </div>
            )}
          </div>

          {/* Детальные результаты */}
          {result.result?.answers && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-900">Детальные результаты</h2>
              </div>
              <div className="divide-y">
                {result.result.answers.map((answer, i) => (
                  <div key={answer.questionId} className="p-4">
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${
                          answer.isCorrect === true
                            ? "bg-green-100 text-green-600"
                            : answer.isCorrect === false
                            ? "bg-red-100 text-red-600"
                            : "bg-yellow-100 text-yellow-600"
                        }`}
                      >
                        {answer.isCorrect === true ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : answer.isCorrect === false ? (
                          <XCircle className="h-5 w-5" />
                        ) : (
                          <Clock className="h-5 w-5" />
                        )}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-1">
                          {i + 1}. {answer.content}
                        </p>
                        <p className="text-sm text-gray-500 mb-1">
                          Ваш ответ: {String(answer.yourAnswer || "—")}
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-500">Баллы: </span>
                          <span className="font-medium">
                            {answer.score}/{answer.maxScore}
                          </span>
                        </p>
                        {answer.needsAiReview && (
                          <p className="text-sm text-yellow-600 mt-1">
                            ⏳ Ожидает проверки AI
                          </p>
                        )}
                        {answer.explanation && (
                          <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                            💡 {answer.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// Компонент отображения вопроса
function QuestionView({
  question,
  value,
  onChange,
}: {
  question: PublicExamQuestion;
  value: any;
  onChange: (value: any) => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <span className="px-2 py-1 bg-gray-100 rounded">
          {question.points} {question.points === 1 ? "балл" : "баллов"}
        </span>
      </div>

      <h2 className="text-lg font-medium text-gray-900 mb-6">{question.content}</h2>

      {question.imageUrl && (
        <img
          src={question.imageUrl}
          alt="К вопросу"
          className="max-w-full h-auto rounded-lg mb-6"
        />
      )}

      {/* Один вариант ответа */}
      {question.type === "SINGLE_CHOICE" && (
        <div className="space-y-3">
          {(question.options || []).map((option, i) => (
            <label
              key={i}
              className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                value === option
                  ? "border-teal-500 bg-teal-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="answer"
                value={option}
                checked={value === option}
                onChange={() => onChange(option)}
                className="text-teal-600 focus:ring-teal-500"
              />
              <span className="text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      )}

      {/* Несколько вариантов */}
      {question.type === "MULTIPLE_CHOICE" && (
        <div className="space-y-3">
          {(question.options || []).map((option, i) => {
            const selected = Array.isArray(value) ? value.includes(option) : false;
            return (
              <label
                key={i}
                className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  selected
                    ? "border-teal-500 bg-teal-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => {
                    const current = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      onChange([...current, option]);
                    } else {
                      onChange(current.filter((v: string) => v !== option));
                    }
                  }}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            );
          })}
        </div>
      )}

      {/* Да/Нет */}
      {question.type === "TRUE_FALSE" && (
        <div className="grid grid-cols-2 gap-4">
          {["Верно", "Неверно"].map((option) => (
            <button
              key={option}
              onClick={() => onChange(option)}
              className={`p-4 border rounded-lg font-medium transition-colors ${
                value === option
                  ? "border-teal-500 bg-teal-50 text-teal-700"
                  : "border-gray-200 text-gray-700 hover:border-gray-300"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {/* Короткий текстовый ответ */}
      {question.type === "TEXT_SHORT" && (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Введите ваш ответ..."
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      )}

      {/* Развёрнутый ответ */}
      {(question.type === "TEXT_LONG" || question.type === "PROBLEM") && (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            question.type === "PROBLEM"
              ? "Напишите решение задачи..."
              : "Введите развёрнутый ответ..."
          }
          rows={8}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      )}
    </div>
  );
}
