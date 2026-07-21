"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { BookOpen, Check, Edit, Loader2, MessageSquare, Plus, RotateCcw, Send, Settings, Star, Trash2, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/apiConfig";
import { apiFetch } from "@/lib/apiFetch";
import { unwrapPageContent, type ApiResponse, type PagePayload } from "@/lib/apiResponses";
import { useToast } from "@/components/ui/Toast";

interface Course {
  id: string;
  title: string;
  level: string;
  price: number;
  status: "DRAFT" | "PENDING" | "PENDING_REVIEW" | "APPROVED" | "PUBLISHED" | "REJECTED" | "ARCHIVED";
  totalStudents?: number;
  avgRating?: number;
}

export default function TeacherDashboard() {
  const { token } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [processing, setProcessing] = useState<string | null>(null);
  const { data, error, isLoading, mutate } = useSWR(
    token ? ["/api/courses/my-courses", token] : null,
    async ([path]: readonly [string, string]) => {
      const body = await apiFetch<ApiResponse<PagePayload<Course> | Course[]> | PagePayload<Course> | Course[]>(path);
      return unwrapPageContent<Course>(body);
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const courses = data ?? [];
  const published = courses.filter((course) => course.status === "PUBLISHED").length;
  const students = courses.reduce((sum, course) => sum + (course.totalStudents ?? 0), 0);
  const ratedCourses = courses.filter((course) => typeof course.avgRating === "number");
  const rating = ratedCourses.length
    ? ratedCourses.reduce((sum, course) => sum + (course.avgRating ?? 0), 0) / ratedCourses.length
    : null;

  const runAction = async (courseId: string, action: "submit" | "publish" | "cancel-submit" | "archive") => {
    const prompts = {
      submit: "Gửi khóa học này cho Admin duyệt?",
      publish: "Xuất bản khóa học đã được Admin duyệt?",
      "cancel-submit": "Thu hồi yêu cầu duyệt và đưa khóa học về bản nháp?",
      archive: "Bạn có chắc muốn lưu trữ khóa học này?",
    };
    if (!window.confirm(prompts[action])) return;
    setProcessing(courseId);
    try {
      await apiFetch(`/api/courses/${courseId}/${action}`, { method: action === "archive" ? "DELETE" : "POST" });
      await mutate();
      toast.success("Đã cập nhật khóa học");
    } catch (cause) {
      toast.error("Không thể cập nhật khóa học", cause instanceof Error ? cause.message : undefined);
    } finally {
      setProcessing(null);
    }
  };

  return <div className="space-y-8 animate-fade-in">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { label: "Tổng khóa học", value: courses.length, icon: BookOpen },
        { label: "Đã xuất bản", value: published, icon: Check },
        { label: "Học viên đăng ký", value: students, icon: Users },
        { label: "Đánh giá trung bình", value: rating === null ? "—" : rating.toFixed(1), icon: Star },
      ].map(({ label, value, icon: Icon }) => <div key={label} className="flex items-center gap-4 rounded-3xl border bg-white p-6 shadow-soft"><Icon className="h-6 w-6 text-primary" /><div><strong className="block text-2xl">{value}</strong><span className="text-xs font-bold uppercase text-gray-400">{label}</span></div></div>)}
    </div>

    <section className="overflow-hidden rounded-3xl border bg-white shadow-soft">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b p-6"><div><h1 className="font-extrabold">Khóa học của tôi</h1><p className="text-xs text-gray-500">Dữ liệu trực tiếp từ Course Service</p></div><button onClick={() => router.push("/teacher/courses/new")} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4" />Tạo khóa học</button></header>
      {isLoading && <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-500"><Loader2 className="h-5 w-5 animate-spin" />Đang tải khóa học...</div>}
      {error && <div className="m-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">Không tải được khóa học từ {API_BASE_URL}. {error instanceof Error ? error.message : "Vui lòng kiểm tra Backend/Gateway."}</div>}
      {!isLoading && !error && courses.length === 0 && <div className="p-10 text-center text-sm text-gray-500">Chưa có khóa học nào. Hãy tạo khóa học đầu tiên.</div>}
      {courses.length > 0 && <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-400"><tr><th className="p-4">Khóa học</th><th className="p-4">Trình độ</th><th className="p-4">Học phí</th><th className="p-4">Trạng thái</th><th className="p-4">Tác vụ</th></tr></thead><tbody className="divide-y">{courses.map((course) => <tr key={course.id}><td className="p-4 font-bold">{course.title}</td><td className="p-4">{course.level}</td><td className="p-4">{course.price === 0 ? "Miễn phí" : `${course.price.toLocaleString("vi-VN")} đ`}</td><td className="p-4"><span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-bold">{course.status}</span></td><td className="p-4"><div className="flex gap-2">
        <button title="Sửa thông tin" onClick={() => router.push(`/teacher/courses/${course.id}/edit`)}><Settings className="h-4 w-4" /></button>
        <button title="Quản lý bài học" onClick={() => router.push(`/teacher/courses/${course.id}/curriculum`)}><Edit className="h-4 w-4" /></button>
        <button title="Đánh giá" onClick={() => router.push(`/teacher/courses/${course.id}/reviews`)}><MessageSquare className="h-4 w-4" /></button>
        {(course.status === "DRAFT" || course.status === "REJECTED") && <button title="Gửi duyệt" disabled={processing === course.id} onClick={() => runAction(course.id, "submit")}><Send className="h-4 w-4" /></button>}
        {(course.status === "PENDING" || course.status === "PENDING_REVIEW") && <button title="Thu hồi" disabled={processing === course.id} onClick={() => runAction(course.id, "cancel-submit")}><RotateCcw className="h-4 w-4" /></button>}
        {course.status === "APPROVED" && <button title="Xuất bản" disabled={processing === course.id} onClick={() => runAction(course.id, "publish")}><Check className="h-4 w-4" /></button>}
        <button title="Lưu trữ" disabled={processing === course.id} onClick={() => runAction(course.id, "archive")} className="text-red-500"><Trash2 className="h-4 w-4" /></button>
      </div></td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
