import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mic, CheckCircle2, XCircle } from "lucide-react";

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
  const [isWrittenSubmitted, setIsWrittenSubmitted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const [oralAttempts, setOralAttempts] = useState(0);

  const [testLog, setTestLog] = useState<{ id: string; color: string; colorCode: string; correct: string; userAnswer: string; phase: string; status: "success" | "fail" }[]>([]);
  
  const [calculatedGrade, setCalculatedGrade] = useState<number>(2);
  const [generatedComment, setGeneratedComment] = useState<string>("");
  const [isSentToApi, setIsSentToApi] = useState<boolean>(false);

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
      window.speechSynthesis.cancel(); 

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toUpperCase().trim();
        setSpeechResult(transcript);
        const isCorrect = transcript.includes(correctWord);
        
        if (isCorrect) {
          setTestLog(prev => [...prev, { id: question.id, color: correctWord, colorCode: question.colorCode, correct: correctWord, userAnswer: transcript, phase: "Устно", status: "success" }]);
          speak(lang === 'en' ? "Good! Now write it." : "Yaxshi! Endi yozing.", () => { 
            setOralAttempts(0); 
            setPhase("type"); 
            setTypedWord(""); // ГАРАНТИРУЕМ ПУСТОЕ ПОЛЕ
          });
        } else {
          const newAttemptCount = oralAttempts + 1;
          setOralAttempts(newAttemptCount);
          
          if (newAttemptCount >= 2) {
            setTestLog(prev => [...prev, { id: question.id, color: correctWord, colorCode: question.colorCode, correct: correctWord, userAnswer: transcript, phase: "Устно", status: "fail" }]);
            speak(lang === 'en' ? "Let's write it." : "Endi yozing.", () => { 
              setOralAttempts(0); 
              setPhase("type"); 
              setTypedWord(""); // ГАРАНТИРУЕМ ПУСТОЕ ПОЛЕ
            });
          } else {
            setSpeechResult(null);
            speak(lang === 'en' ? "Try again!" : "Yana urinib ko'ring!");
          }
        }
      };

      recognition.onend = () => setIsListening(false);
      recognition.onerror = (e: any) => { 
        if (e.error === 'no-speech') setIsListening(false); 
        else { console.error("Mic error:", e.error); setMicFailed(true); }
      };
      
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
    setOralAttempts(0);
    
    const t = setTimeout(() => speak(lang === 'en' ? "What color is this?" : "Bu qanday rang?"), 800);
    return () => { clearTimeout(t); };
  }, [currentQ, phase]);

  const handleWrittenSubmit = () => {
    if (isWrittenSubmitted || !typedWord.trim()) return;
    setIsWrittenSubmitted(true);
    
    const isCorrect = typedWord === correctWord;
    setTestLog(prev => [...prev, { id: question.id, color: correctWord, colorCode: question.colorCode, correct: correctWord, userAnswer: typedWord, phase: "Письменно", status: isCorrect ? "success" : "fail" }]);
    
    setTimeout(() => {
      if (currentQ < QUESTIONS.length - 1) {
        setCurrentQ(prev => prev + 1);
        setPhase("speak");
        setTypedWord(""); // ОЧИЩАЕМ ДЛЯ СЛЕДУЮЩЕГО ВОПРОСА
        setIsWrittenSubmitted(false);
      } else {
        setIsComplete(true);
      }
    }, 1000);
  };

  // MOCK API
  const sendResultsToApi = async (grade: number, comment: string) => {
    const payload = {
      studentId: "mock-student-1", studentName: "Алиев Рустам", studentClass: "1 А",          
      subject: "🇬🇧 Английский язык", topic: "Цвета", grade: grade, comment: comment, details: testLog 
    };
    console.log("📤 MOCK API: Отправляем данные на сервер (Журнал):", payload);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSentToApi(true);
  };

  useEffect(() => {
    if (!isComplete) return;
    
    const totalColors = QUESTIONS.length;
    const maxPoints = totalColors * 2; 
    const successPoints = testLog.filter(l => l.status === "success").length;
    const percentage = Math.round((successPoints / maxPoints) * 100);

    let grade = 2;
    if (percentage >= 95) grade = 5;
    else if (percentage >= 80) grade = 4;
    else if (percentage >= 70) grade = 3;
    else if (percentage >= 60) grade = 2;
    
    setCalculatedGrade(grade);

    const oralLogs = testLog.filter(l => l.phase === "Устно");
    const writtenLogs = testLog.filter(l => l.phase === "Письменно");
    
    const oralSuccess = oralLogs.filter(l => l.status === "success").length;
    const writtenSuccess = writtenLogs.filter(l => l.status === "success").length;
    const oralFails = oralLogs.filter(l => l.status === "fail").map(l => l.correct);
    const writtenFails = writtenLogs.filter(l => l.status === "fail").map(l => l.correct);

    let text = `Тест по цветам:\n`;
    text += `Написание: ${writtenSuccess} из ${totalColors} цветов правильно`;
    text += writtenFails.length > 0 ? `, в ${writtenFails.length} - ошибки (${writtenFails.join(", ")})` : ", без ошибок";
    text += "\n";
    text += `Произношение: ${oralSuccess} из ${totalColors} цветов правильно`;
    text += oralFails.length > 0 ? `, в ${oralFails.length} - ошибки (${oralFails.join(", ")})` : ", без ошибок";
    text += "\n";
    text += percentage < 95 ? "Рекомендации: позанимайся на тренажере" : "Рекомендации: отличный результат!";

    setGeneratedComment(text);
    
    if (!isSentToApi) {
      sendResultsToApi(grade, text);
    }
  }, [isComplete, testLog, isSentToApi]);

  if (isComplete) {
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
          <summary className="p-4 font-bold text-gray-800 cursor-pointer flex justify-between items-center">
            📋 Протокол ответов
            <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="p-4 pt-0 space-y-2 max-h-60 overflow-y-auto">
            {testLog.map((log, i) => (
              <div key={i} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-100">
                <div className="w-8 h-8 rounded shadow-inner flex-shrink-0" style={{ backgroundColor: log.colorCode, border: log.colorCode === '#FFFFFF' ? '1px solid #ccc' : 'none' }} />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded mr-2">{log.phase}</span>
                  <span className="font-bold text-gray-800">{log.correct}</span>
                  <span className="ml-2 text-gray-500">— {log.userAnswer}</span>
                </div>
                <div className="text-xl flex-shrink-0">
                  {log.status === "success" ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />}
                </div>
              </div>
            ))}
          </div>
        </details>

        <div className="w-full max-w-2xl bg-white border-2 border-gray-200 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Комментарий (для ЛК ученика/родителя)</h3>
          <textarea value={generatedComment} onChange={(e) => setGeneratedComment(e.target.value)} rows={6} className="w-full border border-gray-300 rounded-xl p-3 text-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none font-medium text-lg" />
        </div>

        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900 font-bold underline mb-10">Вернуться назад</button>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col items-center justify-center relative">
      
      <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-900 z-10">
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

        <div className="mb-8">
          {question.isImg ? (
            <img src={question.imageUrl} alt="Color" className="w-[300px] h-[300px] object-contain drop-shadow-2xl rounded-3xl" />
          ) : (
            <div className="w-[300px] h-[300px] rounded-3xl shadow-2xl" style={{ backgroundColor: question.colorCode }} />
          )}
        </div>

        {phase === "speak" && (
          <div className="w-full max-w-md text-center space-y-6 mt-4">
            <button 
              onClick={startListening}
              disabled={!!speechResult}
              className={`w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-2xl mx-auto transition-all ${isListening ? "bg-purple-500 ring-4 ring-purple-300 animate-pulse scale-110" : speechResult ? "bg-gray-300 cursor-not-allowed" : "bg-gray-200 hover:bg-gray-300 cursor-pointer"}`}
            >
              <Mic className="w-10 h-10 text-gray-500" />
              {!isListening && !speechResult && <span className="text-[11px] text-gray-500 font-bold mt-1">НАЖМИ</span>}
            </button>
            
            {speechResult ? (
              <div className="text-center space-y-2">
                <p className="text-4xl">✅</p>
                <p className="text-xl font-bold text-indigo-600 animate-pulse">Переходим к письму...</p>
              </div>
            ) : (
              <p className="text-2xl font-bold text-purple-600 animate-pulse">Слушай вопрос и отвечай...</p>
            )}
          </div>
        )}

        {phase === "type" && (
          <div className="w-full max-w-md mt-4 text-center space-y-6">
            <p className="text-gray-500 mb-4 text-lg">Теперь напиши это слово:</p>
            <input 
              type="text"
              value={typedWord}
              onChange={(e) => setTypedWord(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === "Enter") handleWrittenSubmit(); }}
              placeholder="Напиши слово..." // Пустое поле без подсказок!
              disabled={isWrittenSubmitted}
              className="w-full text-6xl font-black text-center tracking-[0.3em] border-b-4 border-gray-300 focus:border-indigo-500 outline-none pb-3 text-gray-800 bg-transparent disabled:opacity-50"
              autoFocus
              maxLength={10}
            />
            
            {!isWrittenSubmitted ? (
              <button 
                onClick={handleWrittenSubmit}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-10 py-4 rounded-2xl text-xl transition-colors shadow-lg"
              >
                ПРОВЕРИТЬ
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 text-2xl font-bold animate-pulse text-indigo-600">
                Переходим к следующему...
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}