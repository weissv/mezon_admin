import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw } from "lucide-react";

interface GrammarQuestion {
  id: number;
  sentence: string;
  options: string[];
  correctIndex: number;
}

// База для ТЕСТА (всегда одни и те же, строго)
const TEST_QUESTIONS: GrammarQuestion[] = [
  { id: 1, sentence: "I _____ a student.", options: ["am", "is", "are", "do"], correctIndex: 0 },
  { id: 2, sentence: "They _____ from Uzbekistan.", options: ["am", "is", "are", "does"], correctIndex: 2 },
  { id: 3, sentence: "He _____ my brother.", options: ["am", "is", "are", "do"], correctIndex: 1 },
  { id: 4, sentence: "We _____ friends.", options: ["am", "is", "are", "do"], correctIndex: 2 },
  { id: 5, sentence: "She _____ a teacher.", options: ["am", "is", "are", "does"], correctIndex: 1 },
  { id: 6, sentence: "You _____ in 1 'A' class.", options: ["am", "is", "are", "do"], correctIndex: 2 }
];

// Большая база для ТРЕНЕЖЕРА (отсюда будут браться случайные 5)
const TRAINER_POOL: GrammarQuestion[] = [
  { id: 1, sentence: "I _____ a student.", options: ["am", "is", "are", "do"], correctIndex: 0 },
  { id: 2, sentence: "They _____ from Uzbekistan.", options: ["am", "is", "are", "does"], correctIndex: 2 },
  { id: 3, sentence: "He _____ my brother.", options: ["am", "is", "are", "do"], correctIndex: 1 },
  { id: 4, sentence: "We _____ friends.", options: ["am", "is", "are", "do"], correctIndex: 2 },
  { id: 5, sentence: "She _____ a teacher.", options: ["am", "is", "are", "does"], correctIndex: 1 },
  { id: 6, sentence: "You _____ in 1 'A' class.", options: ["am", "is", "are", "do"], correctIndex: 2 },
  { id: 7, sentence: "It _____ a cat.", options: ["am", "is", "are", "do"], correctIndex: 1 },
  { id: 8, sentence: "My parents _____ doctors.", options: ["am", "is", "are", "do"], correctIndex: 2 },
  { id: 9, sentence: "Rustam and I _____ classmates.", options: ["am", "is", "are", "do"], correctIndex: 2 },
  { id: 10, sentence: "The dog _____ big.", options: ["am", "is", "are", "do"], correctIndex: 1 },
  { id: 11, sentence: "I _____ happy today.", options: ["am", "is", "are", "do"], correctIndex: 0 },
  { id: 12, sentence: "The books _____ on the table.", options: ["am", "is", "are", "do"], correctIndex: 1 },
  { id: 13, sentence: "We _____ at school now.", options: ["am", "is", "are", "do"], correctIndex: 2 },
  { id: 14, sentence: "He _____ not here yesterday.", options: ["am", "is", "are", "was"], correctIndex: 3 },
  { id: 15, sentence: "They _____ ready for the exam.", options: ["am", "is", "are", "do"], correctIndex: 2 }
];

// Функция перемешивания и взятия случайных вопросов
const getRandomQuestions = (pool: GrammarQuestion[], count: number) => {
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export default function GrammarFillBlank({ mode = "test" }: { mode?: "test" | "trainer" }) {
  const navigate = useNavigate();
  
  // Выбираем вопросы в зависимости от режима
  const [QUESTIONS] = useState(() => 
    mode === "trainer" ? getRandomQuestions(TRAINER_POOL, 5) : TEST_QUESTIONS
  );

  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  
  const [isComplete, setIsComplete] = useState(false);
  const [testLog, setTestLog] = useState<{ id: number; sentence: string; correct: string; userAnswer: string; status: "success" | "fail" }[]>([]);
  
  const [calculatedGrade, setCalculatedGrade] = useState<number>(2);
  const [generatedComment, setGeneratedComment] = useState<string>("");
  const [isSentToApi, setIsSentToApi] = useState<boolean>(false);

  const question = QUESTIONS[currentQ];
  const correctWord = question?.options[question.correctIndex];

  useEffect(() => {
    const sidenav = document.querySelector('.mezon-sidenav') as HTMLElement | null;
    const topbar = document.querySelector('.mezon-top-bar') as HTMLElement | null;
    const shell = document.querySelector('.mezon-shell') as HTMLElement | null;
    if (sidenav) sidenav.style.display = 'none';
    if (topbar) topbar.style.display = 'none';
    if (shell) shell.style.marginLeft = '0';
    return () => {
      if (sidenav) sidenav.style.display = '';
      if (topbar) topbar.style.display = '';
      if (shell) shell.style.marginLeft = '';
    };
  }, []);

  const goToNext = () => {
    setSelectedAnswer(null);
    setIsSubmitted(false);
    setIsCorrect(false);
    setAttempts(0); 
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleSelectOption = (option: string, index: number) => {
    if (isSubmitted) return;
    setSelectedAnswer(option);
    const isRight = index === question.correctIndex;
    setIsCorrect(isRight);
    setIsSubmitted(true);
    
    if (mode === "trainer") {
      if (isRight) {
        setTimeout(goToNext, 1000);
      } else {
        const newAttemptCount = attempts + 1;
        setAttempts(newAttemptCount);
        if (newAttemptCount >= 2) {
          setTimeout(goToNext, 2000); // Показываем правильный ответ и уходим
        } else {
          setTimeout(() => { setSelectedAnswer(null); setIsSubmitted(false); }, 1000); // Даем второй шанс
        }
      }
      return; 
    }

    // ЛОГИКА ТЕСТА
    setTestLog(prev => [...prev, { id: question.id, sentence: question.sentence, correct: correctWord, userAnswer: option, status: isRight ? "success" : "fail" }]);
    setTimeout(goToNext, 1500);
  };

  // MOCK API
  const sendResultsToApi = async (grade: number, comment: string) => {
    const payload = { studentId: "mock-student-1", studentName: "Алиев Рустам", studentClass: "1 А", subject: "🇬🇧 Английский язык", topic: "Грамматика: Глагол to be", grade: grade, comment: comment, details: testLog };
    console.log("📤 MOCK API: Отправляем данные на сервер (Журнал):", payload);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSentToApi(true);
  };

  useEffect(() => {
    if (!isComplete || mode === "trainer") return;
    const maxPoints = QUESTIONS.length; 
    const successPoints = testLog.filter(l => l.status === "success").length;
    const percentage = Math.round((successPoints / maxPoints) * 100);
    let grade = 2;
    if (percentage >= 95) grade = 5;
    else if (percentage >= 80) grade = 4;
    else if (percentage >= 70) grade = 3;
    else if (percentage >= 60) grade = 2;
    setCalculatedGrade(grade);
    const fails = testLog.filter(l => l.status === "fail");
    let text = `Грамматический тест (Глагол to be):\nПравильных ответов: ${successPoints} из ${maxPoints}`;
    text += fails.length > 0 ? `\nОшибки: ${fails.map(f => `"${f.sentence.replace("_____", '...')}"`).join("; ")}` : "\nБез ошибок";
    text += "\n" + (percentage < 95 ? "Рекомендации: повторить правила" : "Рекомендации: отличный результат!");
    setGeneratedComment(text);
    if (!isSentToApi) sendResultsToApi(grade, text);
  }, [isComplete, testLog, isSentToApi, mode, QUESTIONS.length]);

  // --- ФИНАЛЬНЫЕ ЭКРАНЫ ---
  if (isComplete) {
    if (mode === "trainer") {
      return (
        <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-md mx-8 flex flex-col items-center">
            <CheckCircle2 className="w-24 h-24 text-green-500 mb-6" />
            <h1 className="text-3xl font-black text-gray-900 mb-4">Тренировка завершена!</h1>
            <p className="text-gray-500 mb-8">Отличная работа. Ты стал еще увереннее.</p>
            <div className="flex gap-4">
              <button onClick={() => window.location.reload()} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-colors">
                <RotateCcw className="w-5 h-5" /> Начать заново
              </button>
              <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900 font-bold underline text-lg py-3 px-4">Выйти</button>
            </div>
          </div>
        </div>
      );
    }
    const successCount = testLog.filter(l => l.status === "success").length;
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-start overflow-y-auto py-10 px-4">
        <CheckCircle2 className="w-20 h-20 mb-4 text-green-500 mt-10" />
        <h1 className="text-3xl font-black text-gray-900 mb-2">ТЕСТ ЗАВЕРШЕН</h1>
        <p className="text-xl font-bold text-indigo-600 mb-6">{successCount} из {testLog.length} правильных ответов</p>
        <div className="w-full max-w-md bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-6 mb-6 text-center">
          <p className="text-sm font-bold text-indigo-600 uppercase mb-1">Итоговая оценка</p>
          <p className="text-7xl font-black text-indigo-700">{calculatedGrade}</p>
          {isSentToApi && (<p className="text-sm font-bold text-green-600 mt-2">✅ Результат отправлен в журнал</p>)}
        </div>
        <details className="w-full max-w-2xl bg-gray-50 rounded-2xl border mb-6 group">
          <summary className="p-4 font-bold text-gray-800 cursor-pointer flex justify-between items-center">📋 Протокол ответов <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span></summary>
          <div className="p-4 pt-0 space-y-2 max-h-60 overflow-y-auto">
            {testLog.map((log, i) => (
              <div key={i} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100">
                <p className="font-medium text-gray-700 text-sm flex-1">"{log.sentence.replace("_____", <span className="text-red-500 font-bold">...</span>)}"</p>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <span className="text-xs text-gray-400">Ответ: <span className={log.status === "success" ? "text-green-600 font-bold" : "text-red-600 font-bold line-through"}>{log.userAnswer}</span></span>
                  {log.status === "success" ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />}
                </div>
              </div>
            ))}
          </div>
        </details>
        <div className="w-full max-w-2xl bg-white border-2 border-gray-200 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Комментарий</h3>
          <textarea value={generatedComment} onChange={(e) => setGeneratedComment(e.target.value)} rows={5} className="w-full border border-gray-300 rounded-xl p-3 text-gray-800 focus:border-indigo-500 outline-none resize-none font-medium" />
        </div>
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900 font-bold underline mb-10">Вернуться назад</button>
      </div>
    );
  }

  if (!question) return null;
  const parts = question.sentence.split("_____");

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col items-center justify-center">
      <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-900 z-10">
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-8 p-8 flex flex-col items-center justify-center min-h-[500px]">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-gray-900">{mode === "test" ? "📝 Тест" : "🏋️ Тренажер"}: Глагол to be</h1>
        </div>

        <div className="flex items-center justify-between w-full mb-8">
          <p className="text-sm text-gray-400 font-bold">Вопрос {currentQ + 1} из {QUESTIONS.length}</p>
          <div className="w-32 bg-gray-100 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${((currentQ + 1) / QUESTIONS.length) * 100}%` }}></div>
          </div>
        </div>

        <div className="text-3xl font-bold text-gray-900 text-center mb-12 leading-relaxed tracking-wide">
          {parts[0]}
          <span className={`inline-block w-40 border-b-4 mx-2 transition-colors ${!selectedAnswer ? 'border-gray-300' : isCorrect ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600'}`}>
            {selectedAnswer}
          </span>
          {parts[1]}
        </div>

        {/* ФИКСИРОВАННЫЙ КОНТЕЙНЕР ДЛЯ КНОПОК И ТЕКСТА - ИСПРАВЛЯЕТ ПРЫЖОК */}
        <div className="w-full max-w-md h-44 relative mt-8">
          
          {isSubmitted && (
            <div className={`absolute top-0 left-0 right-0 text-center text-2xl font-bold transition-opacity ${isCorrect ? 'text-green-500' : 'text-red-500 animate-bounce'}`}>
              {isCorrect 
                ? "✅ Правильно!" 
                : (mode === "trainer" && attempts < 2 
                  ? "❌ Попробуй еще раз!" 
                  : (mode === "trainer" ? `❌ Ошибка! Верный ответ: ${correctWord}` : "❌ Неправильно!")
                )
              }
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 w-full absolute bottom-0">
            {question.options.map((option, index) => {
              let btnStyle = "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-800";
              if (isSubmitted) {
                if (index === question.correctIndex && (isCorrect || (mode === "trainer" && attempts >= 2))) {
                  btnStyle = "border-green-400 bg-green-50 text-green-700 ring-2 ring-green-200";
                } else if (index === question.options.indexOf(selectedAnswer!) && !isCorrect) {
                  btnStyle = "border-red-400 bg-red-50 text-red-700 line-through opacity-50";
                } else {
                  btnStyle = "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed";
                }
              } else if (selectedAnswer === option) {
                 btnStyle = "border-indigo-500 bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300 scale-105";
              }
              return (
                <button key={option} onClick={() => handleSelectOption(option, index)} disabled={isSubmitted}
                  className={`p-4 rounded-xl border-2 text-xl font-bold transition-all ${btnStyle}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}