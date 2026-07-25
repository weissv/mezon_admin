import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, Play, Pause, Mic, Volume2 } from "lucide-react";

// ==========================================
// ТИПЫ
// ==========================================
interface ListeningQuestion {
  id: number;
  text: string; // Текст вопроса (например: "What color is the cat?")
  type: "oral" | "written"; // Как отвечать: устно или письменно
  correct: string; // Правильный ответ
}

interface ListeningData {
  audioUrl: string;
  questions: ListeningQuestion[];
}

// ==========================================
// MOCK ДАННЫЕ
// ==========================================
const TEST_DATA: ListeningData = {
  audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  questions: [
    { id: 1, text: "What color is the cat?", type: "oral", correct: "BLACK" },
    { id: 2, text: "How many dogs are there?", type: "written", correct: "THREE" },
    { id: 3, text: "Where is the boy?", type: "oral", correct: "IN THE ROOM" }
  ]
};

const TRAINER_POOL: ListeningQuestion[] = [
  { id: 1, text: "What color is the cat?", type: "oral", correct: "BLACK" },
  { id: 2, text: "How many dogs are there?", type: "written", correct: "THREE" },
  { id: 3, text: "Where is the boy?", type: "oral", correct: "IN THE ROOM" },
  { id: 4, text: "What is the girl eating?", type: "written", correct: "AN APPLE" },
  { id: 5, text: "Who is singing?", type: "oral", correct: "MARY" },
  { id: 6, text: "How old is the dog?", type: "written", correct: "FIVE" },
];

const getRandomQuestions = (pool: ListeningQuestion[], count: number) => {
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// ==========================================
// КОМПОНЕНТ
// ==========================================
export default function ListeningExercise({ mode = "test" }: { mode?: "test" | "trainer" }) {
  const navigate = useNavigate();
  
  const [QUESTIONS] = useState(() => {
    const baseData = mode === "trainer" 
      ? { ...TEST_DATA, questions: getRandomQuestions(TRAINER_POOL, 4) } 
      : TEST_DATA;
      
    // Сортировка: сначала устные (oral), затем письменные (written)
    baseData.questions.sort((a, b) => {
      if (a.type === 'oral' && b.type === 'written') return -1;
      if (a.type === 'written' && b.type === 'oral') return 1;
      return 0;
    });
    
    return baseData;
  });

  const [showIntro, setShowIntro] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false); 
  const [hasPausedOnce, setHasPausedOnce] = useState(false);

  // Состояния для устного ответа
  const [speechResult, setSpeechResult] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [oralAttempts, setOralAttempts] = useState(0);

  // Состояния для письменного ответа
  const [typedWord, setTypedWord] = useState("");
  const [writtenAttempts, setWrittenAttempts] = useState(0);
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const [isComplete, setIsComplete] = useState(false);
  const [testLog, setTestLog] = useState<{ id: number; text: string; correct: string; userAnswer: string; type: string; status: "success" | "fail" }[]>([]);
  
  const [calculatedGrade, setCalculatedGrade] = useState<number>(2);
  const [generatedComment, setGeneratedComment] = useState<string>("");
  const [isSentToApi, setIsSentToApi] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const question = QUESTIONS.questions[currentQ];

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
      window.speechSynthesis.cancel();
    };
  }, []);

  // Функция для озвучки вопроса
  const speakQuestion = (text: string) => {
    window.speechSynthesis.cancel(); // Отменяем предыдущую озвучку
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9; // Немного медленнее для понимания
    window.speechSynthesis.speak(utterance);
  };

  // Озвучка вопроса при его появлении (только для устных)
  useEffect(() => {
    if (showIntro || !question) return;
    if (question.type === 'oral') {
      const timer = setTimeout(() => speakQuestion(question.text), 500);
      return () => clearTimeout(timer);
    } else {
      window.speechSynthesis.cancel();
    }
  }, [currentQ, showIntro, question]);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    window.speechSynthesis.cancel(); // Останавливаем озвучку вопроса, если запустили аудио
    
    if (audioRef.current.paused) {
      audioRef.current.play().catch(e => console.error("Audio play error:", e));
      setIsPlaying(true);
      if (mode === "test") setHasPlayedOnce(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
      if (mode === "test") setHasPausedOnce(true);
    }
  };
  
  const startListening = () => {
    if (isListening || speechResult) return;
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      window.speechSynthesis.cancel(); 

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toUpperCase().trim();
        setSpeechResult(transcript);
        const isRight = transcript.includes(question.correct);
        checkAnswer(isRight, transcript, "oral");
      };
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (e: any) => { 
        if (e.error === 'no-speech') setIsListening(false); 
        else console.error("Mic error:", e.error); 
      };
      recognition.start();
    } catch (e) { console.error("Mic init error:", e); }
  };

  const handleWrittenSubmit = () => {
    if (!typedWord.trim() || isSubmitted) return;
    const isRight = typedWord === question.correct;
    checkAnswer(isRight, typedWord, "written");
  };

  const checkAnswer = (isRight: boolean, answer: string, type: string) => {
    setIsCorrect(isRight);
    setIsSubmitted(true);
    
    if (mode === "trainer") {
      if (isRight) {
        setTimeout(goToNext, 1500);
      } else {
        if (type === "oral") {
          const newAttempt = oralAttempts + 1; setOralAttempts(newAttempt);
          if (newAttempt >= 2) setTimeout(goToNext, 2000);
          else setTimeout(() => { setSpeechResult(null); setIsSubmitted(false); }, 1000);
        } else {
          const newAttempt = writtenAttempts + 1; setWrittenAttempts(newAttempt);
          if (newAttempt >= 2) setTimeout(goToNext, 2000);
          else setTimeout(() => { setTypedWord(""); setIsSubmitted(false); }, 1000);
        }
      }
      return;
    }

    setTestLog(prev => [...prev, { id: question.id, text: question.text, correct: question.correct, userAnswer: answer, type, status: isRight ? "success" : "fail" }]);
    setTimeout(goToNext, 1500);
  };

  const goToNext = () => {
    setSpeechResult(null); setTypedWord(""); setIsSubmitted(false); setIsCorrect(false); 
    setOralAttempts(0); setWrittenAttempts(0);
    if (currentQ < QUESTIONS.questions.length - 1) setCurrentQ(prev => prev + 1);
    else setIsComplete(true);
  };

  // MOCK API
  const sendResultsToApi = async (grade: number, comment: string) => {
    const payload = { 
      studentId: "mock-1", 
      studentName: "Алиев Рустам", 
      studentClass: "1 А", 
      subject: "🇬🇧 Английский язык", 
      topic: "Аудирование", 
      grade, 
      comment, 
      details: testLog 
    };
    console.log("📤 MOCK API: Отправляем данные на сервер (Журнал и ЛК):", payload);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSentToApi(true);
  };

  // Генерация оценки и комментария при завершении теста
  useEffect(() => {
    if (!isComplete || mode === "trainer") return;
    
    const totalQuestions = testLog.length;
    const successPoints = testLog.filter(l => l.status === "success").length;
    const percentage = Math.round((successPoints / totalQuestions) * 100);
    
    let grade = 2;
    if (percentage >= 95) grade = 5; 
    else if (percentage >= 80) grade = 4; 
    else if (percentage >= 70) grade = 3;
    
    setCalculatedGrade(grade);

    const oralLogs = testLog.filter(l => l.type === "oral");
    const writtenLogs = testLog.filter(l => l.type === "written");
    
    const oralSuccess = oralLogs.filter(l => l.status === "success").length;
    const writtenSuccess = writtenLogs.filter(l => l.status === "success").length;
    
    const oralFails = oralLogs.filter(l => l.status === "fail").map(l => `"${l.text}"`);
    const writtenFails = writtenLogs.filter(l => l.status === "fail").map(l => `"${l.text}"`);

    let text = `Тест по аудированию:\n`;
    text += `Правильных ответов: ${successPoints} из ${totalQuestions}\n\n`;
    
    text += `Устные ответы: ${oralSuccess} из ${oralLogs.length} правильно`;
    text += oralFails.length > 0 ? `, ошибки в вопросах: ${oralFails.join(", ")}` : ", без ошибок";
    text += "\n";
    
    text += `Письменные ответы: ${writtenSuccess} из ${writtenLogs.length} правильно`;
    text += writtenFails.length > 0 ? `, ошибки в вопросах: ${writtenFails.join(", ")}` : ", без ошибок";
    text += "\n\n";
    
    text += percentage < 95 ? "Рекомендации: позанимайся на тренажере" : "Рекомендации: отличный результат!";

    setGeneratedComment(text);
    
    if (!isSentToApi) {
      sendResultsToApi(grade, text);
    }
  }, [isComplete, testLog, isSentToApi, mode]);

  // --- ЭКРАН ИНСТРУКЦИИ ---
  if (showIntro) {
    return (
      <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col items-center justify-center p-4">
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-900 z-10">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-10 text-center">
          <div className="text-6xl mb-6">🎧</div>
          <h1 className="text-2xl font-black text-gray-900 mb-4">
            {mode === "test" ? "📝 Тест" : "🏋️ Тренажер"}: Аудирование
          </h1>
          <p className="text-xl text-gray-600 mb-8 font-medium">
            Послушай внимательно текст и ответь на вопросы.
          </p>
          <button 
            onClick={() => setShowIntro(false)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-10 py-4 rounded-xl transition-colors shadow-lg text-lg"
          >
            Начать
          </button>
        </div>
      </div>
    );
  }

  // --- ФИНАЛЬНЫЕ ЭКРАНЫ ---
  if (isComplete) {
    if (mode === "trainer") {
      return (
        <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-md mx-8">
            <CheckCircle2 className="w-24 h-24 text-green-500 mb-6" />
            <h1 className="text-3xl font-black text-gray-900 mb-4">Тренировка завершена!</h1>
            <div className="flex gap-4 mt-8">
              <button onClick={() => window.location.reload()} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold"><RotateCcw className="w-5 h-5" /> Заново</button>
              <button onClick={() => navigate(-1)} className="text-gray-500 font-bold underline text-lg py-3 px-4">Выйти</button>
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
          {isSentToApi && <p className="text-sm font-bold text-green-600 mt-2">✅ Результат отправлен в журнал</p>}
        </div>

        <details className="w-full max-w-2xl bg-gray-50 rounded-2xl border mb-6 group">
          <summary className="p-4 font-bold text-gray-800 cursor-pointer flex justify-between items-center">📋 Протокол ответов <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span></summary>
          <div className="p-4 pt-0 space-y-2 max-h-60 overflow-y-auto">
            {testLog.map((log, i) => (
              <div key={i} className="flex items-center justify-between bg-white p-3 rounded-xl border">
                <p className="text-sm text-gray-700 flex-1">"{log.text}" <span className="text-xs bg-gray-100 px-1 rounded ml-2">{log.type === 'oral' ? 'Устно' : 'Письменно'}</span></p>
                <span className={log.status === "success" ? "text-green-600 font-bold text-sm" : "text-red-600 font-bold text-sm line-through"}>{log.userAnswer}</span>
              </div>
            ))}
          </div>
        </details>

        {/* БЛОК КОММЕНТАРИЯ ДЛЯ ЛК */}
        <div className="w-full max-w-2xl bg-white border-2 border-gray-200 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Комментарий (для ЛК ученика/родителя)</h3>
          <textarea 
            value={generatedComment} 
            onChange={(e) => setGeneratedComment(e.target.value)} 
            rows={7} 
            className="w-full border border-gray-300 rounded-xl p-3 text-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none font-medium text-lg" 
          />
        </div>

        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900 font-bold underline mb-10">Вернуться назад</button>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col items-center justify-center p-4">
      <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-900 z-10">
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* Скрытый аудио элемент */}
      <audio ref={audioRef} src={QUESTIONS.audioUrl} onEnded={() => setIsPlaying(false)} />

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-8 p-8 flex flex-col items-center">
        
        <div className="flex items-center justify-between w-full mb-6 text-sm text-gray-400 font-bold">
          <span>Вопрос {currentQ + 1} из {QUESTIONS.questions.length}</span>
          <span>{question.type === 'oral' ? '🎤 Устный ответ' : '⌨️ Письменный ответ'}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-10">
          <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${((currentQ + 1) / QUESTIONS.questions.length) * 100}%` }}></div>
        </div>

        {/* ПЛЕЕР АУДИО */}
        <button 
          onClick={toggleAudio} 
          disabled={mode === "test" && hasPausedOnce}
          className={`w-32 h-32 rounded-full flex items-center justify-center shadow-xl transition-all mb-10 ${
            isPlaying ? 'bg-red-500 hover:bg-red-600' : 
            (mode === "test" && hasPlayedOnce) ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
          }`}
        >
          {isPlaying ? <Pause className="w-12 h-12 text-white" /> : <Play className="w-12 h-12 text-white ml-1" />}
        </button>
        {mode === "test" && hasPlayedOnce && !isPlaying && (
          <p className="text-sm text-red-500 -mt-6 mb-6">Аудио можно прослушать только 1 раз</p>
        )}

        {/* ВОПРОС И ВВОД ОТВЕТА */}
        <div className="w-full text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-8">
            <p className="text-2xl font-bold text-gray-800">{question.text}</p>
            {question.type === "oral" && (
              <button 
                onClick={() => speakQuestion(question.text)} 
                className="text-indigo-500 hover:text-indigo-700 transition-colors"
                title="Прослушать вопрос еще раз"
              >
                <Volume2 className="w-7 h-7" />
              </button>
            )}
          </div>
          
          {question.type === "oral" ? (
             <div className="space-y-4 flex flex-col items-center">
              <button 
                onClick={startListening} 
                disabled={!!speechResult}
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${
                  isListening ? "bg-purple-500 ring-4 ring-purple-300 animate-pulse scale-110" : speechResult ? "bg-gray-300 cursor-not-allowed" : "bg-gray-100 hover:bg-gray-200 cursor-pointer"
                }`}
              >
                <Mic className={`w-8 h-8 ${speechResult ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
              {speechResult && <p className="text-2xl font-black text-gray-800">{speechResult}</p>}
             </div>
          ) : (
             <div className="space-y-4 max-w-sm mx-auto">
              <input 
                type="text"
                value={typedWord}
                onChange={(e) => setTypedWord(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === "Enter") handleWrittenSubmit(); }}
                placeholder="Write here..."
                disabled={isSubmitted}
                className="w-full text-3xl font-bold text-center border-b-4 border-gray-300 focus:border-indigo-500 outline-none pb-2 bg-transparent disabled:opacity-50"
                autoFocus
              />
              {!isSubmitted && (
                <button onClick={handleWrittenSubmit} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-xl transition-colors shadow">
                  CHECK
                </button>
              )}
             </div>
          )}
        </div>

        {/* ИНДИКАТОР */}
        <div className={`mt-8 text-xl font-bold text-center h-10 ${isCorrect ? 'text-green-500' : 'text-red-500 animate-bounce'}`}>
          {isSubmitted && (isCorrect ? "✅ Правильно!" : (mode === "trainer" ? "❌ Попробуй еще раз!" : "❌ Неправильно!"))}
        </div>

      </div>
    </div>
  );
}