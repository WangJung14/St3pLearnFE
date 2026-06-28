"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, ArrowLeft, Shield, Sparkles, MessageCircle, UserCheck } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";

interface ChatPartner {
  id: string;
  name: string;
  avatar: string;
  role: "STUDENT" | "TEACHER" | "MENTOR" | "ADMIN";
  bio: string;
  lastMessage: string;
  time: string;
  isOnline: boolean;
}

const INITIAL_PARTNERS: ChatPartner[] = [
  {
    id: "p1",
    name: "Teacher Tommy",
    avatar: "T",
    role: "TEACHER",
    bio: "Giảng viên IELTS 8.5, cựu chuyên gia ngôn ngữ học tại London. Rất vui được hỗ trợ bài viết của các em.",
    lastMessage: "Thầy vừa nhận xét xong bài luận IELTS Writing Task 2 của em trên hệ thống rồi nhé.",
    time: "10:30",
    isOnline: true
  },
  {
    id: "p2",
    name: "Mentor Alex",
    avatar: "A",
    role: "MENTOR",
    bio: "Cố vấn chuyên môn EduMastery, chuyên ngành sư phạm tiếng Anh. Đồng hành định hướng lộ trình học tối ưu.",
    lastMessage: "Em đã hoàn thành bài tập ngữ pháp Chương 1 chưa? Cố gắng giữ chuỗi nhé!",
    time: "Hôm qua",
    isOnline: true
  },
  {
    id: "p3",
    name: "IELTS 7.5+ Study Group",
    avatar: "G",
    role: "STUDENT",
    bio: "Phòng tự học và thảo luận nhóm dành cho các chiến binh IELTS Target 7.5+.",
    lastMessage: "Hôm nay ai rảnh 9h tối vào Discord luyện nói Speaking Part 2 không nhỉ?",
    time: "Thứ 2",
    isOnline: false
  }
];

export default function ChatPage() {
  const router = useRouter();
  
  const [partners] = useState<ChatPartner[]>(INITIAL_PARTNERS);
  const [selectedPartner, setSelectedPartner] = useState<ChatPartner>(INITIAL_PARTNERS[0]);
  const [messageText, setMessageText] = useState("");
  const [chatLogs, setChatLogs] = useState<Record<string, Array<{ sender: "me" | "them"; text: string; time: string }>>>({
    "p1": [
      { sender: "them", text: "Chào em, thầy thấy bài viết Task 2 của em tiến bộ rõ rệt về từ vựng.", time: "10:25" },
      { sender: "me", text: "Dạ em cảm ơn thầy nhiều ạ! Em vẫn hơi lo lắng về phần Cohesion.", time: "10:28" },
      { sender: "them", text: "Thầy vừa nhận xét xong bài luận IELTS Writing Task 2 của em trên hệ thống rồi nhé.", time: "10:30" }
    ],
    "p2": [
      { sender: "them", text: "Chào em, em đã xem lộ trình học tập thầy đề xuất tuần này chưa?", time: "Hôm qua" },
      { sender: "me", text: "Dạ em đang học chương ngữ pháp rồi ạ.", time: "Hôm qua" }
    ],
    "p3": [
      { sender: "them", text: "Mọi người làm xong đề Cam 18 Test 2 chưa?", time: "Thứ 2" }
    ]
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const partnerId = selectedPartner.id;
    const newMsg = { sender: "me" as const, text: messageText, time: "Vừa xong" };

    setChatLogs(prev => ({
      ...prev,
      [partnerId]: [...(prev[partnerId] || []), newMsg]
    }));

    setMessageText("");
  };

  const activeLogs = chatLogs[selectedPartner.id] || [];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <Header />

      {/* Центральная сетка: Header -> Left Sidebar -> Content Area -> Right Utility Panel */}
      <main className="max-w-7xl w-full mx-auto px-4 py-8 flex flex-col lg:flex-row gap-6 lg:gap-8 flex-grow overflow-visible lg:overflow-hidden lg:h-[calc(100vh-160px)]">
        
        {/* 1. Sidebar (Left column: Active chats list) */}
        <aside className="w-full lg:w-80 shrink-0 bg-white rounded-3xl p-4 border border-gray-100 shadow-soft flex flex-col max-h-[340px] lg:max-h-none lg:h-full overflow-y-auto">
          <div className="px-3 py-2 mb-4 border-b border-gray-50 pb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h3 className="font-extrabold text-gray-900 text-sm">Hộp thư tin nhắn</h3>
          </div>

          <div className="space-y-2 flex-1">
            {partners.map(partner => {
              const isSelected = selectedPartner.id === partner.id;
              return (
                <div
                  key={partner.id}
                  onClick={() => setSelectedPartner(partner)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 relative ${
                    isSelected
                      ? "border-primary bg-pink-50/40 shadow-sm"
                      : "border-transparent hover:bg-gray-50"
                  }`}
                >
                  {/* Avatar with online dot */}
                  <div className="relative shrink-0">
                    <Avatar fallback={partner.avatar} size="md" />
                    {partner.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white"></span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex justify-between items-center">
                      <h4 className="font-extrabold text-gray-900 text-xs truncate">{partner.name}</h4>
                      <span className="text-3xs text-gray-400 font-semibold">{partner.time}</span>
                    </div>
                    <p className="text-3xs text-gray-400 font-bold truncate leading-relaxed">
                      {partner.lastMessage}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* 2. Content Area (Middle column: Message Window) */}
        <section className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-soft flex flex-col min-h-[520px] lg:h-full overflow-hidden min-w-0">
          {/* Partner Header */}
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3 shrink-0">
            <Avatar fallback={selectedPartner.avatar} size="md" />
            <div className="min-w-0">
              <h4 className="font-extrabold text-gray-900 text-sm truncate">{selectedPartner.name}</h4>
              <div className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${selectedPartner.isOnline ? "bg-emerald-500" : "bg-gray-300"}`}></span>
                <span className="text-4xs text-gray-400 font-bold uppercase tracking-wider">
                  {selectedPartner.isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
                </span>
              </div>
            </div>
          </div>

          {/* Messages Log */}
          <div className="flex-grow p-6 overflow-y-auto bg-gray-50/30 space-y-4 flex flex-col">
            {activeLogs.length === 0 ? (
              <div className="my-auto text-center text-gray-400 space-y-2">
                <MessageCircle className="w-10 h-10 mx-auto text-gray-200" />
                <p className="text-xs font-bold">Hãy gửi câu hỏi học tập đầu tiên cho {selectedPartner.name}!</p>
              </div>
            ) : (
              activeLogs.map((msg, idx) => {
                const isMe = msg.sender === "me";
                return (
                  <div
                    key={idx}
                    className={`max-w-[75%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      isMe
                        ? "bg-primary text-white self-end rounded-tr-none shadow-sm shadow-pink-100"
                        : "bg-white text-gray-700 border border-gray-100 self-start rounded-tl-none shadow-soft"
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span className={`text-4xs block mt-1.5 text-right ${isMe ? "text-white/70" : "text-gray-400"}`}>
                      {msg.time}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Sender bar */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-50 shrink-0 flex gap-3 bg-white">
            <Input
              type="text"
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              placeholder="Nhập nội dung tin nhắn hướng dẫn..."
              className="bg-gray-50 border-gray-100 text-xs py-3"
            />
            <Button type="submit" className="px-6 shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </section>

        {/* 3. Right Utility Panel (Right column: Partner Profile Details) */}
        <aside className="w-72 shrink-0 bg-white rounded-3xl p-6 border border-gray-100 shadow-soft hidden xl:flex flex-col items-center text-center space-y-6 h-full overflow-y-auto">
          <Avatar fallback={selectedPartner.avatar} size="lg" className="w-20 h-20 text-2xl" />
          
          <div className="space-y-1.5">
            <h4 className="font-extrabold text-gray-900 text-sm leading-none">{selectedPartner.name}</h4>
            <Badge variant={selectedPartner.role === "TEACHER" ? "secondary" : selectedPartner.role === "MENTOR" ? "default" : "outline"}>
              {selectedPartner.role}
            </Badge>
          </div>

          <div className="w-full h-px bg-gray-50"></div>

          <div className="text-left w-full space-y-4">
            <div className="space-y-1">
              <span className="text-3xs font-extrabold text-gray-400 uppercase tracking-widest block">Giới thiệu</span>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                {selectedPartner.bio}
              </p>
            </div>

            <div className="bg-pink-50/30 p-4 rounded-2xl border border-pink-100/40 flex items-start gap-3">
              <UserCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-4xs text-gray-400 font-bold space-y-1 uppercase tracking-wider">
                <p className="text-primary font-black text-3xs">Xác thực chính chủ</p>
                <p>EduMastery Verified</p>
              </div>
            </div>
          </div>
        </aside>

      </main>

      <Footer />
    </div>
  );
}
