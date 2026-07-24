import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mic, Volume2, CheckCircle2, XCircle, Save } from "lucide-react";

export default function ColorsTest() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<"en" | "uz">("en");
  const [currentQ, setCurrentQ] = useState(0);
  
  const [phase, setPhase] = useState<"speak" | "type">("speak"); 
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechResult, setSpeechResult] = useState<string | null>(null);
  const [micFailed, setMicFailed] = useState(false);
  
  const [typedWord, setTypedWord] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ИСПРАВЛЕНИЕ 2: Добавлено поле colorCode в типизацию
  const [testLog, setTestLog] = useState<{ id: string; color: string; colorCode: string; correct: string; userAnswer: string; phase: string; status: "success" | "fail" }[]>([]);

  const S3_BASE = "https://4da21c74-3916-49d9-84a3-03b7f1220048.selstorage.ru";
  
  const QUESTIONS = [
    { id: "red", imageUrl: `${S3_BASE}/red.png`, isImg: true, colorCode: "#EF4444", correct: { en: "RED", uz: "QIZIL" } },
    { id: "yellow", imageUrl: `${S3_BASE}/yellow.png`, isImg: true, colorCode: "#EAB308", correct: { en: "YELLOW", uz: "SARIQ" } },
    { id: "green", imageUrl: `${S3_BASE}/green.png`, isImg: true, colorCode: "#22C55E", correct: { en: "GREEN", uz: "YASHIL" } },
    { id: "brown", imageUrl: `${S3_BASE}/brown.png`, isImg: true, colorCode: "#92400E", correct: { en: "BROWN", uz: "QO'NG'IROQ" } },
    { id: "blue", imageUrl: "", isImg: false, colorCode: "#3B82F6", correct: { en: "BLUE", uz: "KO'K" } },
    { id: "pink", imageUrl: "", isImg: false, colorCode: "#EC4899", correct: { en: "PINK", uz: "PINK" } },
    { id: "orange", imageUrl: "", isImg: false, colorCode: "#F97316", correct: { en: "ORANGE", uz: "ORANGE" } },
    { id: "black", imageUrl: "", isImg: false, colorCode: "#000000", correct: { en: "BLACK", uz: "QORA" } },
    { id: "white", imageUrl: "", isImg: false, colorCode: "#FFFFFF", correct: { en: "WHITE", uz: "OQ" } },
  ];

  const question = QUESTIONS[currentQ];
  const correctWord = question?.correct[lang] || "";

  useEffect(() => {
    const sidenav = document.querySelector<HTMLElement>('.mezon-sidenav');
    const topbar = document.querySelector<HTMLElement>('.mezon-top-bar');
    const shell = document.querySelector<HTMLElement>('.mezon-shell');
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

  const speak = (text: string, onEnd?: () => void) => {
    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'en' ? 'en-US' : 'uz-UZ';
    utterance.rate = 0.85;
    utterance.onend = () => { setIsSpeaking(false); if (onEnd) onEnd(); };
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    setMicFailed(false);
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;
      const recognition = new SpeechRecognition();
      recognition.lang = lang === 'en' ? 'en-US' : 'uz-UZ';
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toUpperCase().trim();
        setSpeechResult(transcript);
        
        const isCorrect = transcript.includes(correctWord);
        
        // Логируем каждую первую попытку как ошибку (чтобы оценивать честно)
        if (!isCorrect) {
          // ИСПРАВЛЕНИЕ 2: Добавлено colorCode: question.colorCode
          setTestLog(prev => [...prev, { id: question.id, color: correctWord, colorCode: question.colorCode, correct: correctWord, userAnswer: transcript, phase: "Устно", status: "fail" }]);
          speak(lang === 'en' ? "Try again!" : "Yana urinib ko'ring!");
          return; // Даем еще одну попытку, не уходим на письмо!
        }

        // Если угадал (с первой или со второй попытки) — идем писать
        // ИСПРАВЛЕНИЕ 2: Добавлено colorCode: question.colorCode
        setTestLog(prev => [...prev, { id: question.id, color: correctWord, colorCode: question.colorCode, correct: correctWord, userAnswer: transcript, phase: "Устно", status: "success" }]);
        speak("Good!", () => setPhase("type"));
      }; // <--- ИСПРАВЛЕНИЕ 1: ВОТ ЭТОЙ СКОБКИ НЕ ХВАТАЛО!!!

      recognition.onend = () => setIsListening(false);
      recognition.onerror = (e: any) => { console.error("Mic error:", e.error); setMicFailed(true); };
      recognition.start();
    } catch (e) {
      console.error("Mic init error:", e);
      setMicFailed(true);
    }
  };

  useEffect(() => {
    if (phase !== 'speak' || !question) return;
    setSpeechResult(null);
    setMicFailed(false);
    
    const t = setTimeout(() => speak(lang === 'en' ? "What color is this?" : "Bu qanday rang?"), 800);
    const t2 = setTimeout(() => startListening(), 3500);
    const t3 = setTimeout(() => { if (!isListening) setMicFailed(true); }, 6000);

    return () => { clearTimeout(t); clearTimeout(t2); clearTimeout(t3); };
  }, [currentQ, phase]);

  useEffect(() => {
    if (phase === 'type' && typedWord === correctWord) {
      const writeText = lang === 'en' ? "Now write the word" : "Endi so'zni yozing";
      
      // ИСПРАВЛЕНИЕ 2: Добавлено colorCode: question.colorCode
      setTestLog(prev => [...prev, { id: question.id, color: correctWord, colorCode: question.colorCode, correct: correctWord, userAnswer: typedWord, phase: "Письменно", status: "success" }]);
      speak(writeText);

      setTimeout(() => {
        if (currentQ < QUESTIONS.length - 1) {
          setCurrentQ(currentQ + 1);
          setPhase("speak");
          setTypedWord("");
        } else {
          setIsComplete(true);
        }
      }, 1500);
    }
  }, [typedWord, phase]);

  const saveToJournal = () => {
    setIsSaving(true);
    setTimeout(() => {
      const newResult = {
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        subject: lang === 'en' ? 'Английский язык' : 'Узбекский язык',
        topic: 'Цвета',
        type: 'Тест',
        score: `${testLog.filter(l => l.status === "success").length} из ${QUESTIONS.length * 2}`,
        details: testLog
      };
      const existing = JSON.parse(localStorage.getItem('mezon_journal') || '[]');
      localStorage.setItem('mezon_journal', JSON.stringify([newResult, ...existing]));
      setIsSaving(false);
      navigate('/dashboard');
    }, 1500);
  };

  if (isComplete) {
    const successCount = testLog.filter(l => l.status === "success").length;
    const totalCount = testLog.length;
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center overflow-y-auto py-10 px-4">
        <CheckCircle2 className="w-24 h-24 mb-6 text-green-500" />
        <h1 className="text-4xl font-black text-gray-900 mb-2">ТЕСТ ЗАВЕРШЕН</h1>
        <p className="text-2xl font-bold text-indigo-600 mb-8">{successCount} из {totalCount} правильных ответов</p>

        <div className="w-full max-w-2xl bg-gray-50 rounded-2xl border p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">📋 Протокол ответов</h2>
          <div className="space-y-3">
            {testLog.map((log, i) => (
              <div key={i} className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-100">
                <div className="w-12 h-12 rounded-lg shadow-inner flex-shrink-0" style={{ backgroundColor: log.colorCode, border: log.colorCode === '#FFFFFF' ? '1px solid #ccc' : 'none' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{log.phase}</span>
                    <span className="font-bold text-gray-800 truncate">{log.correct}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    Ответ: <span className={log.status === "success" ? "text-green-600 font-bold" : "text-red-600 font-bold line-through"}>{log.userAnswer}</span>
                  </p>
                </div>
                <div className="text-2xl flex-shrink-0">
                  {log.status === "success" ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={saveToJournal} 
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-black px-10 py-4 rounded-2xl text-2xl transition-colors shadow-2xl flex items-center gap-3"
        >
          <Save className="w-8 h-8" />
          {isSaving ? "Сохраняем в журнал..." : "Сохранить в электронный журнал"}
        </button>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col items-center justify-center relative">
      
      <button onClick={() => navigate('/dashboard')} className="absolute top-4 left-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-900 z-10">
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="absolute top-4 right-4 flex bg-white rounded-xl p-1 shadow-lg border z-10">
        <button onClick={() => setLang('en')} className={"px-4 py-2 rounded-lg text-sm font-bold transition-all " + (lang === 'en' ? "bg-indigo-600 text-white shadow" : "text-gray-500")}>🇬🇧 EN</button>
        <button onClick={() => setLang('uz')} className={"px-4 py-2 rounded-lg text-sm font-bold transition-all " + (lang === 'uz' ? "bg-indigo-600 text-white shadow" : "text-gray-500")}>🇺🇿 UZ</button>
      </div>

      <div className="flex flex-col items-center w-full max-w-2xl px-8">
        
        <div className="flex items-center gap-4 mb-8">
          <div className={"px-4 py-1.5 rounded-full text-sm font-bold " + (phase === "speak" ? "bg-purple-100 text-purple-700 ring-2 ring-purple-200" : "bg-gray-100 text-gray-400")}>1. УСТНО</div>
          <div className="w-8 h-0.5 bg-gray-200"></div>
          <div className={"px-4 py-1.5 rounded-full text-sm font-bold " + (phase === "type" ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-200" : "bg-gray-100 text-gray-400")}>2. ПИСЬМЕННО</div>
        </div>

        {/* КАРТИНКА */}
        <div className="mb-8">
          {question.isImg ? (
            <img src={question.imageUrl} alt="Color" className="w-[300px] h-[300px] object-contain drop-shadow-2xl rounded-3xl" />
          ) : (
            <div className="w-[300px] h-[300px] rounded-3xl shadow-2xl" style={{ backgroundColor: question.colorCode }} />
          )}
        </div>

        {/* ФАЗА 1: УСТНЫЙ ОТВЕТ */}
        {phase === "speak" && (
          <div className="w-full max-w-md text-center space-y-6 mt-4">
            <button 
              onClick={startListening}
              className={`w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-2xl mx-auto transition-all ${isListening ? "bg-purple-500 ring-4 ring-purple-300 animate-pulse scale-110" : "bg-gray-200 hover:bg-gray-300 cursor-pointer"}`}
            >
              <Mic className="w-10 h-10 text-gray-500" />
              {!isListening && <span className="text-[11px] text-gray-500 font-bold mt-1">НАЖМИ</span>}
            </button>
            
            {speechResult ? (
              <div>
                <p className="text-sm text-gray-400 mb-1">Ты сказал:</p>
                <p className="text-4xl font-black text-gray-800">{speechResult}</p>
              </div>
            ) : (
              <p className="text-2xl font-bold text-purple-600 animate-pulse">Слушай вопрос и отвечай...</p>
            )}
          </div>
        )}

        {/* ФАЗА 2: ПИСЬМЕННЫЙ ОТВЕТ */}
        {phase === "type" && (
          <div className="w-full max-w-md mt-4 text-center">
            <p className="text-gray-500 mb-4 text-lg">Теперь напиши это слово:</p>
            <input 
              type="text"
              value={typedWord}
              onChange={(e) => setTypedWord(e.target.value.toUpperCase())}
              placeholder="._._"
              className="w-full text-6xl font-black text-center tracking-[0.3em] border-b-4 border-gray-300 focus:border-indigo-500 outline-none pb-3 text-gray-800 bg-transparent"
              autoFocus
              maxLength={10}
            />
          </div>
        )}

      </div>
    </div>
  );
}