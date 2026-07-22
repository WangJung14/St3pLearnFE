"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Loader2, Award, Check, X, Sparkles, RefreshCw, Video, VideoOff, Upload } from "lucide-react";
import useSWR from "swr";
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

interface SpeakingRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  lessonId: string;
  studentId: string;
  token: string | null;
  initialTopic?: string;
  initialCameraOn?: boolean;
}

function unwrapData<T>(body: any): T {
  return body?.data ?? body;
}

export default function SpeakingRoomModal({
  isOpen,
  onClose,
  courseId,
  lessonId,
  studentId,
  token,
  initialTopic = "",
  initialCameraOn = false,
}: SpeakingRoomModalProps) {
  // Trình tự giao diện: SETUP (Cấu hình) hoặc TALKING (Đang đàm thoại)
  const [step, setStep] = useState<"SETUP" | "TALKING">("SETUP");
  const [chatState, setChatState] = useState<"CONNECTING" | "LISTENING" | "THINKING" | "SPEAKING" | "ENDED">("CONNECTING");
  const [transcripts, setTranscripts] = useState<Array<{ role: "user" | "ai"; text: string }>>([]);
  const [currentAiText, setCurrentAiText] = useState("");
  const [userTranscript, setUserTranscript] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  
  // Tùy chỉnh chủ đề & Camera
  const [topicContent, setTopicContent] = useState(initialTopic);
  const [isCameraOn, setIsCameraOn] = useState(initialCameraOn);
  const [isMuted, setIsMuted] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  
  // Refs cho Camera
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const accumulatedTextRef = useRef("");
  const sendTimeoutRef = useRef<any>(null);

  // Tải lịch sử nhận xét
  const { data: pastEvaluations = [], mutate: reloadHistory } = useSWR<any[]>(
    isOpen && token ? [`${API_BASE_URL}/api/learning/speaking/evaluations/lessons/${lessonId}`, token] as const : null,
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
    if (isCameraOn && step === "TALKING" && isOpen) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Lỗi mở camera:", err);
          setIsCameraOn(false);
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
  }, [isCameraOn, step, isOpen]);

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
            
            // Reset bộ đệm thời gian im lặng (4 giây) trước khi gửi
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
                
                // Reset bộ đệm
                accumulatedTextRef.current = "";
                setUserTranscript("");
                
                // Dừng nhận diện để đợi AI nói
                try {
                  recognition.stop();
                } catch (e) {}
              }
            }, 5500); // 5.5 giây không nói gì thì gửi đi
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
            } catch (e) {
              // Bỏ qua lỗi nếu đang ghi âm
            }
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, [chatState, isMuted, step]);

  // Kết nối cuộc trò chuyện khi bắt đầu đàm thoại
  const startConversation = () => {
    setStep("TALKING");
    setChatState("CONNECTING");
    setTranscripts([]);
    setEvaluation(null);
    setCurrentAiText("");
    setUserTranscript("");

    const encodedTopic = encodeURIComponent(topicContent.trim());
    const wsUrl = `ws://localhost:7777/api/ai/speaking/ws?studentId=${studentId}&courseId=${courseId}&lessonId=${lessonId}&topicContent=${encodedTopic}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("[WS] Kết nối đàm thoại.");
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
          audio.play().catch(e => console.error("Lỗi phát loa:", e));
          
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
      console.log("[WS] Ngắt kết nối.");
    };
  };

  // Đọc file Text khi người dùng tải lên
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setTopicContent(event.target.result as string);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] max-h-[750px]">
        
        {/* NẾU ĐANG Ở BƯỚC THIẾT LẬP (SETUP SCREEN) */}
        {step === "SETUP" ? (
          <div className="flex-1 flex flex-col justify-between p-8 bg-slate-50 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
                    AI Speaking Room - Thiết lập cuộc trò chuyện
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">Bật camera tự điều chỉnh khẩu hình và chọn chủ đề đàm thoại của bạn.</p>
                </div>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 font-extrabold text-sm">
                  Đóng
                </button>
              </div>

              {/* Lựa chọn Camera */}
              <div className="bg-white border border-gray-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isCameraOn ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-400"}`}>
                    {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Bật Camera tự quan sát khẩu hình</h4>
                    <p className="text-3xs text-gray-400 font-semibold">Bật webcam của bạn để tự tin hơn và quan sát cơ miệng khi phát âm.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCameraOn}
                    onChange={(e) => setIsCameraOn(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* Nạp tài liệu & chủ đề */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-extrabold text-slate-700">Chủ đề hoặc tài liệu muốn luyện nói:</label>
                  <label className="flex items-center gap-1 text-[10px] font-black text-purple-600 hover:text-purple-700 cursor-pointer bg-purple-50 px-2 py-1 rounded-lg">
                    <Upload className="w-3 h-3" />
                    <span>Nạp tệp chủ đề (.txt)</span>
                    <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
                
                <textarea
                  value={topicContent}
                  onChange={(e) => setTopicContent(e.target.value)}
                  placeholder="Ví dụ: Phỏng vấn xin việc (Job Interview), Trò chuyện về du lịch (Traveling), hoặc dán tài liệu từ vựng bạn muốn áp dụng..."
                  className="w-full h-32 px-4 py-3 text-xs border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white font-medium resize-none"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={startConversation}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs rounded-xl shadow-md transition-all hover:opacity-95"
              >
                Bắt đầu đàm thoại AI
              </button>
            </div>
          </div>
        ) : (
          /* NẾU ĐANG Ở BƯỚC ĐÀM THOẠI (TALKING SCREEN) */
          <div className="flex-1 flex flex-col justify-between p-6 bg-slate-900 text-white relative">
            
            {/* Header */}
            <div className="flex justify-between items-center z-20">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  {chatState !== "ENDED" && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${chatState === "ENDED" ? "bg-red-500" : "bg-emerald-500"}`}></span>
                </span>
                <span className="text-xs font-black tracking-wider uppercase text-slate-400">
                  {chatState === "CONNECTING" && "Đang kết nối..."}
                  {chatState === "SPEAKING" && "AI đang nói"}
                  {chatState === "LISTENING" && "Đang lắng nghe..."}
                  {chatState === "THINKING" && "Đang phân tích..."}
                  {chatState === "ENDED" && "Đã kết thúc"}
                </span>
              </div>
              <button onClick={() => setStep("SETUP")} className="text-slate-400 hover:text-white font-bold text-xs p-1">
                Quay lại
              </button>
            </div>

            {/* Body: Voice Avatar, Webcam Video, and Wave */}
            <div className="flex-1 flex flex-col items-center justify-center my-6 space-y-6 relative min-h-[300px]">
              
              {/* KHU VỰC LIVE CAMERA TỰ QUAN SÁT KHẨU HÌNH */}
              {isCameraOn && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-64 h-48 md:w-80 md:h-60 rounded-3xl object-cover border-2 border-slate-700 absolute bottom-2 right-2 z-10 shadow-xl bg-black"
                />
              )}

              <div className="relative flex items-center justify-center">
                {chatState === "SPEAKING" && (
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping scale-150 duration-1000"></div>
                )}
                {chatState === "LISTENING" && (
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-pulse scale-125"></div>
                )}
                
                <div className={`w-28 h-28 rounded-full flex items-center justify-center transition-all shadow-lg ${
                  chatState === "SPEAKING" ? "bg-gradient-to-tr from-blue-600 to-indigo-600" :
                  chatState === "LISTENING" ? "bg-gradient-to-tr from-emerald-600 to-teal-600" :
                  chatState === "THINKING" ? "bg-gradient-to-tr from-purple-600 to-pink-600" :
                  "bg-slate-700"
                }`}>
                  {chatState === "THINKING" ? (
                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                  ) : (
                    <Sparkles className="w-12 h-12 text-white" />
                  )}
                </div>
              </div>

              {/* Text hội thoại hiển thị trực tiếp */}
              <div className="text-center max-w-sm px-4 z-20">
                {chatState === "LISTENING" && (
                  <p className="text-sm font-bold text-emerald-400 italic">
                    "{userTranscript || "Hãy nói câu gì đó bằng Tiếng Anh..."}"
                  </p>
                )}
                {chatState === "SPEAKING" && (
                  <p className="text-sm font-bold text-blue-200">
                    {currentAiText}
                  </p>
                )}
                {chatState === "ENDED" && (
                  <p className="text-sm font-extrabold text-red-400">
                    Cuộc gọi đã kết thúc. Xem nhận xét sửa lỗi bên phải.
                  </p>
                )}
              </div>
            </div>

            {/* Footer Điều khiển đàm thoại */}
            <div className="flex justify-center items-center gap-6 pt-4 border-t border-slate-800 z-20">
              {chatState !== "ENDED" && (
                <>
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
                    className="w-14 h-14 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                </>
              )}
              {chatState === "ENDED" && (
                <button
                  onClick={startConversation}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Bắt đầu cuộc gọi mới
                </button>
              )}
            </div>
          </div>
        )}

        {/* PANEL PHẢI: Lịch sử hội thoại / Bảng sửa lỗi chi tiết */}
        <div className="w-full md:w-[380px] border-t md:border-t-0 md:border-l border-gray-100 flex flex-col h-full bg-slate-50">
          
          <div className="p-4 bg-white border-b border-gray-100 flex items-center gap-1.5 shrink-0">
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
            {/* 1. NẾU ĐANG TRÒ CHUYỆN (CHƯA GÁC MÁY): HIỂN THỊ LOG TIN NHẮN TỨC THÌ */}
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

            {/* 2. NẾU ĐANG CHẤM ĐIỂM/PHÂN TÍCH */}
            {chatState === "THINKING" && transcripts.length > 0 && (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                <p className="text-xs font-black text-purple-800 animate-pulse text-center">
                  AI đang phân tích các câu nói của bạn...
                </p>
              </div>
            )}

            {/* 3. NẾU ĐÃ GÁC MÁY & CÓ KẾT QUẢ ĐÁNH GIÁ */}
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

            {/* 4. LỊCH SỬ LUYỆN TẬP GẦN ĐÂY */}
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
    </div>
  );
}
