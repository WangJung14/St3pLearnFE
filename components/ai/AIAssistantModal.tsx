"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Send, Brain, Bot, Trash2, X, Minimize2, Maximize2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/apiConfig";
import { useAuth } from "@/context/AuthContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIAssistantModalProps {
  courseId: string;
  disabled?: boolean; // Nếu true (đang thi), ẩn bong bóng chat
}

export default function AIAssistantModal({ courseId, disabled = false }: AIAssistantModalProps) {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, isMinimized]);

  // Nếu bị vô hiệu hóa (ví dụ: đang làm bài thi), ẩn luôn
  if (disabled) {
    return null;
  }

  const handleClearHistory = () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện này?")) {
      setMessages([]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isGenerating) return;

    const userText = inputMessage.trim();
    setInputMessage("");

    // 1. Lưu câu hỏi của User vào UI
    const updatedMessages: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(updatedMessages);
    
    // 2. Thêm chỗ trống cho câu trả lời của AI sắp stream về
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    setIsGenerating(true);

    let accumulatedAnswer = "";

    try {
      // 3. Gọi API Streaming
      const response = await fetch(`${API_BASE_URL}/api/ai/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          course_id: courseId,
          question: userText,
          // Gửi kèm lịch sử hội thoại trước đó (loại bỏ tin nhắn trống cuối cùng vừa tạo)
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`HTTP ${response.status} - ${errText || response.statusText}`);
      }

      if (!response.body) {
        throw new Error("Dữ liệu trả về không hỗ trợ stream.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      // 4. Đọc luồng dữ liệu SSE trả về thời gian thực
      while (true) {
        const { value, done } = await reader.read();
        if (done && !buffer) break;

        if (value) {
          buffer += decoder.decode(value, { stream: !done });
        }

        const lines = buffer.split("\n");
        // Giữ lại phần dòng chưa hoàn thiện ở cuối vào buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            try {
              const rawData = JSON.parse(trimmed.substring(6));
              const token = rawData.text;
              if (token) {
                accumulatedAnswer += token;
                // Cập nhật liên tục tin nhắn cuối cùng (assistant)
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  if (newMsgs.length > 0) {
                    newMsgs[newMsgs.length - 1] = {
                      role: "assistant",
                      content: accumulatedAnswer,
                    };
                  }
                  return newMsgs;
                });
              }
            } catch (err) {
              // Bỏ qua lỗi parsing khi gặp chunk dở dang
            }
          }
        }

        if (done) break;
      }
    } catch (err: unknown) {
      // Nếu đã tích lũy được câu trả lời từ AI, ta bỏ qua lỗi ngắt kết nối/đóng luồng ở cuối (ví dụ: Failed to fetch)
      if (accumulatedAnswer.trim()) {
        console.warn("Stream kết thúc hoặc bị ngắt ở EOF:", err);
        return;
      }

      const errMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.";
      setMessages((prev) => {
        const newMsgs = [...prev];
        if (newMsgs.length > 0) {
          newMsgs[newMsgs.length - 1] = {
            role: "assistant",
            content: `❌ Lỗi: ${errMsg}`,
          };
        }
        return newMsgs;
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end font-sans">
      {/* 1. BONG BÓNG CHAT BẰNG GLASSMORPHISM */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-200 transition-all hover:scale-110 active:scale-95 animate-pulse"
          title="Hỏi Trợ lý AI"
        >
          <Brain className="h-6 w-6" />
        </button>
      )}

      {/* 2. KHUNG CHAT CHI TIẾT */}
      {isOpen && (
        <div
          className={`flex w-[380px] sm:w-[400px] flex-col border border-purple-100/50 bg-white/95 backdrop-blur-md shadow-2xl transition-all duration-300 ${
            isMinimized ? "h-14 rounded-full" : "h-[500px] rounded-3xl"
          } overflow-hidden`}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-purple-600/90 to-pink-500/90 px-5 py-3.5 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 animate-bounce" />
              <div>
                <h4 className="text-xs font-black tracking-wide">Gia Sư Ảo AI</h4>
                {!isMinimized && (
                  <p className="text-[9px] font-bold opacity-80 uppercase tracking-wider">Hỗ trợ học tập 24/7</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              {!isMinimized && messages.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="rounded-lg p-1 hover:bg-white/10 text-white transition-colors cursor-pointer"
                  title="Xóa lịch sử"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="rounded-lg p-1 hover:bg-white/10 text-white transition-colors cursor-pointer"
                title={isMinimized ? "Phóng to" : "Thu nhỏ"}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 hover:bg-white/10 text-white transition-colors cursor-pointer"
                title="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body tin nhắn */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-3 px-6">
                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center border border-purple-100">
                      <Sparkles className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-black text-gray-800">Xin chào học viên!</p>
                      <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
                        Tôi là Gia sư ảo của khóa học này. Bạn có câu hỏi hay phần kiến thức nào chưa vững trong tài liệu học tập không? Hãy đặt câu hỏi cho tôi nhé!
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex gap-2.5 max-w-[85%] ${
                        msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                      }`}
                    >
                      {msg.role === "assistant" && (
                        <div className="h-7 w-7 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4 text-purple-600" />
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-xs font-bold leading-relaxed ${
                          msg.role === "user"
                            ? "bg-purple-600 text-white rounded-tr-none shadow-md shadow-purple-100"
                            : "bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-sm whitespace-pre-wrap"
                        }`}
                      >
                        {msg.content === "" && isGenerating && index === messages.length - 1 ? (
                          <span className="flex gap-1 items-center py-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-purple-600 animate-bounce delay-75"></span>
                            <span className="h-1.5 w-1.5 rounded-full bg-purple-600 animate-bounce delay-150"></span>
                            <span className="h-1.5 w-1.5 rounded-full bg-purple-600 animate-bounce delay-300"></span>
                          </span>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Form Input nhập tin nhắn */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                <input
                  type="text"
                  placeholder="Hỏi gia sư ảo về tài liệu khóa học..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={isGenerating}
                  className="flex-1 px-4 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-bold bg-gray-50/50"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isGenerating}
                  className="p-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md shadow-purple-100 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
