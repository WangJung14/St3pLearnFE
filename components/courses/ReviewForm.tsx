"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, Star } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import { useAuth } from "@/context/AuthContext";
import { getRoleFromToken } from "@/lib/roleRoutes";

interface ReviewFormProps {
  courseId: string;
  courseSlug: string;
  onSubmitted: () => void | Promise<unknown>;
}

interface ReviewSubmitResponse {
  message?: string;
  data?: {
    id: string;
    rating: number;
    reviewText: string;
  };
}

export default function ReviewForm({ courseId, courseSlug, onSubmitted }: ReviewFormProps) {
  const router = useRouter();
  const { isAuthenticated, token, user } = useAuth();
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const canReview = (getRoleFromToken(token) ?? user?.role) === "STUDENT";
  const trimmedReview = reviewText.trim();
  const isInvalid = trimmedReview.length < 10;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!isAuthenticated) {
      router.push(`/login?redirect=/courses/${courseSlug}`);
      return;
    }

    if (!canReview) {
      setErrorMessage("Chỉ tài khoản học viên mới có thể gửi đánh giá khóa học.");
      return;
    }

    if (isInvalid) {
      setErrorMessage("Vui lòng viết đánh giá ít nhất 10 ký tự.");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = await apiFetch<ReviewSubmitResponse>(`/api/courses/${courseId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating, reviewText: trimmedReview }),
      });

      setSuccessMessage(body.message ?? "Đã gửi đánh giá của bạn.");
      setReviewText("");
      setRating(5);
      await onSubmitted();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không gửi được đánh giá";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-center">
        <p className="text-sm font-bold text-gray-700">Đăng nhập để chia sẻ trải nghiệm học tập của bạn.</p>
        <button
          onClick={() => router.push(`/login?redirect=/courses/${courseSlug}`)}
          className="mt-3 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-pink-100 transition-opacity hover:opacity-95"
        >
          Đăng nhập
        </button>
      </div>
    );
  }

  if (!canReview) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-sm font-semibold text-gray-500">
        Chỉ tài khoản học viên mới có thể gửi đánh giá khóa học.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-100 bg-gray-50 p-5 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-gray-900">Viết đánh giá của bạn</h3>
          <p className="text-xs text-gray-500">Đánh giá chỉ được chấp nhận nếu bạn đã ghi danh khóa học.</p>
        </div>

        <div className="flex items-center gap-1" aria-label="Chọn số sao đánh giá">
          {Array.from({ length: 5 }).map((_, index) => {
            const value = index + 1;
            const active = value <= rating;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className="rounded-lg p-1 transition-colors hover:bg-white"
                title={`${value} sao`}
              >
                <Star
                  className={`h-5 w-5 ${
                    active ? "fill-amber-400 stroke-amber-400" : "fill-gray-200 stroke-gray-200"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="course-review" className="text-xs font-extrabold uppercase tracking-wide text-gray-500">
          Nội dung đánh giá
        </label>
        <textarea
          id="course-review"
          value={reviewText}
          onChange={(event) => setReviewText(event.target.value)}
          rows={4}
          disabled={isSubmitting}
          placeholder="Khóa học này giúp bạn tiến bộ ở điểm nào?"
          className="w-full resize-none rounded-2xl border border-gray-200 bg-white p-4 text-sm leading-relaxed text-gray-700 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
        />
        {isInvalid && reviewText.length > 0 && (
          <p className="text-xs font-semibold text-red-600">Đánh giá cần ít nhất 10 ký tự.</p>
        )}
      </div>

      {errorMessage && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
          {errorMessage}
        </p>
      )}

      {successMessage && (
        <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
          {successMessage}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || isInvalid}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-pink-100 transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Gửi đánh giá
        </button>
      </div>
    </form>
  );
}
