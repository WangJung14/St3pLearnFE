"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import { CheckCircle2, Clock, FileQuestion, Loader2, Play, RotateCcw } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import { unwrapData, type ApiResponse } from "@/lib/apiResponses";
import type { StudentExamSummary } from "@/lib/endpointTypes";
import { useAuth } from "@/context/AuthContext";

export default function StudentExamsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { data: exams = [], error, isLoading } = useSWR<StudentExamSummary[]>(
    token ? ["/api/learning/student/exams", token] : null,
    async ([path]: readonly [string, string]) =>
      unwrapData<StudentExamSummary[]>(
        await apiFetch<ApiResponse<StudentExamSummary[]> | StudentExamSummary[]>(path)
      ),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black">Bài thi của tôi</h1>
        <p className="text-sm text-gray-500">Các bài thi đã xuất bản thuộc khóa học bạn đang tham gia.</p>
      </header>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border bg-white p-10 text-sm text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />Đang tải bài thi...
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          Không tải được danh sách bài thi. {error instanceof Error ? error.message : "Vui lòng thử lại."}
        </div>
      )}

      {!isLoading && !error && exams.length === 0 && (
        <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-sm text-gray-500">
          Chưa có bài thi nào được xuất bản cho các khóa học của bạn.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {exams.map((exam) => (
          <article key={exam.id} className="flex flex-col rounded-2xl border bg-white p-5 shadow-soft">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-black text-gray-900">{exam.title}</h2>
                <p className="mt-1 text-xs text-gray-400">Mã bài thi: {exam.id.slice(0, 8)}</p>
              </div>
              {exam.passed && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />Đã đạt
                </span>
              )}
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2 text-xs text-gray-600">
              <span className="flex items-center gap-2 rounded-xl bg-gray-50 p-3"><Clock className="h-4 w-4 text-primary" />{exam.durationMinutes} phút</span>
              <span className="flex items-center gap-2 rounded-xl bg-gray-50 p-3"><FileQuestion className="h-4 w-4 text-secondary" />{exam.questionCount} câu</span>
              <span className="flex items-center gap-2 rounded-xl bg-gray-50 p-3"><RotateCcw className="h-4 w-4 text-amber-500" />Đã thi {exam.attemptsUsed}/{exam.maxAttempts}</span>
              <span className="rounded-xl bg-gray-50 p-3">Điểm đạt: {exam.passingScore}</span>
            </div>

            <button
              disabled={!exam.canStart}
              onClick={() => router.push(`/student/exams/${exam.id}`)}
              className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-primary p-3 text-sm font-bold text-white disabled:bg-gray-300"
            >
              <Play className="h-4 w-4" />
              {exam.canStart ? "Vào bài thi" : "Đã hết lượt thi"}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
