"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ArrowLeft, Flag, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { apiFetch } from "@/lib/apiFetch";
import { unwrapData, type ApiResponse } from "@/lib/apiResponses";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

interface CourseDetail {
  id: string;
  title: string;
  slug: string;
}

export default function CourseReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { isAuthenticated, token } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Lấy chi tiết khóa học để lấy `id` chính xác
  const { data: course, isLoading, error } = useSWR<CourseDetail>(
    `/api/courses/p/${encodeURIComponent(slug)}`,
    async (url: string) => {
      const body = await apiFetch<ApiResponse<CourseDetail> | CourseDetail>(url).catch(() => null);
      if (!body) throw new Error("Không thể tải thông tin khóa học");
      return unwrapData<CourseDetail>(body);
    },
    { revalidateOnFocus: false }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập", "Bạn cần đăng nhập để thực hiện báo cáo.");
      router.push(`/student/login?redirect=${encodeURIComponent(`/courses/${slug}/report`)}`);
      return;
    }

    if (!reason.trim() || reason.trim().length < 3) {
      toast.warning("Lý do quá ngắn", "Vui lòng nhập lý do rõ ràng hơn.");
      return;
    }

    setSaving(true);
    try {
      await apiFetch("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          targetType: "COURSE",
          targetId: course?.id || slug,
          reason: reason.trim(),
          description: description.trim() || undefined,
        }),
      });

      toast.success("Đã gửi báo cáo thành công", "Ban quản trị sẽ xem xét nội dung khóa học này.");
      setSubmitted(true);
    } catch (cause) {
      toast.error("Gửi báo cáo thất bại", cause instanceof Error ? cause.message : "Đã xảy ra lỗi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-grow px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={`/courses/${slug}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Trở về trang khóa học
        </Link>

        <div className="rounded-3xl border bg-white p-6 sm:p-10 shadow-soft">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500 space-y-3">
              <AlertTriangle className="h-10 w-10 mx-auto" />
              <p className="font-bold">Không thể tải thông tin khóa học</p>
              <Link href={`/courses/${slug}`} className="text-xs font-bold text-primary underline">
                Quay lại chi tiết khóa học
              </Link>
            </div>
          ) : submitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-black text-gray-900">Cảm ơn bạn đã báo cáo</h2>
              <p className="text-sm text-gray-600 max-w-[480px] mx-auto">
                Báo cáo về khóa học <strong className="text-gray-900">{course?.title}</strong> đã được gửi tới Ban quản trị hệ thống. Chúng tôi sẽ tiến hành kiểm tra sớm nhất có thể.
              </p>
              <div className="pt-4">
                <Link
                  href={`/courses/${slug}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-soft hover:bg-primary/95 transition-all"
                >
                  <ArrowLeft className="h-4 w-4" /> Quay lại trang khóa học
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="border-b pb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-extrabold text-red-700">
                  <Flag className="h-3.5 w-3.5" /> Khóa học: {course?.title}
                </span>
                <h1 className="mt-3 text-2xl font-black text-gray-900">Báo cáo vi phạm khóa học</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Hãy cung cấp lý do chi tiết nếu bạn phát hiện nội dung khóa học vi phạm tiêu chuẩn cộng đồng hoặc quy định bản quyền.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Lý do báo cáo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={255}
                    placeholder="Ví dụ: Nội dung không phù hợp, vi phạm bản quyền, lừa đảo..."
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-red-400 focus:ring-4 focus:ring-red-100 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Mô tả chi tiết (Tùy chọn)
                  </label>
                  <textarea
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Vui lòng cung cấp thêm bằng chứng hoặc mô tả chi tiết vị trí vi phạm (ví dụ: Chương 2 - Bài 3 nội dung bị hỏng)..."
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-red-400 focus:ring-4 focus:ring-red-100 outline-none transition-all leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t pt-6">
                <Link
                  href={`/courses/${slug}`}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Hủy bỏ
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-soft hover:bg-red-700 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gửi báo cáo"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
