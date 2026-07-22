"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Loader2, Award, Check, X, Sparkles, RefreshCw, Video, VideoOff, Upload, BookOpen, Flame, Clock } from "lucide-react";
import useSWR from "swr";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/apiConfig";
import { buildAuthHeaders } from "@/lib/authHeaders";

interface Correction {
  original: string;
  corrected: string;
  explanation: string;
}

interface Evaluation {
  feedback: string;
  corrections: Correction[];
}

function unwrapData<T>(body: any): T {
  return body?.data ?? body;
}

export default function StudentSpeakingPage() {
  const { token, user } = useAuth();
  
  // Trình tự giao diện: SETUP (Cấu hình) hoặc TALKING (Đang đàm thoại)
  const [step, setStep] = useState<"SETUP" | "TALKING">("SETUP");
  const [chatState, setChatState] = useState<"CONNECTING" | "LISTENING" | "THINKING" | "SPEAKING" | "ENDED">("CONNECTING");
  const [transcripts, setTranscripts] = useState<Array<{ role: "user" | "ai"; text: string }>>([]);
  const [currentAiText, setCurrentAiText] = useState("");
  const [userTranscript, setUserTranscript] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

  // Cấu hình chủ đề & Camera
  const [customTopic, setCustomTopic] = useState("");
  const [useCamera, setUseCamera] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Refs cho Camera & Debouncer
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const accumulatedTextRef = useRef("");
  const sendTimeoutRef = useRef<any>(null);

  const courseId = "00000000-0000-0000-0000-000000000000";
  const lessonId = "00000000-0000-0000-0000-000000000000";

  // Tải lịch sử nhận xét
  const { data: pastEvaluations = [], mutate: reloadHistory } = useSWR<any[]>(
    token ? [`${API_BASE_URL}/api/learning/speaking/evaluations/lessons/${lessonId}`, token] as const : null,
    async ([url, currentToken]: readonly [string, string]) => {
      const res = await fetch(url, { headers: buildAuthHeaders(currentToken) });
      if (!res.ok) return [];
      const body = await res.json();
      const list = unwrapData<any[]>(body) || [];
      return list.map((item) => ({
        ...item,
        parsedFeedback: JSON.parse(item.feedback || "{}") as Evaluation,
      }));
    },
    { revalidateOnFocus: false }
  );

  // Quản lý Bật/Tắt Camera
  useEffect(() => {
    if (useCamera && step === "TALKING") {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Lỗi mở camera:", err);
          setUseCamera(false);
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [useCamera, step]);

  // Khởi tạo Web Speech API cho STT
  useEffect(() => {
    if (typeof window !== "undefined" && step === "TALKING") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          console.log("[STT] Đang lắng nghe...");
        };

        recognition.onresult = (event: any) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              transcript += event.results[i][0].transcript + " ";
            }
          }

          if (transcript.trim()) {
            const updatedText = (accumulatedTextRef.current + " " + transcript.trim()).trim();
            accumulatedTextRef.current = updatedText;
            setUserTranscript(updatedText);
            
            // Đợi 5.5 giây im lặng để gửi
            if (sendTimeoutRef.current) clearTimeout(sendTimeoutRef.current);
            sendTimeoutRef.current = setTimeout(() => {
              const textToSend = accumulatedTextRef.current.trim();
              if (textToSend && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                setChatState("THINKING");
                setTranscripts((prev) => [...prev, { role: "user", text: textToSend }]);
                
                socketRef.current.send(JSON.stringify({
                  type: "USER_SPEECH",
                  text: textToSend
                }));
                
                accumulatedTextRef.current = "";
                setUserTranscript("");
                
                try {
                  recognition.stop();
                } catch (e) {}
              }
            }, 5500);
          }
        };

        recognition.onerror = (err: any) => {
          if (err.error === "no-speech" || err.error === "aborted") {
            console.log(`[STT] Dừng lắng nghe (${err.error}).`);
          } else {
            console.error("[STT] Lỗi ghi âm (mã lỗi):", err.error || err);
          }
        };

        recognition.onend = () => {
          console.log("[STT] Kết thúc lắng nghe.");
          if (chatState === "LISTENING" && !isMuted) {
            try {
              recognitionRef.current?.start();
            } catch (e) {}
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, [chatState, isMuted, step]);

  // Kết nối WebSocket & bắt đầu hội thoại
  const startConversation = (overrideTopic?: string) => {
    setStep("TALKING");
    setChatState("CONNECTING");
    setTranscripts([]);
    setEvaluation(null);
    setCurrentAiText("");
    setUserTranscript("");

    const topicToUse = typeof overrideTopic === "string" ? overrideTopic : customTopic;
    const encodedTopic = encodeURIComponent((topicToUse || "").trim());
    const wsUrl = `ws://localhost:7777/api/ai/speaking/ws?studentId=${user?.id}&courseId=${courseId}&lessonId=${lessonId}&topicContent=${encodedTopic}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("[WS] Kết nối thành công.");
      setChatState("SPEAKING");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "AI_RESPONSE") {
        setChatState("SPEAKING");
        setCurrentAiText(data.text);
        setTranscripts((prev) => [...prev, { role: "ai", text: data.text }]);

        if (data.audio) {
          const audio = new Audio("data:audio/mp3;base64," + data.audio);
          audioRef.current = audio;
          audio.play().catch(e => console.error("Lỗi phát âm thanh:", e));
          
          audio.onended = () => {
            setChatState("LISTENING");
            if (!isMuted) {
              try { recognitionRef.current?.start(); } catch (e) {}
            }
          };
        } else {
          setChatState("LISTENING");
          if (!isMuted) {
            try { recognitionRef.current?.start(); } catch (e) {}
          }
        }
      } else if (data.type === "EVALUATION") {
        setChatState("ENDED");
        setEvaluation(data.evaluation);
        reloadHistory();
      }
    };

    ws.onclose = () => {
      console.log("[WS] Đóng kết nối.");
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomTopic(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleEndCall = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      setChatState("THINKING");
      socketRef.current.send(JSON.stringify({ type: "END_CALL" }));
    } else {
      setStep("SETUP");
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (chatState === "LISTENING") {
        try { recognitionRef.current?.start(); } catch (e) {}
      }
    } else {
      setIsMuted(true);
      try { recognitionRef.current?.stop(); } catch (e) {}
    }
  };

  const handleLaunchPractice = (promptText: string) => {
    setCustomTopic(promptText);
    startConversation(promptText);
  };

  const SUGGESTED_TOPICS = [
    { title: "Job Interview Practice", desc: "Phỏng vấn thử vị trí Software Engineer bằng Tiếng Anh.", prompt: "Chủ đề: Phỏng vấn xin việc (Job Interview) cho vị trí lập trình viên/nhân viên công nghệ. Hãy hỏi các câu hỏi chuyên môn và tình huống." },
    { title: "Daily Conversation", desc: "Tán gẫu tự do về sở thích, thời tiết và cuộc sống hàng ngày.", prompt: "Chủ đề: Tán gẫu tự do (Daily Casual Talk). Hỏi về sở thích, âm nhạc, đồ ăn và chia sẻ cuộc sống một cách vui vẻ." },
    { title: "Travel & Culture", desc: "Luyện nói về trải nghiệm du lịch, ẩm thực và văn hóa thế giới.", prompt: "Chủ đề: Du lịch và ẩm thực (Travel & Food). Hỏi học viên về quốc gia họ muốn đi và món ăn họ thích nhất." },
    { title: "IELTS Speaking Part 1", desc: "Thử sức với các bộ câu hỏi IELTS Speaking quen thuộc.", prompt: "Chủ đề: IELTS Speaking Part 1. Hỏi các chủ đề ngắn như Hometown, Accommodation, Work or Study." },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 h-[calc(100vh-80px)] flex flex-col justify-between">
      
      {/* 1. MÀN HÌNH THIẾT LẬP (SETUP SCREEN) */}
      {step === "SETUP" ? (
        <div className="flex-1 flex flex-col justify-between space-y-8 overflow-y-auto">
          {/* Banner giới thiệu */}
          <div className="relative bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 rounded-3xl p-8 text-white overflow-hidden shadow-md shrink-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
            <div className="relative space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                AI Native Speaking Room
              </div>
              <h1 className="text-2xl font-black tracking-tight leading-tight md:text-3xl">
                Luyện nói phản xạ Tiếng Anh cùng Trợ lý ảo
              </h1>
              <p className="text-xs font-semibold text-slate-200 leading-relaxed">
                Trò chuyện tự nhiên 1-1 với trợ lý AI bản xứ. Nhận diện giọng nói ngay tức thì, hỗ trợ bật camera quan sát khẩu hình miệng và nhận phân tích lỗi sai chi tiết sau mỗi phiên.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
            {/* Cột cấu hình */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="space-y-1 border-b border-gray-100 pb-4">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                    <Mic className="w-5 h-5 text-purple-600" />
                    Thiết lập phòng nói & chủ đề
                  </h3>
                  <p className="text-3xs text-gray-400 font-bold">Hãy cấu hình webcam và dán tệp/nhập chủ đề bạn muốn luyện tập.</p>
                </div>

                {/* Webcam toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <Video className="w-4 h-4 text-purple-600" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Tự quan sát khẩu hình miệng</h4>
                      <p className="text-4xs text-gray-400 font-bold">Bật camera máy tính để đối chiếu cơ miệng khi nói.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCamera}
                      onChange={(e) => setUseCamera(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {/* File/Topic text uploader */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-extrabold text-gray-600">Chủ đề hoặc tài liệu muốn luyện tập:</label>
                    <label className="flex items-center gap-1 text-[10px] font-black text-purple-600 hover:text-purple-700 cursor-pointer bg-purple-50 px-2 py-1 rounded-lg">
                      <Upload className="w-3 h-3" />
                      <span>Nạp tệp chủ đề (.txt)</span>
                      <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                  <textarea
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Ví dụ: Phỏng vấn xin việc (Job Interview), Trò chuyện về du lịch (Traveling)... hoặc dán văn bản từ vựng."
                    className="w-full h-28 p-4 text-xs border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium resize-none bg-slate-50/50"
                  />
                </div>

                <button
                  onClick={() => startConversation()}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black rounded-xl shadow-lg transition-transform hover:scale-[1.01]"
                >
                  Bắt đầu gọi thoại với AI
                </button>
              </div>

              {/* Các chủ đề gợi ý */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  Chủ đề gợi ý sẵn có
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SUGGESTED_TOPICS.map((topic, i) => (
                    <div
                      key={i}
                      onClick={() => handleLaunchPractice(topic.prompt)}
                      className="bg-white border border-gray-100 hover:border-purple-200 rounded-3xl p-5 shadow-2xs cursor-pointer transition-all hover:shadow-sm flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-1">
                        <h4 className="text-xs font-extrabold text-slate-800">{topic.title}</h4>
                        <p className="text-3xs text-gray-400 font-medium leading-relaxed">{topic.desc}</p>
                      </div>
                      <span className="text-[10px] font-black text-purple-600 flex items-center gap-1 self-start">
                        Luyện nói ngay &rarr;
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cột phụ (Mẹo và lịch sử) */}
            <div className="space-y-6">
              <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm border-b border-slate-800 pb-3 flex items-center gap-1.5">
                  <Flame className="w-5 h-5 text-amber-500" />
                  Mẹo luyện nói hiệu quả
                </h3>
                <ul className="space-y-3 text-3xs font-semibold text-slate-300 leading-normal list-disc pl-4">
                  <li>Nói tự nhiên, thoải mái như đang tán gẫu với một người bạn nước ngoài.</li>
                  <li>Sử dụng tai nghe để có âm thanh tốt nhất và tránh việc micro thu lại tiếng vọng của loa máy tính.</li>
                  <li>Bật camera để nhìn khuôn miệng của mình và sửa lỗi phát âm trực tiếp.</li>
                  <li>AI sẽ tự nhận diện câu nói và cung cấp đánh giá sửa lỗi chi tiết khi cuộc gọi kết thúc.</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                  <Clock className="w-5 h-5 text-purple-600" />
                  Lịch sử gần đây
                </h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {pastEvaluations.length === 0 ? (
                    <p className="text-xs font-bold text-gray-400 text-center py-6">
                      Chưa có lịch sử cuộc gọi nào gần đây.
                    </p>
                  ) : (
                    pastEvaluations.map((item, idx) => (
                      <div key={item.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1.5">
                        <div className="flex justify-between text-4xs font-bold text-gray-400">
                          <span>Lần gọi #{pastEvaluations.length - idx}</span>
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-4xs text-slate-600 font-semibold line-clamp-2">{item.parsedFeedback?.feedback}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        
        /* 2. MÀN HÌNH ĐÀM THOẠI TOÀN TRANG (TALKING SCREEN) */
        <div className="flex-1 bg-slate-950 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[78vh]">
          
          {/* VÙNG ĐÀM THOẠI TRÁI (2/3 chiều rộng) */}
          <div className="flex-1 flex flex-col justify-between p-8 text-white relative bg-slate-900">
            
            {/* Header trạng thái */}
            <div className="flex justify-between items-center z-20">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  {chatState !== "ENDED" && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${chatState === "ENDED" ? "bg-red-500" : "bg-emerald-500"}`}></span>
                </span>
                <span className="text-xs font-black tracking-wider uppercase text-slate-400">
                  {chatState === "CONNECTING" && "Đang kết nối..."}
                  {chatState === "SPEAKING" && "AI đang nói"}
                  {chatState === "LISTENING" && "Đang lắng nghe bạn..."}
                  {chatState === "THINKING" && "AI đang phân tích..."}
                  {chatState === "ENDED" && "Đã kết thúc"}
                </span>
              </div>
              <button
                onClick={() => setStep("SETUP")}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs rounded-xl transition-all"
              >
                Quay lại
              </button>
            </div>

            {/* Body: Voice Avatar and Webcam Video in a clean side-by-side grid */}
            <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 my-6 z-20 min-h-[300px] w-full px-6">
              
              {/* CỘT 1: AI Avatar */}
              <div className="flex-grow flex flex-col items-center justify-center text-center">
                {/* Vòng tròn đập loa của AI/User */}
                <div className="relative flex items-center justify-center">
                  {chatState === "SPEAKING" && (
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping scale-150 duration-1000"></div>
                  )}
                  {chatState === "LISTENING" && (
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-pulse scale-125"></div>
                  )}
                  
                  <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-xl ${
                    chatState === "SPEAKING" ? "bg-gradient-to-tr from-blue-600 to-indigo-600" :
                    chatState === "LISTENING" ? "bg-gradient-to-tr from-emerald-600 to-teal-600" :
                    chatState === "THINKING" ? "bg-gradient-to-tr from-purple-600 to-pink-600" :
                    "bg-slate-700"
                  }`}>
                    {chatState === "THINKING" ? (
                      <Loader2 className="w-14 h-14 text-white animate-spin" />
                    ) : (
                      <Sparkles className="w-14 h-14 text-white" />
                    )}
                  </div>
                </div>
              </div>

              {/* CỘT 2: Webcam view - Kích thước lớn, hoàn toàn tách biệt bên phải */}
              {useCamera && (
                <div className="w-64 h-48 md:w-80 md:h-60 rounded-3xl overflow-hidden border-2 border-slate-700 bg-black shadow-2xl shrink-0 relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                  <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[8px] font-black uppercase text-slate-300">
                    Camera (Your Mouth)
                  </div>
                </div>
              )}
            </div>

            {/* PHẦN DƯỚI: Hộp văn bản phụ đề (Google Meet Style) - Không bao giờ chồng đè lên camera */}
            <div className="w-full max-w-2xl mx-auto px-6 z-20 pb-4 shrink-0">
              <div className="min-h-[72px] flex items-center justify-center">
                {chatState === "LISTENING" && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 px-5 py-3 rounded-2xl w-full text-center">
                    <p className="text-[10px] font-black text-emerald-400 mb-1 uppercase tracking-wider">Bạn đang nói:</p>
                    <p className="text-sm font-bold text-white italic">
                      "{userTranscript || "Hãy nói câu gì đó bằng Tiếng Anh..."}"
                    </p>
                  </div>
                )}
                {chatState === "SPEAKING" && (
                  <div className="bg-blue-500/10 border border-blue-500/20 px-5 py-3 rounded-2xl w-full text-center">
                    <p className="text-[10px] font-black text-blue-400 mb-1 uppercase tracking-wider">AI phản hồi:</p>
                    <p className="text-sm font-bold text-white">
                      {currentAiText}
                    </p>
                  </div>
                )}
                {chatState === "ENDED" && (
                  <p className="text-sm font-extrabold text-red-400 text-center w-full">
                    Cuộc trò chuyện đã gác máy. Hãy xem kết quả nhận xét sửa lỗi sai bên phải.
                  </p>
                )}
              </div>
            </div>

            {/* Bảng điều khiển đàm thoại */}
            <div className="flex justify-center items-center gap-6 pt-4 border-t border-slate-800 z-20">
              {chatState !== "ENDED" && (
                <>
                  {/* Nút bật/tắt camera trực tiếp khi đang gọi */}
                  <button
                    onClick={() => setUseCamera(!useCamera)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      useCamera ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-400"
                    }`}
                    title={useCamera ? "Tắt Camera" : "Bật Camera"}
                  >
                    {useCamera ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={toggleMute}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isMuted ? "bg-red-500 hover:bg-red-600 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    }`}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  
                  <button
                    onClick={handleEndCall}
                    className="w-14 h-14 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 cursor-pointer"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                </>
              )}
              {chatState === "ENDED" && (
                <button
                  onClick={() => startConversation()}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  Bắt đầu cuộc gọi mới
                </button>
              )}
            </div>
          </div>

          {/* VÙNG NHẬN XÉT PHẢI (1/3 chiều rộng) */}
          <div className="w-full md:w-[380px] flex flex-col h-full bg-slate-50 border-t md:border-t-0 md:border-l border-slate-800">
            
            <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-1.5 shrink-0">
              {chatState === "ENDED" ? (
                <>
                  <Award className="w-5 h-5 text-purple-600" />
                  <h3 className="font-extrabold text-sm text-slate-800">Bảng Sửa Lỗi Chi Tiết</h3>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
                  <h3 className="font-extrabold text-sm text-slate-800">Hội Thoại Trực Tiếp</h3>
                </>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* Tin nhắn hội thoại trực tiếp */}
              {chatState !== "ENDED" && chatState !== "THINKING" && (
                <div className="space-y-3">
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {transcripts.length === 0 ? (
                      <p className="text-xs text-gray-400 font-bold text-center py-12">
                        Bắt đầu cuộc gọi. AI đang chuẩn bị mở lời...
                      </p>
                    ) : (
                      transcripts.map((msg, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-3xs border ${
                            msg.role === "user"
                              ? "bg-purple-100 text-purple-950 border-purple-200/50 ml-6"
                              : "bg-white text-slate-900 border-slate-100 mr-6"
                          }`}
                        >
                          <span className="font-black block text-[9px] uppercase tracking-wider mb-1 text-slate-400">
                            {msg.role === "user" ? "You (Học viên)" : "AI Friend"}
                          </span>
                          {msg.text}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Chờ chấm điểm */}
              {chatState === "THINKING" && transcripts.length > 0 && (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                  <p className="text-xs font-black text-purple-800 animate-pulse text-center">
                    AI đang phân tích các câu nói của bạn...
                  </p>
                </div>
              )}

              {/* Bảng lỗi chi tiết khi đã gác máy */}
              {evaluation && chatState === "ENDED" && (
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
                    <h4 className="text-xs font-black text-purple-800 mb-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Đánh giá tổng quan
                    </h4>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      {evaluation.feedback}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Lỗi phát âm / ngữ pháp đã nói:</h4>
                    
                    {evaluation.corrections.length === 0 ? (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-xs font-bold text-emerald-800">Rất tốt!</h5>
                          <p className="text-3xs text-emerald-700 font-semibold mt-0.5">Không phát hiện lỗi diễn đạt nào.</p>
                        </div>
                      </div>
                    ) : (
                      evaluation.corrections.map((item, index) => (
                        <div key={index} className="bg-white border border-gray-100 rounded-2xl p-3.5 space-y-2.5 shadow-sm">
                          <div className="flex items-start gap-2 text-xs">
                            <span className="w-4 h-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">X</span>
                            <p className="font-semibold text-slate-600 line-through">{item.original}</p>
                          </div>
                          <div className="flex items-start gap-2 text-xs border-t border-dashed border-gray-100 pt-2">
                            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">✓</span>
                            <p className="font-bold text-slate-800">{item.corrected}</p>
                          </div>
                          <p className="text-3xs text-gray-500 font-bold bg-slate-50 p-2 rounded-lg leading-normal">
                            💡 {item.explanation}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Lịch sử luyện tập */}
              {!evaluation && chatState === "ENDED" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Lịch sử luyện tập bài này:</h4>
                  {pastEvaluations.length === 0 ? (
                    <p className="text-xs font-bold text-gray-400 text-center py-8">Chưa có lịch sử cuộc gọi nào.</p>
                  ) : (
                    pastEvaluations.map((item, idx) => (
                      <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-sm space-y-2">
                        <div className="flex justify-between items-center text-3xs font-extrabold text-slate-400">
                          <span>Lần gọi #{pastEvaluations.length - idx}</span>
                          <span>{new Date(item.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-3xs text-slate-600 font-semibold line-clamp-3">
                          {item.parsedFeedback?.feedback}
                        </p>
                        {item.parsedFeedback?.corrections && item.parsedFeedback.corrections.length > 0 && (
                          <p className="text-3xs font-bold text-red-500">
                            ⚠️ Phát hiện {item.parsedFeedback.corrections.length} lỗi diễn đạt.
                          </p>
                        )}
                        <button
                          onClick={() => {
                            setEvaluation(item.parsedFeedback);
                          }}
                          className="text-[10px] font-extrabold text-purple-600 hover:underline pt-1 block"
                        >
                          Xem chi tiết lỗi sai
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
