"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR, { mutate as globalMutate } from "swr";
import { ArrowLeft, Check, ClipboardCheck, FileText, Loader2, X } from "lucide-react";
import { RoleGuard } from "@/components/guards/RoleGuard";
import { EmptyState } from "@/components/ui/EmptyState";
import { API_BASE_URL } from "@/lib/apiConfig";
import { buildAuthHeaders } from "@/lib/authHeaders";
import { unwrapData, type ApiResponse } from "@/lib/apiResponses";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

interface CourseInfo {
  id: string;
  title: string;
  slug?: string;
  shortDescription?: string;
  level?: string;
  language?: string;
  price?: number;
  status?: string;
  totalStudents?: number;
  totalReviews?: number;
  avgRating?: number;
}

interface ApprovalDetail {
  approvalRequestId: string;
  ticketStatus: string;
  submittedBy: string;
  submittedAt: string;
  courseInfo: CourseInfo;
  totalLessons: number;
}

async function fetchApprovalDetail([url, token]: readonly [string, string]): Promise<ApprovalDetail> {
  const res = await fetch(url, { headers: buildAuthHeaders(token, "ADMIN") });
  if (!res.ok) throw new Error("Không tải được chi tiết duyệt");
  const body = await res.json() as ApiResponse<ApprovalDetail> | ApprovalDetail;
  return unwrapData<ApprovalDetail>(body);
}

function formatPrice(price?: number) {
  if (!price) return "Miễn phí";
  return `${price.toLocaleString("vi-VN")} đ`;
}

function ApprovalDetailContent({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const resolvedParams = use(params);
  const requestId = resolvedParams.requestId;
  const router = useRouter();
  const { token } = useAuth();
  const toast = useToast();
  const [reviewNote, setReviewNote] = useState("");
  const [isProcessing, setIsProcessing] = useState<"APPROVE" | "REJECT" | null>(null);

  const key = token ? [`${API_BASE_URL}/api/courses/approvals/${requestId}`, token] as const : null;
  const { data: detail, error, isLoading, mutate } = useSWR<ApprovalDetail>(
    key,
    fetchApprovalDetail,
    { revalidateOnFocus: false }
  );

  const handleProcess = async (action: "APPROVE" | "REJECT") => {
    if (!token || !detail) return;

    if (action === "REJECT" && reviewNote.trim().length < 5) {
      toast.warning("Thiếu lý do từ chối", "Vui lòng nhập lý do rõ ràng hơn.");
      return;
    }

    const confirmed = window.confirm(
      action === "APPROVE"
        ? "Phê duyệt khóa học này?"
        : "Từ chối khóa học này và gửi ghi chú cho giáo viên?"
    );
    if (!confirmed) return;

    setIsProcessing(action);
    try {
      const res = await fetch(`${API_BASE_URL}/api/courses/approvals/${requestId}/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(token, "ADMIN"),
        },
        body: JSON.stringify({
          action,
          reviewNote: reviewNote.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => null) as { message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Xử lý duyệt thất bại");

      await globalMutate((cacheKey) =>
        (typeof cacheKey === "string" && cacheKey.includes("/api/courses/approvals/pending")) ||
        (Array.isArray(cacheKey) && typeof cacheKey[0] === "string" && cacheKey[0].includes("/api/courses/approvals/pending"))
      );
      await mutate();
      toast.success(action === "APPROVE" ? "Đã phê duyệt khóa học" : "Đã từ chối khóa học");
      router.push("/dashboard/admin/approvals");
    } catch (err: unknown) {
      toast.error("Xử lý duyệt thất bại", err instanceof Error ? err.message : undefined);
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      <main className="mx-auto flex w-full max-w-5xl flex-grow flex-col gap-8 px-4 py-8">
        <div className="flex flex-col gap-5 rounded-3xl border border-gray-100 bg-white p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Link href="/dashboard/admin/approvals" className="inline-flex items-center gap-2 text-xs font-extrabold text-gray-400 hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
              Hàng đợi duyệt
            </Link>
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-gray-900">Chi tiết duyệt khóa học</h1>
              <p className="text-sm text-gray-500">Kiểm tra thông tin khóa học trước khi approve hoặc reject.</p>
            </div>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-600">
            <ClipboardCheck className="h-7 w-7" />
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 rounded-3xl border border-gray-100 bg-white py-16 text-sm font-bold text-gray-400 shadow-soft">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Đang tải chi tiết...
          </div>
        )}

        {!isLoading && error && (
          <EmptyState title="Không tải được chi tiết duyệt" description={error instanceof Error ? error.message : "Vui lòng thử lại."} />
        )}

        {!isLoading && detail && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-soft space-y-6">
              <div className="space-y-1 border-b border-gray-50 pb-4">
                <h2 className="text-xl font-black text-gray-900">{detail.courseInfo.title}</h2>
                <p className="text-xs leading-relaxed text-gray-500">{detail.courseInfo.shortDescription || "Chưa có mô tả ngắn."}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <span className="text-3xs font-extrabold uppercase tracking-wider text-gray-400">Ticket</span>
                  <p className="mt-1 text-sm font-bold text-gray-800">{detail.ticketStatus}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <span className="text-3xs font-extrabold uppercase tracking-wider text-gray-400">Giảng viên</span>
                  <p className="mt-1 text-sm font-bold text-gray-800">{detail.submittedBy.slice(0, 8)}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <span className="text-3xs font-extrabold uppercase tracking-wider text-gray-400">Trình độ</span>
                  <p className="mt-1 text-sm font-bold text-gray-800">{detail.courseInfo.level ?? "-"}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <span className="text-3xs font-extrabold uppercase tracking-wider text-gray-400">Học phí</span>
                  <p className="mt-1 text-sm font-bold text-gray-800">{formatPrice(detail.courseInfo.price)}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <span className="text-3xs font-extrabold uppercase tracking-wider text-gray-400">Tổng bài học</span>
                  <p className="mt-1 text-sm font-bold text-gray-800">{detail.totalLessons}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <span className="text-3xs font-extrabold uppercase tracking-wider text-gray-400">Gửi lúc</span>
                  <p className="mt-1 text-sm font-bold text-gray-800">
                    {detail.submittedAt ? new Date(detail.submittedAt).toLocaleString("vi-VN") : "-"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                  <div className="space-y-1 text-xs leading-relaxed text-gray-500">
                    <p className="font-bold text-gray-700">Gợi ý kiểm tra thủ công</p>
                    <p>Kiểm tra taxonomy, số lượng bài học, nội dung đã upload và tính phù hợp của mô tả trước khi approve.</p>
                  </div>
                </div>
              </div>
            </section>

            <aside className="h-fit rounded-3xl border border-gray-100 bg-white p-6 shadow-soft space-y-5">
              <div className="space-y-1">
                <h2 className="text-base font-black text-gray-900">Quyết định duyệt</h2>
                <p className="text-xs text-gray-500">Reject bắt buộc có ghi chú để giáo viên biết cần sửa gì.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-2xs font-extrabold uppercase tracking-wider text-gray-400">Ghi chú kiểm duyệt</label>
                <textarea
                  value={reviewNote}
                  onChange={(event) => setReviewNote(event.target.value)}
                  rows={5}
                  placeholder="Nhập lý do từ chối hoặc ghi chú nội bộ..."
                  className="w-full resize-none rounded-2xl border border-gray-200 p-4 text-xs outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => handleProcess("APPROVE")}
                  disabled={isProcessing !== null || detail.ticketStatus !== "PENDING"}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs font-extrabold text-white shadow-md shadow-emerald-100 disabled:opacity-60"
                >
                  {isProcessing === "APPROVE" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Phê duyệt
                </button>
                <button
                  onClick={() => handleProcess("REJECT")}
                  disabled={isProcessing !== null || detail.ticketStatus !== "PENDING"}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-5 py-3 text-xs font-extrabold text-red-600 hover:bg-red-100 disabled:opacity-60"
                >
                  {isProcessing === "REJECT" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                  Từ chối
                </button>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminApprovalDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  return (
    <RoleGuard allow={["ADMIN"]}>
      <ApprovalDetailContent params={params} />
    </RoleGuard>
  );
}
