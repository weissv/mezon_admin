// src/pages/ExamEditorPage.tsx
// Редактор контрольной работы
import { useState, useEffect} from"react";
import { useParams, useNavigate} from"react-router-dom";
import {
 ArrowLeft,
 Save,
 Plus,
 Trash2,
 GripVertical,
 ChevronDown,
 ChevronUp,
 CheckCircle,
 Type,
 ListChecks,
 ToggleLeft,
 Calculator,
 AlignLeft,
 Copy,
 Settings,
} from"lucide-react";
import { examsApi} from"../lib/exams-api";
import { Exam, ExamQuestion, ExamQuestionType, ExamFormData, ExamQuestionFormData} from"../types/exam";
import { toast} from"sonner";

const questionTypeLabels: Record<ExamQuestionType, { label: string; icon: any; description: string}> = {
 SINGLE_CHOICE: {
 label:"Один вариант",
 icon: CheckCircle,
 description:"Выбор одного правильного ответа",
},
 MULTIPLE_CHOICE: {
 label:"Несколько вариантов",
 icon: ListChecks,
 description:"Выбор нескольких правильных ответов",
},
 TRUE_FALSE: {
 label:"Да / Нет",
 icon: ToggleLeft,
 description:"Верно или неверно утверждение",
},
 TEXT_SHORT: {
 label:"Короткий ответ",
 icon: Type,
 description:"Краткий текстовый ответ",
},
 TEXT_LONG: {
 label:"Развёрнутый ответ",
 icon: AlignLeft,
 description:"Подробный текстовый ответ (AI проверка)",
},
 PROBLEM: {
 label:"Задача",
 icon: Calculator,
 description:"Математическая задача с решением (AI проверка)",
},
};

interface QuestionDraft extends Partial<ExamQuestionFormData> {
 id?: string;
 tempId?: string;
 isNew?: boolean;
 expanded?: boolean;
}

export default function ExamEditorPage() {
 const { id} = useParams<{ id: string}>();
 const navigate = useNavigate();
 const isNew = !id || id ==="new";

 const [loading, setLoading] = useState(!isNew);
 const [saving, setSaving] = useState(false);
 const [showSettings, setShowSettings] = useState(isNew);

 const [exam, setExam] = useState<ExamFormData>({
 title:"",
 description:"",
 subject:"",
 timeLimit: null,
 shuffleQuestions: false,
 shuffleOptions: false,
 showResults: true,
 passingScore: 60,
 startDate: null,
 endDate: null,
});

 const [questions, setQuestions] = useState<QuestionDraft[]>([]);
 const [examId, setExamId] = useState<string | null>(isNew ? null : id || null);

 useEffect(() => {
 if (!isNew && id) {
 fetchExam(id);
}
}, [id, isNew]);

 const fetchExam = async (examId: string) => {
 setLoading(true);
 try {
 const data = await examsApi.getExam(examId);
 setExam({
 title: data.title,
 description: data.description ||"",
 subject: data.subject ||"",
 timeLimit: data.timeLimit,
 shuffleQuestions: data.shuffleQuestions,
 shuffleOptions: data.shuffleOptions,
 showResults: data.showResults,
 passingScore: data.passingScore,
 startDate: data.startDate,
 endDate: data.endDate,
});
 setQuestions(
 (data.questions || []).map((q) => ({
 ...q,
 expanded: false,
}))
 );
} catch (error) {
 toast.error("Не удалось загрузить контрольную");
 navigate("/exams");
} finally {
 setLoading(false);
}
};

 const saveExam = async () => {
 if (!exam.title.trim()) {
 toast.error("Введите название контрольной");
 return;
}

 setSaving(true);
 try {
 let savedExamId = examId;

 if (!savedExamId) {
 // Создаём новую контрольную
 const created = await examsApi.createExam(exam);
 savedExamId = created.id;
 setExamId(savedExamId);
 toast.success("Контрольная создана");
} else {
 // Обновляем существующую
 await examsApi.updateExam(savedExamId, exam);
 toast.success("Контрольная сохранена");
}

 // Сохраняем новые вопросы
 const newQuestions = questions.filter((q) => q.isNew && q.content?.trim());
 if (newQuestions.length > 0) {
 const formatted = newQuestions.map((q) => ({
 type: q.type ||"SINGLE_CHOICE",
 content: q.content ||"",
 options: q.options,
 correctAnswer: q.correctAnswer,
 expectedAnswer: q.expectedAnswer,
 keyPoints: q.keyPoints,
 explanation: q.explanation,
 points: q.points || 1,
 partialCredit: q.partialCredit || false,
}));
 await examsApi.addQuestions(savedExamId, formatted);
}

 // Обновляем существующие вопросы
 for (const q of questions.filter((q) => !q.isNew && q.id)) {
 await examsApi.updateQuestion(savedExamId, q.id!, {
 type: q.type,
 content: q.content,
 options: q.options,
 correctAnswer: q.correctAnswer,
 expectedAnswer: q.expectedAnswer,
 keyPoints: q.keyPoints,
 explanation: q.explanation,
 points: q.points,
 partialCredit: q.partialCredit,
});
}

 // Перезагружаем данные
 if (savedExamId) {
 fetchExam(savedExamId);
 navigate(`/exams/${savedExamId}/edit`, { replace: true});
}
} catch (error: any) {
 toast.error(error.message ||"Ошибка при сохранении");
} finally {
 setSaving(false);
}
};

 const addQuestion = (type: ExamQuestionType) => {
 const newQuestion: QuestionDraft = {
 tempId: `new_${Date.now()}`,
 isNew: true,
 expanded: true,
 type,
 content:"",
 points: 1,
 partialCredit: false,
 options: type ==="TRUE_FALSE"? ["Верно","Неверно"] : type.includes("CHOICE") ? ["","","",""] : undefined,
 correctAnswer: type ==="TRUE_FALSE"?"Верно": undefined,
};
 setQuestions([...questions, newQuestion]);
};

 const updateQuestion = (index: number, updates: Partial<QuestionDraft>) => {
 const updated = [...questions];
 updated[index] = { ...updated[index], ...updates};
 setQuestions(updated);
};

 const removeQuestion = async (index: number) => {
 const q = questions[index];
 if (q.id && examId) {
 try {
 await examsApi.deleteQuestion(examId, q.id);
 toast.success("Вопрос удалён");
} catch (error) {
 toast.error("Ошибка при удалении вопроса");
 return;
}
}
 setQuestions(questions.filter((_, i) => i !== index));
};

 const duplicateQuestion = (index: number) => {
 const q = questions[index];
 const copy: QuestionDraft = {
 ...q,
 id: undefined,
 tempId: `new_${Date.now()}`,
 isNew: true,
 expanded: true,
};
 const updated = [...questions];
 updated.splice(index + 1, 0, copy);
 setQuestions(updated);
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
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <button
 onClick={() => navigate("/exams")}
 className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--fill-tertiary)] rounded-lg"
 >
 <ArrowLeft className="h-5 w-5"/>
 </button>
 <div>
 <h1 className="macos-text-title text-[var(--mezon-dark)]">
 {isNew ?"Новая контрольная":"Редактирование контрольной"}
 </h1>
 <p className="text-[var(--text-secondary)] text-sm mt-1">
 {questions.filter((q) => q.content?.trim()).length} вопросов
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button
 onClick={() => setShowSettings(!showSettings)}
 className="inline-flex items-center gap-2 px-4 py-2 text-[var(--text-primary)] bg-[var(--fill-tertiary)] rounded-lg hover:bg-[var(--fill-secondary)]"
 >
 <Settings className="h-5 w-5"/>
 Настройки
 </button>
 <button
 onClick={saveExam}
 disabled={saving}
 className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-blue)] text-white rounded-lg hover:bg-[var(--color-blue)] disabled:opacity-50"
 >
 <Save className="h-5 w-5"/>
 {saving ?"Сохранение...":"Сохранить"}
 </button>
 </div>
 </div>

 {/* Настройки контрольной */}
 {showSettings && (
 <div className="bg-white rounded-[12px] shadow-[var(--shadow-sm)] border border-[rgba(0,0,0,0.06)] p-6 space-y-4">
 <h2 className="macos-text-callout text-[var(--text-primary)]">Основные настройки</h2>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block macos-text-caption text-[var(--text-primary)] mb-1">
 Название <span className="text-[var(--color-red)]">*</span>
 </label>
 <input
 type="text"
 value={exam.title}
 onChange={(e) => setExam({ ...exam, title: e.target.value})}
 placeholder="Рубежный контроль по экономике №1"
 className="w-full px-4 py-2 mezon-field rounded-[8px] focus-visible:ring-4 focus-visible:ring-[rgba(0,122,255,0.3)]"
 />
 </div>
 <div>
 <label className="block macos-text-caption text-[var(--text-primary)] mb-1">Предмет</label>
 <input
 type="text"
 value={exam.subject ||""}
 onChange={(e) => setExam({ ...exam, subject: e.target.value})}
 placeholder="Экономика"
 className="w-full px-4 py-2 mezon-field rounded-[8px] focus-visible:ring-4 focus-visible:ring-[rgba(0,122,255,0.3)]"
 />
 </div>
 <div className="md:col-span-2">
 <label className="block macos-text-caption text-[var(--text-primary)] mb-1">Описание</label>
 <textarea
 value={exam.description ||""}
 onChange={(e) => setExam({ ...exam, description: e.target.value})}
 placeholder="Инструкции для студентов..."
 rows={2}
 className="w-full px-4 py-2 mezon-field rounded-[8px] focus-visible:ring-4 focus-visible:ring-[rgba(0,122,255,0.3)]"
 />
 </div>
 <div>
 <label className="block macos-text-caption text-[var(--text-primary)] mb-1">
 Ограничение времени (мин)
 </label>
 <input
 type="number"
 value={exam.timeLimit ||""}
 onChange={(e) => setExam({ ...exam, timeLimit: e.target.value ? Number(e.target.value) : null})}
 placeholder="60"
 min="1"
 className="w-full px-4 py-2 mezon-field rounded-[8px] focus-visible:ring-4 focus-visible:ring-[rgba(0,122,255,0.3)]"
 />
 </div>
 <div>
 <label className="block macos-text-caption text-[var(--text-primary)] mb-1">
 Проходной балл (%)
 </label>
 <input
 type="number"
 value={exam.passingScore}
 onChange={(e) => setExam({ ...exam, passingScore: Number(e.target.value)})}
 min="0"
 max="100"
 className="w-full px-4 py-2 mezon-field rounded-[8px] focus-visible:ring-4 focus-visible:ring-[rgba(0,122,255,0.3)]"
 />
 </div>
 <div>
 <label className="block macos-text-caption text-[var(--text-primary)] mb-1">
 Дата начала
 </label>
 <input
 type="datetime-local"
 value={exam.startDate?.slice(0, 16) ||""}
 onChange={(e) => setExam({ ...exam, startDate: e.target.value || null})}
 className="w-full px-4 py-2 mezon-field rounded-[8px] focus-visible:ring-4 focus-visible:ring-[rgba(0,122,255,0.3)]"
 />
 </div>
 <div>
 <label className="block macos-text-caption text-[var(--text-primary)] mb-1">
 Дата окончания
 </label>
 <input
 type="datetime-local"
 value={exam.endDate?.slice(0, 16) ||""}
 onChange={(e) => setExam({ ...exam, endDate: e.target.value || null})}
 className="w-full px-4 py-2 mezon-field rounded-[8px] focus-visible:ring-4 focus-visible:ring-[rgba(0,122,255,0.3)]"
 />
 </div>
 </div>
 <div className="flex flex-wrap gap-6 pt-2">
 <label className="flex items-center gap-2">
 <input
 type="checkbox"
 checked={exam.shuffleQuestions}
 onChange={(e) => setExam({ ...exam, shuffleQuestions: e.target.checked})}
 className="rounded border-[rgba(0,0,0,0.12)] text-[var(--color-blue)] focus:ring-[rgba(0,122,255,0.3)]"
 />
 <span className="text-sm text-[var(--text-primary)]">Перемешивать вопросы</span>
 </label>
 <label className="flex items-center gap-2">
 <input
 type="checkbox"
 checked={exam.shuffleOptions}
 onChange={(e) => setExam({ ...exam, shuffleOptions: e.target.checked})}
 className="rounded border-[rgba(0,0,0,0.12)] text-[var(--color-blue)] focus:ring-[rgba(0,122,255,0.3)]"
 />
 <span className="text-sm text-[var(--text-primary)]">Перемешивать варианты ответов</span>
 </label>
 <label className="flex items-center gap-2">
 <input
 type="checkbox"
 checked={exam.showResults}
 onChange={(e) => setExam({ ...exam, showResults: e.target.checked})}
 className="rounded border-[rgba(0,0,0,0.12)] text-[var(--color-blue)] focus:ring-[rgba(0,122,255,0.3)]"
 />
 <span className="text-sm text-[var(--text-primary)]">Показывать результаты после сдачи</span>
 </label>
 </div>
 </div>
 )}

 {/* Список вопросов */}
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <h2 className="macos-text-callout text-[var(--text-primary)]">Вопросы</h2>
 </div>

 {questions.map((question, index) => (
 <QuestionEditor
 key={question.id || question.tempId}
 question={question}
 index={index}
 onChange={(updates) => updateQuestion(index, updates)}
 onRemove={() => removeQuestion(index)}
 onDuplicate={() => duplicateQuestion(index)}
 />
 ))}

 {/* Добавить вопрос */}
 <div className="bg-white rounded-[12px] shadow-[var(--shadow-sm)] border border-[rgba(0,0,0,0.06)] p-4">
 <p className="macos-text-caption text-[var(--text-primary)] mb-3">Добавить вопрос:</p>
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
 {Object.entries(questionTypeLabels).map(([type, { label, icon: Icon, description}]) => (
 <button
 key={type}
 onClick={() => addQuestion(type as ExamQuestionType)}
 className="flex flex-col items-center gap-2 p-3 text-sm text-[var(--text-primary)] bg-[var(--fill-quaternary)] rounded-lg hover:bg-[rgba(0,122,255,0.06)] hover:text-[var(--color-blue)] macos-macos-transition"
 title={description}
 >
 <Icon className="h-5 w-5"/>
 <span className="text-xs text-center">{label}</span>
 </button>
 ))}
 </div>
 </div>
 </div>
 </div>
 );
}

// Компонент редактора вопроса
function QuestionEditor({
 question,
 index,
 onChange,
 onRemove,
 onDuplicate,
}: {
 question: QuestionDraft;
 index: number;
 onChange: (updates: Partial<QuestionDraft>) => void;
 onRemove: () => void;
 onDuplicate: () => void;
}) {
 const typeInfo = questionTypeLabels[question.type ||"SINGLE_CHOICE"];
 const TypeIcon = typeInfo.icon;

 return (
 <div className="bg-white rounded-[12px] shadow-[var(--shadow-sm)] border border-[rgba(0,0,0,0.06)] overflow-hidden">
 {/* Заголовок вопроса */}
 <div
 className="flex items-start gap-3 p-4 cursor-pointer hover:bg-[var(--fill-quaternary)]"
 onClick={() => onChange({ expanded: !question.expanded})}
 >
 <GripVertical className="h-5 w-5 text-[var(--text-tertiary)]"/>
 <span className="flex items-center justify-center w-8 h-8 bg-[rgba(0,122,255,0.1)] text-[var(--color-blue)] rounded-full macos-text-caption">
 {index + 1}
 </span>
 <TypeIcon className="h-5 w-5 text-[var(--text-secondary)]"/>
 <span className="flex-1 min-w-0 text-[var(--text-primary)] whitespace-pre-line break-words">
 {question.content ||"Новый вопрос"}
 </span>
 <div className="flex items-center gap-1 flex-shrink-0">
 <span className="text-sm text-[var(--text-secondary)]">{question.points || 1} б.</span>
 <button
 onClick={(e) => {
 e.stopPropagation();
 onDuplicate();
}}
 className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
 title="Дублировать"
 >
 <Copy className="h-4 w-4"/>
 </button>
 <button
 onClick={(e) => {
 e.stopPropagation();
 onRemove();
}}
 className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--color-red)]"
 title="Удалить"
 >
 <Trash2 className="h-4 w-4"/>
 </button>
 {question.expanded ? (
 <ChevronUp className="h-5 w-5 text-[var(--text-tertiary)]"/>
 ) : (
 <ChevronDown className="h-5 w-5 text-[var(--text-tertiary)]"/>
 )}
 </div>
 </div>

 {/* Содержимое вопроса */}
 {question.expanded && (
 <div className="p-4 pt-0 space-y-4 border-t border-[rgba(0,0,0,0.04)]">
 <div>
 <label className="block macos-text-caption text-[var(--text-primary)] mb-1">Вопрос</label>
 <textarea
 value={question.content ||""}
 onChange={(e) => onChange({ content: e.target.value})}
 placeholder="Введите текст вопроса..."
 rows={3}
 className="w-full px-4 py-2 mezon-field rounded-[8px] focus-visible:ring-4 focus-visible:ring-[rgba(0,122,255,0.3)]"
 />
 </div>

 {/* Варианты ответов для выборочных вопросов */}
 {["SINGLE_CHOICE","MULTIPLE_CHOICE","TRUE_FALSE"].includes(question.type ||"") && (
 <div>
 <label className="block macos-text-caption text-[var(--text-primary)] mb-2">Варианты ответов</label>
 <div className="space-y-2">
 {(question.options || []).map((option, optIndex) => (
 <div key={optIndex} className="flex items-center gap-2">
 {question.type ==="MULTIPLE_CHOICE"? (
 <input
 type="checkbox"
 checked={
 Array.isArray(question.correctAnswer)
 ? question.correctAnswer.includes(option)
 : question.correctAnswer === option
}
 onChange={(e) => {
 const current = Array.isArray(question.correctAnswer)
 ? question.correctAnswer
 : question.correctAnswer
 ? [question.correctAnswer]
 : [];
 const updated = e.target.checked
 ? [...current, option]
 : current.filter((a: string) => a !== option);
 onChange({ correctAnswer: updated});
}}
 className="rounded border-[rgba(0,0,0,0.12)] text-[var(--color-blue)] focus:ring-[rgba(0,122,255,0.3)]"
 />
 ) : (
 <input
 type="radio"
 name={`question_${question.id || question.tempId}_correct`}
 checked={question.correctAnswer === option}
 onChange={() => onChange({ correctAnswer: option})}
 className="border-[rgba(0,0,0,0.12)] text-[var(--color-blue)] focus:ring-[rgba(0,122,255,0.3)]"
 />
 )}
 <input
 type="text"
 value={option}
 onChange={(e) => {
 const updated = [...(question.options || [])];
 const oldValue = updated[optIndex];
 updated[optIndex] = e.target.value;
 onChange({ options: updated});
 // Обновляем correctAnswer если изменился выбранный вариант
 if (question.correctAnswer === oldValue) {
 onChange({ options: updated, correctAnswer: e.target.value});
}
}}
 placeholder={`Вариант ${optIndex + 1}`}
 className="flex-1 px-3 py-2 mezon-field rounded-[8px] focus-visible:ring-4 focus-visible:ring-[rgba(0,122,255,0.3)]"
 disabled={question.type ==="TRUE_FALSE"}
 />
 {question.type !=="TRUE_FALSE"&& (
 <button
 onClick={() => {
 const updated = (question.options || []).filter((_, i) => i !== optIndex);
 onChange({ options: updated});
}}
 className="p-2 text-[var(--text-tertiary)] hover:text-[var(--color-red)]"
 >
 <Trash2 className="h-4 w-4"/>
 </button>
 )}
 </div>
 ))}
 {question.type !=="TRUE_FALSE"&& (
 <button
 onClick={() => onChange({ options: [...(question.options || []),""]})}
 className="flex items-center gap-1 text-sm text-[var(--color-blue)] hover:text-[var(--color-blue)]"
 >
 <Plus className="h-4 w-4"/>
 Добавить вариант
 </button>
 )}
 </div>
 </div>
 )}

 {/* Ожидаемый ответ для текстовых вопросов */}
 {["TEXT_SHORT","TEXT_LONG","PROBLEM"].includes(question.type ||"") && (
 <div>
 <label className="block macos-text-caption text-[var(--text-primary)] mb-1">
 Ожидаемый ответ {question.type ==="TEXT_SHORT"&&"(для автопроверки)"}
 </label>
 <textarea
 value={question.expectedAnswer ||""}
 onChange={(e) => onChange({ expectedAnswer: e.target.value})}
 placeholder={
 question.type ==="PROBLEM"
 ?"Решение задачи с ответом..."
 :"Образец правильного ответа..."
}
 rows={question.type ==="TEXT_SHORT"? 1 : 4}
 className="w-full px-4 py-2 mezon-field rounded-[8px] focus-visible:ring-4 focus-visible:ring-[rgba(0,122,255,0.3)]"
 />
 </div>
 )}

 {/* Ключевые точки для AI проверки */}
 {["TEXT_LONG","PROBLEM"].includes(question.type ||"") && (
 <div>
 <label className="block macos-text-caption text-[var(--text-primary)] mb-1">
 Ключевые моменты для оценки AI
 </label>
 <textarea
 value={(question.keyPoints || []).join("\n")}
 onChange={(e) =>
 onChange({
 keyPoints: e.target.value.split("\n").filter((k) => k.trim()),
})
}
 placeholder="Каждая строка — отдельный критерий оценки"
 rows={3}
 className="w-full px-4 py-2 mezon-field rounded-[8px] focus-visible:ring-4 focus-visible:ring-[rgba(0,122,255,0.3)]"
 />
 <p className="text-xs text-[var(--text-secondary)] mt-1">
 AI будет оценивать наличие этих моментов в ответе студента
 </p>
 </div>
 )}

 {/* Пояснение */}
 <div>
 <label className="block macos-text-caption text-[var(--text-primary)] mb-1">
 Пояснение к ответу (видно после сдачи)
 </label>
 <textarea
 value={question.explanation ||""}
 onChange={(e) => onChange({ explanation: e.target.value})}
 placeholder="Объяснение правильного ответа..."
 rows={2}
 className="w-full px-4 py-2 mezon-field rounded-[8px] focus-visible:ring-4 focus-visible:ring-[rgba(0,122,255,0.3)]"
 />
 </div>

 {/* Баллы */}
 <div className="flex items-center gap-4">
 <div>
 <label className="block macos-text-caption text-[var(--text-primary)] mb-1">Баллы</label>
 <input
 type="number"
 value={question.points || 1}
 onChange={(e) => onChange({ points: Number(e.target.value)})}
 min="1"
 className="w-24 px-3 py-2 mezon-field rounded-[8px] focus-visible:ring-4 focus-visible:ring-[rgba(0,122,255,0.3)]"
 />
 </div>
 {question.type ==="MULTIPLE_CHOICE"&& (
 <label className="flex items-center gap-2 mt-6">
 <input
 type="checkbox"
 checked={question.partialCredit}
 onChange={(e) => onChange({ partialCredit: e.target.checked})}
 className="rounded border-[rgba(0,0,0,0.12)] text-[var(--color-blue)] focus:ring-[rgba(0,122,255,0.3)]"
 />
 <span className="text-sm text-[var(--text-primary)]">Частичный зачёт</span>
 </label>
 )}
 </div>
 </div>
 )}
 </div>
 );
}
