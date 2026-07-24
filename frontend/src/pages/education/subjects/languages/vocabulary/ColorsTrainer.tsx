import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Volume2, Mic, Keyboard, CheckCircle2, Star } from "lucide-react";

export default function ColorsTrainer() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<"en" | "uz">("en");
  const [currentQ, setCurrentQ] = useState(0);
  
  const [phase, setPhase] = useState<"listen-speak" | "type">("listen-speak"); 
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechResult, setSpeechResult] = useState<string | null>(null);
  
  const [typedWord, setTypedWord] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [showTransition, setShowTransition] = useState(false);

  const S3_BASE = "https://4da21c74-3916-49d9-84a3-03b7f1220048.selstorage.ru";
  
  const QUESTIONS = [
    { id: "red", imageUrl: `${S3_BASE}/red.png`, correct: { en: "RED", uz: "QIZIL" } },
    { id: "yellow", imageUrl: `${S3_BASE}/yellow.png`, correct: { en: "YELLOW", uz: "SARIQ" } },
    { id: "green", imageUrl: `${S3_BASE}/green.png`, correct: { en: "GREEN", uz: "YASHIL" } },
    { id: "brown", imageUrl: `${S3_BASE}/brown.png`, correct: { en: "BROWN", uz: "QO'NG'IROQ" } },
  ];

  const question = QUESTIONS[currentQ];
  const correctWord = question?.correct[lang] || "";

  // 1. ГАРАНТИРОВАННО УКРЫВАЕМ МЕНЮ И ШАПКУ
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

  // 2. ФУНКЦИЯ ОЗВУЧКИ
  const speak = (text: string, onEnd?: () => void) => {
    window.speechSynthesis.cancel(); 
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'en' ? 'en-US' : 'uz-UZ';
    utterance.rate = 0.85; 
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };
    window.speechSynthesis.speak(utterance);
  };

  // 3. АВТОМАТИЧЕСКИЙ СЦЕНАРИЙ "СЛУШАЙ И ГОВОРИ"
  useEffect(() => {
    if (phase !== 'listen-speak' || !question) return;
    setSpeechResult(null);

    const t1 = setTimeout(() => speak(correctWord), 800);
    const t2 = setTimeout(() => {
      speak(lang === 'en' ? "Repeat after me" : "Takrorlang");
    }, 2500);

    const t3 = setTimeout(() => {
      startListening();
    }, 5000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [currentQ, phase]);

  // 4. РАСПОЗНАВАНИЕ РЕЧИ (Хром)
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'en' ? 'en-US' : 'uz-UZ';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toUpperCase().trim();
      setSpeechResult(transcript);
      
      if (transcript.includes(correctWord)) {
        speak(lang === 'en' ? "Well done!" : "Zo'r!"); 
        setTimeout(() => {
          if (currentQ < QUESTIONS.length - 1) {
            setCurrentQ(currentQ + 1);
          } else {
            setShowTransition(true);
            setTimeout(() => {
              speak(lang === 'en' ? "Now write the word" : "Endi so'zni yozing");
              setTimeout(() => {
                setPhase("type");
                setCurrentQ(0);
                setShowTransition(false);
              }, 2000);
            }, 3000);
          }
        }, 1500);
      } else {
        speak(lang === 'en' ? "Try again!" : "Yana urinib ko'ring!");
      }
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // 5. ЛОГИКА ПИСЬМА
  useEffect(() => {
    if (phase === 'type' && typedWord === correctWord) {
      speak(lang === 'en' ? "Excellent!" : "A'lo!");
      setTimeout(() => {
        if (currentQ < QUESTIONS.length - 1) {
          setCurrentQ(currentQ + 1);
          setTypedWord("");
        } else {
          setIsComplete(true);
        }
      }, 1500);
    }
  }, [typedWord]);

  if (showTransition) {
    return (
      <div className="fixed inset-0 bg-indigo-600 flex flex-col items-center justify-center text-white z-50">
        <Star className="w-24 h-24 mb-6 animate-spin text-yellow-300" />
        <h2 className="text-4xl font-black mb-2">ТЫ ГОВОРИЛ ОТЛИЧНО!</h2>
        <p className="text-2xl text-indigo-200">А теперь давай научимся писать...</p>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-green-400 to-blue-500 flex flex-col items-center justify-center text-white z-50">
        <CheckCircle2 className="w-32 h-32 mb-6 animate-bounce" />
        <h1 className="text-6xl font-black mb-4 drop-shadow-lg">УРА!</h1>
        <p className="text-2xl mb-10 opacity-90">Ты super-star! 🌟</p>
        <button onClick={() => navigate('/dashboard')} className="bg-white text-green-600 font-black px-10 py-4 rounded-2xl text-2xl hover:bg-green-50 transition-colors shadow-2xl">
          Выйти
        </button>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col items-center justify-center relative">
      
      <button 
        onClick={() => navigate('/dashboard')} 
        className="absolute top-4 left-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-900 z-10"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="absolute top-4 right-4 flex bg-white rounded-xl p-1 shadow-lg border z-10">
        <button onClick={() => setLang('en')} className={"px-4 py-2 rounded-lg text-sm font-bold transition-all " + (lang === 'en' ? "bg-indigo-600 text-white shadow" : "text-gray-500")}>🇬🇧 EN</button>
        <button onClick={() => setLang('uz')} className={"px-4 py-2 rounded-lg text-sm font-bold transition-all " + (lang === 'uz' ? "bg-indigo-600 text-white shadow" : "text-gray-500")}>🇺🇿 UZ</button>
      </div>

      <div className="flex flex-col items-center w-full max-w-2xl px-8">
        
        <h1 className="text-8xl font-black text-indigo-600 mb-6 tracking-widest drop-shadow-sm">
          {correctWord}
        </h1>

        <div className="relative mb-8">
          <img 
            src={question.imageUrl} 
            alt="Color" 
            className="w-[350px] h-[350px] object-contain drop-shadow-2xl rounded-3xl"
          />
          
          {phase === 'listen-speak' && (
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
              <div className={"w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all " + (isListening ? "bg-purple-500 ring-4 ring-purple-300 animate-pulse scale-110" : isSpeaking ? "bg-green-400 scale-110" : "bg-gray-200")}>
                {isListening ? <Mic className="w-8 h-8 text-white" /> : <Volume2 className="w-8 h-8 text-gray-500" />}
              </div>
            </div>
          )}
        </div>

        {phase === 'listen-speak' && (
          <div className="h-24 flex flex-col items-center justify-center mt-8">
            {speechResult ? (
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-1">Ты сказал:</p>
                <p className="text-4xl font-black text-gray-800">{speechResult}</p>
              </div>
            ) : (
              <div className="text-center text-purple-600 animate-pulse">
                <p className="text-3xl font-black">ГОВОРИ...</p>
              </div>
            )}
          </div>
        )}

        {phase === 'type' && (
          <div className="w-full max-w-md mt-4">
            <Keyboard className="w-8 h-8 mx-auto text-gray-300 mb-4" />
            <input 
              type="text"
              value={typedWord}
              onChange={(e) => setTypedWord(e.target.value.toUpperCase())}
              placeholder="._._"
              className="w-full text-5xl font-black text-center tracking-[0.3em] border-b-4 border-gray-300 focus:border-indigo-500 outline-none pb-3 text-gray-800 bg-transparent"
              autoFocus
              maxLength={10}
            />
            <p className="text-center text-gray-500 mt-8 text-2xl font-medium">Напиши слово, которое видишь вверху</p>
          </div>
        )}

      </div>
    </div>
  );
}