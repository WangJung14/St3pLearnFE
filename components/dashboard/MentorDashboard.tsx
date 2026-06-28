"use client";

import React, { useState } from "react";
import { Users, BookOpen, Clock, Award, MessageSquare, Send, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface Student {
  id: string;
  name: string;
  avatar: string;
  activeCourse: string;
  progress: number;
  streak: number;
  lastJournal: string;
  journalDate: string;
}

const MOCK_STUDENTS: Student[] = [
  {
    id: "std-1",
    name: "Bùi Gia Hân",
    avatar: "H",
    activeCourse: "IELTS Masterclass: Step-by-Step 7.5+",
    progress: 75,
    streak: 8,
    lastJournal: "Hôm nay em đã luyện tập Listening Part 3 và làm đề thi thử đạt 7.0. Phần Writing Task 2 em vẫn hơi lúng túng khi phát triển luận điểm Coherence and Cohesion.",
    journalDate: "Hôm nay, 10:30"
  },
  {
    id: "std-2",
    name: "Trần Tuấn Kiệt",
    avatar: "K",
    activeCourse: "English Grammar for Beginners & Intermediate",
    progress: 35,
    streak: 4,
    lastJournal: "Em đã nắm được cách phân biệt thì hiện tại hoàn thành và quá khứ đơn. Tuy nhiên phần bài tập trắc nghiệm vẫn bị sai 3 câu ở giới từ.",
    journalDate: "Hôm qua, 18:20"
  }
];

export default function MentorDashboard() {
  const toast = useToast();
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [selectedStudent, setSelectedStudent] = useState<Student>(MOCK_STUDENTS[0]);
  const [feedback, setFeedback] = useState("");
  const [suggestedPlan, setSuggestedPlan] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: "student", text: "Chào mentor, anh xem giúp em bài viết Task 2 em gửi trên diễn đàn nhé.", time: "10:35" },
    { sender: "mentor", text: "Chào Hân, anh đã nhận được bài. Nhìn chung bố cục tốt, anh sẽ viết nhận xét chi tiết vào Nhật ký học tập của em nhé.", time: "10:42" }
  ]);

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback) return;
    toast.success("Đã gửi nhận xét phản hồi", `Học viên: ${selectedStudent.name}`);
    setFeedback("");
    setSuggestedPlan("");
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage) return;
    setChatHistory((prev) => [
      ...prev,
      { sender: "mentor", text: chatMessage, time: "Vừa xong" }
    ]);
    setChatMessage("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* Cot ben trai: Danh sach hoc vien duoc phan cong */}
      <div className="lg:col-span-1 space-y-6">
        <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Học viên phụ trách ({students.length})
        </h3>
        <div className="space-y-4">
          {students.map((student) => (
            <div
              key={student.id}
              onClick={() => setSelectedStudent(student)}
              className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedStudent.id === student.id
                  ? "border-primary bg-pink-50/50 shadow-sm"
                  : "border-gray-100 bg-white hover:border-pink-200"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-extrabold text-sm uppercase">
                  {student.avatar}
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-gray-900 text-sm truncate">{student.name}</h4>
                  <p className="text-4xs text-gray-400 font-bold truncate">{student.activeCourse}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-primary block">{student.progress}%</span>
                <span className="text-4xs text-gray-400 font-bold">Chuỗi: {student.streak}🔥</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cot ben phai: Nhat ky hoc tap & Tro chuyen voi hoc vien duoc chon */}
      <div className="lg:col-span-2 space-y-8">
        {/* Nhat ky & Nhan xet */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-6 space-y-6">
          <div className="flex justify-between items-start flex-wrap gap-4 border-b border-gray-50 pb-4">
            <div>
              <h3 className="font-extrabold text-gray-900 text-base">Nhật ký học tập</h3>
              <p className="text-2xs font-semibold text-gray-400 uppercase tracking-wider">Học viên: {selectedStudent.name}</p>
            </div>
            <span className="text-2xs font-bold text-gray-400">{selectedStudent.journalDate}</span>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <p className="text-sm text-gray-700 leading-relaxed italic">
              "{selectedStudent.lastJournal}"
            </p>
          </div>

          {/* Feedback Form */}
          <form onSubmit={handleSendFeedback} className="space-y-4">
            <div className="space-y-2">
              <label className="text-2xs font-extrabold uppercase text-gray-400 tracking-wider">Nhận xét & Hướng dẫn</label>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Nhập phản hồi chuyên môn, sửa lỗi sai hoặc khích lệ học viên..."
                className="w-full text-sm rounded-2xl border border-gray-200 p-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-2xs font-extrabold uppercase text-gray-400 tracking-wider">Đề xuất lộ trình/Bài tập (Không bắt buộc)</label>
              <input
                type="text"
                value={suggestedPlan}
                onChange={(e) => setSuggestedPlan(e.target.value)}
                placeholder="Ví dụ: Luyện thêm 2 bài nghe Listening Section 3 và viết lại mở bài..."
                className="w-full text-sm rounded-xl border border-gray-200 px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-primary hover:opacity-95 text-white text-xs font-extrabold px-6 py-3 rounded-xl shadow-md shadow-pink-200 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Gửi đánh giá chuyên môn</span>
              </button>
            </div>
          </form>
        </div>

        {/* Tro chuyen truc tuyen */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-6 space-y-4">
          <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-secondary" />
            Trò chuyện với {selectedStudent.name}
          </h3>

          {/* Chat history */}
          <div className="h-48 overflow-y-auto border border-gray-50 rounded-2xl p-4 bg-gray-50/50 space-y-4 flex flex-col">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`max-w-[80%] rounded-2xl p-3 text-sm ${
                  msg.sender === "mentor"
                    ? "bg-primary text-white self-end rounded-tr-none"
                    : "bg-white text-gray-700 border border-gray-100 self-start rounded-tl-none"
                }`}
              >
                <p>{msg.text}</p>
                <span className={`text-3xs block mt-1 text-right ${msg.sender === "mentor" ? "text-white/70" : "text-gray-400"}`}>
                  {msg.time}
                </span>
              </div>
            ))}
          </div>

          {/* Message input */}
          <form onSubmit={handleSendChatMessage} className="flex gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Nhập tin nhắn hướng dẫn..."
              className="flex-1 text-sm rounded-xl border border-gray-200 px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
            <button
              type="submit"
              className="bg-secondary hover:opacity-95 text-white font-extrabold px-5 rounded-xl flex items-center justify-center transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
