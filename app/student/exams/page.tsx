"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Clock, FileText, Award, ArrowRight, Loader2, Sparkles, AlertCircle, Search } from "lucide-react";
import { API_BASE_URL } from "@/lib/apiConfig";
import { buildAuthHeaders } from "@/lib/authHeaders";
import { unwrapData, type ApiResponse } from "@/lib/apiResponses";
import { useAuth } from "@/context/AuthContext";

interface Exam {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  courseId?: string;
}

export default function StudentExamLauncherPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [manualExamId, setManualExamId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Tải danh sách các bài thi của khóa học học viên đã đăng ký
  const { data: exams = [], isLoading, error } = useSWR<Exam[]>(
    token ? [`${API_BASE_URL}/api/learning/student/exams`, token] as const : null,
    async ([url, t]: readonly [string, string]) => {
      const res = await fetch(url, { headers: buildAuthHeaders(t, "STUDENT") });
      if (!res.ok) return [];
      const body = await res.json();
      const data = unwrapData<Exam[]>(body);
      return Array.isArray(data) ? data : [];
    }
  );

  const filteredExams = exams.filter((e) =>
    e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-[600px] max-w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-soft">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> Bài thi của tôi
          </h1>
          <p className="text-xs font-bold text-gray-400 mt-1">
            Danh sách tất cả các bài kiểm tra đánh giá thuộc các khóa học bạn đã đăng ký
          </p>
        </div>
      </div>

      {/* Thanh tìm kiếm & Nhập ID thủ công */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-soft space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Tìm kiếm bài thi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
          />
        </div>

        {/* Mở nhanh bài thi bằng ID */}
        <details className="group text-3xs text-gray-500 font-extrabold cursor-pointer">
          <summary className="hover:text-primary transition-colors flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Nhập Exam ID trực tiếp từ Giảng viên
          </summary>
          <div className="flex gap-2 pt-2 animate-fade-in">
            <input
              value={manualExamId}
              onChange={(e) => setManualExamId(e.target.value)}
              placeholder="Dán mã Exam ID vào đây..."
              className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-xl font-bold bg-white"
            />
            <button
              disabled={!manualExamId.trim()}
              onClick={() => router.push(`/student/exams/${manualExamId.trim()}`)}
              className="px-4 py-1.5 text-3xs font-black text-white bg-primary rounded-xl disabled:opacity-50 hover:opacity-90 cursor-pointer"
            >
              Vào thi ngay
            </button>
          </div>
        </details>
      </div>

      {/* Trạng thái Loading / Error */}
      {isLoading && (
        <div className="text-center py-12">
          <Loader2 className="w-7 h-7 text-primary animate-spin mx-auto" />
          <p className="text-xs font-bold text-gray-400 mt-2">Đang nạp danh sách bài thi...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> không thể tải danh sách bài thi. Vui lòng thử lại sau.
        </div>
      )}

      {/* Danh sách bài thi */}
      {!isLoading && !error && (
        <div className="space-y-4">
          {filteredExams.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center space-y-2">
              <FileText className="w-10 h-10 text-gray-300 mx-auto" />
              <h3 className="text-xs font-extrabold text-gray-600">Chưa có bài thi nào</h3>
              <p className="text-3xs font-bold text-gray-400 max-w-xs mx-auto">
                Hiện tại các khóa học của bạn chưa có bài kiểm tra mới hoặc mã bài thi chưa xuất bản.
              </p>
            </div>
          ) : (
            filteredExams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft hover:border-primary/30 transition-all flex justify-between items-center gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-lg border border-emerald-100">
                      Sẵn sàng làm bài
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-gray-900">{exam.title}</h3>
                  {exam.description && (
                    <p className="text-xs font-medium text-gray-500 line-clamp-2">{exam.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-3xs font-bold text-gray-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-primary" /> {exam.durationMinutes} phút
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" /> Thang điểm {exam.totalMarks} (Đạt: {exam.passingMarks})
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/student/exams/${exam.id}`)}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-black text-xs rounded-xl shadow-md shadow-primary/20 flex items-center gap-1.5 shrink-0 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  Bắt đầu <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
