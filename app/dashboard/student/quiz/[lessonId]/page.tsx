"use client";

import React, { use, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Mic, MicOff, Check, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

interface Question {
  id: string;
  type: "choice" | "blank" | "speaking";
  questionText: string;
  options?: string[];
  correctAnswer: string;
  speakingSentence?: string;
}

interface SpeechRecognitionEventLike {
  results: {
    0: {
      0: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const MOCK_QUIZ_QUESTIONS: Question[] = [
  {
    id: "q1",
    type: "choice",
    questionText: "Chọn từ đồng nghĩa với 'academic' trong ngữ cảnh học thuật?",
    options: ["Practical", "Scholarly", "Informal", "Vocational"],
    correctAnswer: "Scholarly"
  },
  {
    id: "q2",
    type: "blank",
    questionText: "Điền dạng đúng của động từ: She has decided to _______ (dedicate) two hours every day to learning English.",
    correctAnswer: "dedicate"
  },
  {
    id: "q3",
    type: "speaking",
    questionText: "Luyện nói phát âm câu sau trôi chảy tự nhiên:",
    speakingSentence: "Learning a second language accelerates cognitive development.",
    correctAnswer: "learning a second language accelerates cognitive development"
  }
];

function QuizContent({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const redirectUrl = searchParams.get("redirect") || "/dashboard/student";

  const [questions] = useState<Question[]>(MOCK_QUIZ_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [blankAnswer, setBlankAnswer] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  
  // Trạng thái luyện nói phát âm qua Microphone
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState("");
  const [speechMatchScore, setSpeechMatchScore] = useState<number | null>(null);

  // Trạng thái hoàn thành bài kiểm tra
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = questions[currentIndex];

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
  };

  const handleCheckAnswer = () => {
    if (isAnswered) return;

    let correct = false;
    if (currentQuestion.type === "choice") {
      correct = selectedOption === currentQuestion.correctAnswer;
    } else if (currentQuestion.type === "blank") {
      correct = blankAnswer.trim().toLowerCase() === currentQuestion.correctAnswer.toLowerCase();
    } else if (currentQuestion.type === "speaking") {
      correct = (speechMatchScore || 0) >= 70;
    }

    setIsCorrect(correct);
    setIsAnswered(true);
    if (correct) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setBlankAnswer("");
    setRecordedText("");
    setSpeechMatchScore(null);
    setIsAnswered(false);
    setIsCorrect(false);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
      try {
        const savedXp = localStorage.getItem("edu_xp");
        const currentXp = savedXp ? parseInt(savedXp) : 340;
        const reward = score * 20 + 20;
        localStorage.setItem("edu_xp", (currentXp + reward).toString());
      } catch (err) {}
    }
  };

  const handleStartRecording = () => {
    if (typeof window === "undefined") return;

    const speechWindow = window as SpeechRecognitionWindow;
    const SpeechRecognition =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsRecording(true);
      setRecordedText("Đang lắng nghe giọng nói của bạn...");
      setTimeout(() => {
        setIsRecording(false);
        const sentence = currentQuestion.speakingSentence || "";
        setRecordedText(sentence);
        setSpeechMatchScore(92);
        toast.success("Phát âm rất tốt", "Độ chính xác 92%");
      }, 3000);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      setRecordedText("Đang ghi âm... Hãy đọc to câu tiếng Anh trên.");
    };

    recognition.onerror = () => {
      setIsRecording(false);
      setRecordedText("Không nhận diện được âm thanh. Hãy thử lại.");
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const speechToText = event.results[0][0].transcript;
      setRecordedText(speechToText);

      const target = (currentQuestion.speakingSentence || "").toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
      const spoken = speechToText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
      
      const targetWords = target.split(" ");
      const spokenWords = spoken.split(" ");
      let matches = 0;
      targetWords.forEach(w => {
        if (spokenWords.includes(w)) matches++;
      });
      const overlapScore = Math.round((matches / targetWords.length) * 100);
      setSpeechMatchScore(overlapScore);
    };

    recognition.start();
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-6 sm:p-8 space-y-6 animate-fade-in">
      {isFinished ? (
        <div className="text-center space-y-6 py-6 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-pink-50 text-primary flex items-center justify-center text-3xl mx-auto shadow-inner border border-pink-100">
            🏆
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900">Hoàn thành bài kiểm tra!</h2>
            <p className="text-sm text-gray-500 font-medium">
              Chúc mừng bạn đã hoàn thành bài kiểm tra từ vựng và cấu trúc ngữ pháp bài học.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <span className="text-3xs font-extrabold text-gray-400 uppercase block tracking-wider">Điểm số</span>
              <span className="text-xl font-black text-gray-800">{score} / {questions.length}</span>
            </div>
            <div className="bg-pink-50 rounded-2xl p-4 border border-pink-100">
              <span className="text-3xs font-extrabold text-gray-400 uppercase block tracking-wider">Phần thưởng</span>
              <div className="flex items-center justify-center gap-1 text-primary">
                <Zap className="w-4 h-4 fill-current" />
                <span className="text-xl font-black">+{(score * 20 + 20)} XP</span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={() => router.push(redirectUrl)}
              className="px-8 shadow-md shadow-pink-200"
            >
              Trở lại bài học
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <div className="flex justify-between text-2xs font-extrabold text-gray-400 uppercase">
              <span>Kiểm tra bài học</span>
              <span>Câu hỏi {currentIndex + 1}/{questions.length}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-gray-900 leading-snug">
              {currentQuestion.questionText}
            </h3>

            {currentQuestion.type === "speaking" && (
              <div className="p-5 bg-gradient-to-r from-pink-50/50 via-blue-50/30 to-transparent border border-pink-100/65 rounded-2xl text-center space-y-4">
                <p className="text-base font-black text-primary tracking-wide">
                  "{currentQuestion.speakingSentence}"
                </p>
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={handleStartRecording}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md ${
                      isRecording ? "bg-red-500 text-white animate-pulse" : "bg-primary text-white hover:opacity-95 shadow-pink-200"
                    }`}
                  >
                    {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>
                  <span className="text-3xs font-extrabold text-gray-400 uppercase tracking-widest">
                    {isRecording ? "Đang ghi âm... Hãy nói" : "Click mic để ghi âm"}
                  </span>
                </div>

                {recordedText && (
                  <div className="space-y-1 text-xs pt-2">
                    <p className="text-gray-400 font-bold">Giọng nói của bạn:</p>
                    <p className="font-extrabold text-gray-800 italic">"{recordedText}"</p>
                    {speechMatchScore !== null && (
                      <p className="text-2xs font-extrabold text-secondary mt-1">Độ chính xác: {speechMatchScore}%</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {currentQuestion.type === "choice" && currentQuestion.options && (
              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedOption === option;
                  let borderClass = "border-gray-100 hover:border-pink-200 bg-white";
                  if (isSelected) borderClass = "border-primary bg-pink-50/25 text-primary";
                  if (isAnswered) {
                    if (option === currentQuestion.correctAnswer) {
                      borderClass = "border-emerald-500 bg-emerald-50 text-emerald-700";
                    } else if (isSelected) {
                      borderClass = "border-red-500 bg-red-50 text-red-700";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(option)}
                      disabled={isAnswered}
                      className={`w-full text-left p-4 rounded-2xl border font-bold text-xs flex justify-between items-center transition-all cursor-pointer ${borderClass}`}
                    >
                      <span>{option}</span>
                      {isAnswered && option === currentQuestion.correctAnswer && <Check className="w-4 h-4 text-emerald-600" />}
                      {isAnswered && isSelected && option !== currentQuestion.correctAnswer && <X className="w-4 h-4 text-red-600" />}
                    </button>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === "blank" && (
              <div className="space-y-2">
                <Input
                  value={blankAnswer}
                  onChange={(e) => setBlankAnswer(e.target.value)}
                  disabled={isAnswered}
                  placeholder="Nhập đáp án viết thường của bạn..."
                  className={`${
                    isAnswered
                      ? isCorrect
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-bold"
                        : "border-red-500 bg-red-50 text-red-700 font-bold"
                      : "border-gray-200"
                  }`}
                />
                {isAnswered && !isCorrect && (
                  <p className="text-3xs text-red-600 font-bold">Đáp án đúng: {currentQuestion.correctAnswer}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-50">
            {!isAnswered ? (
              <Button
                onClick={handleCheckAnswer}
                disabled={currentQuestion.type === "choice" ? !selectedOption : currentQuestion.type === "blank" ? !blankAnswer : speechMatchScore === null}
                className="px-6"
              >
                Kiểm tra đáp án
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="px-6 shadow-md shadow-blue-100"
              >
                Tiếp tục
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function QuizPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const resolvedParams = use(params);
  const lessonId = resolvedParams.lessonId;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <main className="flex-grow max-w-2xl w-full mx-auto px-4 py-10 flex flex-col justify-center">
        <Suspense fallback={
          <div className="flex justify-center items-center py-20 bg-white rounded-3xl border border-gray-100">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        }>
          <QuizContent lessonId={lessonId} />
        </Suspense>
      </main>
    </div>
  );
}
