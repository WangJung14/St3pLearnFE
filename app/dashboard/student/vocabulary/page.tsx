"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Volume2, ArrowRight, RotateCcw, Check, X, Brain, Award, Zap } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface Word {
  id: string;
  word: string;
  type: string;
  phonetic: string;
  meaning: string;
  definition: string;
  example: string;
}

const ACADEMIC_WORDS: Word[] = [
  {
    id: "w1",
    word: "Academic",
    type: "adjective",
    phonetic: "/ˌæk.əˈdem.ɪk/",
    meaning: "Thuộc về học thuật / Học viện",
    definition: "Relating to schools, colleges, and universities, or to subjects that teach useful knowledge but are not practical.",
    example: "She has outstanding academic achievements in English literature."
  },
  {
    id: "w2",
    word: "Cognitive",
    type: "adjective",
    phonetic: "/ˈkɒɡ.nə.tɪv/",
    meaning: "Liên quan đến nhận thức",
    definition: "Connected with thinking or conscious mental processes.",
    example: "Cognitive development in children is accelerated by learning a second language early."
  },
  {
    id: "w3",
    word: "Benchmark",
    type: "noun",
    phonetic: "/ˈbentʃ.mɑːk/",
    meaning: "Điểm chuẩn / Điểm mốc",
    definition: "A level of quality that can be used as a standard when comparing other things.",
    example: "An IELTS score of 7.5 is considered a benchmark for academic excellence."
  },
  {
    id: "w4",
    word: "Dedicate",
    type: "verb",
    phonetic: "/ˈded.ɪ.keɪt/",
    meaning: "Cống hiến / Dành riêng cho",
    definition: "To give all of your time, effort, etc. to something you believe is important.",
    example: "He decided to dedicate two hours every day to learning vocabulary."
  },
  {
    id: "w5",
    word: "Fluent",
    type: "adjective",
    phonetic: "/ˈfluː.ənt/",
    meaning: "Trôi chảy / Lưu loát",
    definition: "Able to speak, write or read a foreign language easily and accurately.",
    example: "After three years of consistent practice, she became fluent in English."
  },
  {
    id: "w6",
    word: "Evaluate",
    type: "verb",
    phonetic: "/ɪˈvæl.ju.eɪt/",
    meaning: "Đánh giá / Định giá",
    definition: "To judge or calculate the quality, importance, amount, or value of something.",
    example: "The teacher will evaluate your speaking skills based on fluency and pronunciation."
  },
  {
    id: "w7",
    word: "Mastery",
    type: "noun",
    phonetic: "/ˈmɑː.stər.i/",
    meaning: "Sự làm chủ / Tinh thông",
    definition: "Complete control of something, or great skill in doing something.",
    example: "Her complete mastery of English grammar helped her write a perfect essay."
  },
  {
    id: "w8",
    word: "Navigate",
    type: "verb",
    phonetic: "/ˈnæv.ɪ.ɡeɪt/",
    meaning: "Định hướng / Vượt qua khó khăn",
    definition: "To find a direction across an area, or to deal with a difficult situation successfully.",
    example: "It can be challenging to navigate complex academic journals without a strong vocabulary."
  }
];

export default function VocabularyPage() {
  const router = useRouter();
  const toast = useToast();
  
  const [deck, setDeck] = useState<Word[]>(ACADEMIC_WORDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Stats
  const [masteredCount, setMasteredCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(8);

  const currentWord = deck[currentIndex];

  // Play text-to-speech pronunciation
  const speakWord = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentWord) return;
    
    // Web Speech Synthesis API
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(currentWord.word);
      utterance.lang = "en-US";
      utterance.rate = 0.85; // slightly slower for clarity
      window.speechSynthesis.speak(utterance);
    } else {
      toast.warning("Trình duyệt không hỗ trợ phát âm");
    }
  };

  // Remember action (mastered)
  const handleRemember = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMasteredCount(prev => prev + 1);
    
    // Add XP points to local storage
    try {
      const savedXp = localStorage.getItem("edu_xp");
      const currentXp = savedXp ? parseInt(savedXp) : 340;
      localStorage.setItem("edu_xp", (currentXp + 10).toString());
    } catch (err) {}

    goToNext();
  };

  // Forget action (need review)
  const handleForget = (e: React.MouseEvent) => {
    e.stopPropagation();
    setReviewCount(prev => prev + 1);
    
    // Recycle word to the end of the deck
    setDeck(prev => {
      const updated = [...prev];
      const recycled = updated[currentIndex];
      updated.push(recycled);
      return updated;
    });

    goToNext();
  };

  const goToNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex < deck.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Reset or finish
        toast.success("Hoàn thành lượt học hôm nay", "Chúc mừng, bạn đã hoàn thành bộ từ vựng.");
        router.push("/dashboard/student");
      }
    }, 250);
  };

  const handleReset = () => {
    setDeck(ACADEMIC_WORDS);
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredCount(0);
    setReviewCount(0);
  };

  const progressPercent = Math.min((masteredCount / dailyGoal) * 100, 100);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-10 space-y-8">
        {/* Back and title */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard/student")}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Trở về Dashboard</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-extrabold text-gray-400 hover:text-primary transition-colors cursor-pointer"
            title="Làm mới bộ thẻ từ"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Học lại từ đầu</span>
          </button>
        </div>

        {/* Header summary */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              Luyện từ vựng thông minh
            </h1>
            <p className="text-xs text-gray-500">Ghi nhớ từ vựng học thuật theo phương pháp Lặp lại ngắt quãng (Spaced Repetition).</p>
          </div>

          {/* Goal progress */}
          <div className="flex items-center gap-4 w-full md:w-auto shrink-0">
            <div className="flex-1 md:flex-none space-y-1.5 min-w-[140px]">
              <div className="flex justify-between text-2xs font-extrabold text-gray-400 uppercase">
                <span>Mục tiêu ngày</span>
                <span className="text-primary">{masteredCount}/{dailyGoal} từ</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-pink-50 p-2.5 rounded-2xl text-primary border border-pink-100 flex items-center gap-1">
              <Zap className="w-4 h-4 fill-current" />
              <span className="text-xs font-black">+{(masteredCount * 10)} XP</span>
            </div>
          </div>
        </div>

        {/* Interactive 3D Flashcard */}
        {currentWord && (
          <div className="flex flex-col items-center gap-8 py-4">
            {/* The Flip Container */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full max-w-lg h-80 relative cursor-pointer group"
              style={{ perspective: "1000px" }}
            >
              {/* Card Inner */}
              <div
                className="w-full h-full relative transition-transform duration-500 shadow-soft hover:shadow-hover rounded-3xl border border-gray-100"
                style={{
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
                }}
              >
                {/* Front Side */}
                <div
                  className="absolute w-full h-full bg-white rounded-3xl p-8 flex flex-col justify-between items-center backface-hidden"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="text-right w-full">
                    <span className="bg-pink-50 text-primary border border-pink-100 text-3xs font-black uppercase px-2.5 py-1 rounded-lg">
                      Từ số {currentIndex + 1}
                    </span>
                  </div>

                  <div className="text-center space-y-3">
                    <h2 className="text-4xl font-black tracking-tight text-gray-900">{currentWord.word}</h2>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm font-bold text-gray-400 italic">({currentWord.type})</span>
                      <span className="text-sm font-extrabold text-secondary">{currentWord.phonetic}</span>
                      <button
                        onClick={speakWord}
                        className="p-1.5 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 transition-all cursor-pointer"
                        title="Phát âm từ này"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-center text-xs text-gray-400 font-bold tracking-wider uppercase">
                    Click vào thẻ để xem nghĩa
                  </div>
                </div>

                {/* Back Side */}
                <div
                  className="absolute w-full h-full bg-gradient-to-tr from-white to-pink-50/20 rounded-3xl p-8 flex flex-col justify-between items-center backface-hidden"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)"
                  }}
                >
                  <div className="text-right w-full">
                    <span className="bg-blue-50 text-secondary border border-blue-100 text-3xs font-black uppercase px-2.5 py-1 rounded-lg">
                      Vietnamese Meaning
                    </span>
                  </div>

                  <div className="text-center space-y-4 w-full">
                    <h3 className="text-2xl font-black text-primary">{currentWord.meaning}</h3>
                    
                    <div className="space-y-2 max-w-md mx-auto">
                      <p className="text-xs text-gray-500 leading-relaxed">
                        <strong className="text-gray-700 block">Định nghĩa:</strong> {currentWord.definition}
                      </p>
                      <div className="text-xs text-gray-600 leading-relaxed bg-white/60 backdrop-blur-sm p-3 rounded-2xl border border-gray-100">
                        <strong className="text-primary block text-3xs font-extrabold uppercase tracking-wider mb-1">Ví dụ:</strong>
                        "{currentWord.example}"
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-xs text-gray-400 font-bold tracking-wider uppercase">
                    Click vào thẻ để quay lại mặt trước
                  </div>
                </div>
              </div>
            </div>

            {/* Swipe/Button Actions */}
            <div className="flex justify-center items-center gap-6">
              <button
                onClick={handleForget}
                className="w-14 h-14 rounded-full bg-white text-red-500 hover:bg-red-50 border border-gray-150 flex items-center justify-center shadow-soft hover:shadow-hover transition-all transform active:scale-95 cursor-pointer"
                title="Chưa thuộc (Học lại sau)"
              >
                <X className="w-6 h-6" />
              </button>

              <button
                onClick={speakWord}
                className="w-12 h-12 rounded-full bg-secondary/10 text-secondary hover:bg-secondary/20 flex items-center justify-center transition-all transform active:scale-95 cursor-pointer"
                title="Phát âm"
              >
                <Volume2 className="w-5 h-5" />
              </button>

              <button
                onClick={handleRemember}
                className="w-14 h-14 rounded-full bg-primary text-white hover:opacity-95 flex items-center justify-center shadow-lg shadow-pink-200 transition-all transform active:scale-95 cursor-pointer"
                title="Đã thuộc từ này!"
              >
                <Check className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
