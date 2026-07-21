"use client";

import { use, useState } from "react";
import useSWR from "swr";
import { Loader2, MessageSquareReply, Star } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import { unwrapData, type ApiResponse, type PagePayload } from "@/lib/apiResponses";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

interface ReviewItem { id: string; studentId: string; rating: number; reviewText?: string; createdAt?: string }

export default function TeacherCourseReviewsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const { token } = useAuth();
  const toast = useToast();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const key = token ? [`/api/courses/p/${courseId}/reviews?page=0&size=100`, token] : null;
  const { data, error, isLoading, mutate } = useSWR(key, async ([path]: readonly [string, string]) =>
    apiFetch<ApiResponse<PagePayload<ReviewItem>>>(path),
  { revalidateOnFocus: false, shouldRetryOnError: false });
  const reviews = unwrapData<PagePayload<ReviewItem>>(data ?? {}).content ?? [];

  const reply = async (reviewId: string) => {
    const content = drafts[reviewId]?.trim();
    if (!token || !content) return;
    setSaving(reviewId);
    try {
      await apiFetch(`/api/courses/${courseId}/reviews/${reviewId}/reply`, { method: "POST", body: JSON.stringify({ content }) });
      toast.success("Đã phản hồi đánh giá");
      setDrafts((value) => ({ ...value, [reviewId]: "" }));
      await mutate();
    } catch (cause) {
      toast.error("Không thể phản hồi", cause instanceof Error ? cause.message : "Request failed");
    } finally { setSaving(null); }
  };

  return <div className="space-y-6"><div><h1 className="text-2xl font-black">Phản hồi đánh giá</h1><p className="text-sm text-gray-500">Course ID: {courseId}</p></div>
    {isLoading && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
    {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error.message}</div>}
    {!isLoading && !error && reviews.length === 0 && <div className="rounded-2xl border border-dashed p-8 text-center text-gray-500">Khóa học chưa có đánh giá.</div>}
    {reviews.map((review) => <article key={review.id} className="rounded-2xl border bg-white p-5 shadow-soft"><div className="flex justify-between"><span className="text-xs font-bold text-gray-500">Student {review.studentId}</span><span className="flex items-center gap-1 font-black text-amber-500"><Star className="h-4 w-4 fill-current" />{review.rating}</span></div><p className="my-3 text-sm">{review.reviewText || "Không có nhận xét"}</p><div className="flex gap-2"><input value={drafts[review.id] ?? ""} onChange={(e) => setDrafts((value) => ({ ...value, [review.id]: e.target.value }))} placeholder="Nhập phản hồi của giảng viên" className="flex-1 rounded-xl border px-3 py-2 text-sm" /><button onClick={() => reply(review.id)} disabled={saving === review.id || !drafts[review.id]?.trim()} className="rounded-xl bg-secondary px-3 py-2 text-white disabled:opacity-50">{saving === review.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquareReply className="h-4 w-4" />}</button></div></article>)}
  </div>;
}
