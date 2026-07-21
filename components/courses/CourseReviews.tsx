"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { Star, MessageSquare, Plus, Edit2, Trash2, Reply, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/apiFetch";
import { unwrapData, type ApiResponse, type PagePayload } from "@/lib/apiResponses";
import { Modal } from "@/components/ui/Modal";

interface ReviewReplyDto {
  id: string;
  instructorId: string;
  replyText: string;
  createdAt: string;
}

interface ReviewDto {
  id: string;
  studentId: string;
  rating: number;
  comment: string;
  createdAt: string;
  replies?: ReviewReplyDto[];
}

export default function CourseReviews({ courseId, hasAccess, isTeacherOrAdmin }: { courseId: string; hasAccess: boolean; isTeacherOrAdmin: boolean }) {
  const { token, user, isAuthenticated } = useAuth();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  const [replyReviewId, setReplyReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch reviews using SWR
  const { data: reviewsPage, error, isLoading, mutate } = useSWR<PagePayload<ReviewDto>>(
    `/api/courses/p/${courseId}/reviews?page=0&size=50`,
    async (url) => {
      const body = await apiFetch<ApiResponse<PagePayload<ReviewDto>> | PagePayload<ReviewDto>>(url).catch(() => null);
      if (!body) return { content: [], totalElements: 0, totalPages: 0, size: 50 };
      return unwrapData(body);
    },
    { revalidateOnFocus: false }
  );

  const reviews = reviewsPage?.content || [];

  // Check if current user has already reviewed
  const hasReviewed = reviews.some(r => r.studentId === user?.id);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.warning("Vui lòng đăng nhập để đánh giá");
      return;
    }
    if (!comment.trim()) {
      toast.warning("Vui lòng nhập nội dung đánh giá");
      return;
    }

    setSubmitting(true);
    try {
      if (editingReviewId) {
        // Update review
        await apiFetch(`/api/courses/${courseId}/reviews/${editingReviewId}`, {
          method: "POST", // Backend uses POST for update according to endpoint API docs
          body: JSON.stringify({ rating, comment: comment.trim() }),
        });
        toast.success("Cập nhật đánh giá thành công");
      } else {
        // Create review
        await apiFetch(`/api/courses/${courseId}/reviews`, {
          method: "POST",
          body: JSON.stringify({ rating, comment: comment.trim() }),
        });
        toast.success("Gửi đánh giá thành công");
      }
      setModalOpen(false);
      setComment("");
      setEditingReviewId(null);
      mutate();
    } catch (cause) {
      toast.error("Không thể lưu đánh giá", cause instanceof Error ? cause.message : undefined);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return;
    try {
      await apiFetch(`/api/courses/${courseId}/reviews/${reviewId}`, {
        method: "DELETE",
      });
      toast.success("Xóa đánh giá thành công");
      mutate();
    } catch (cause) {
      toast.error("Không thể xóa đánh giá", cause instanceof Error ? cause.message : undefined);
    }
  };

  const handleReplyReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !replyReviewId) return;

    setSubmitting(true);
    try {
      await apiFetch(`/api/courses/${courseId}/reviews/${replyReviewId}/reply`, {
        method: "POST",
        body: JSON.stringify({ replyText: replyText.trim() }),
      });
      toast.success("Phản hồi đánh giá thành công");
      setReplyReviewId(null);
      setReplyText("");
      mutate();
    } catch (cause) {
      toast.error("Không thể phản hồi đánh giá", cause instanceof Error ? cause.message : undefined);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500 fill-current" /> Đánh giá từ học viên
        </h2>
        {hasAccess && !hasReviewed && !isTeacherOrAdmin && (
          <button
            onClick={() => {
              setEditingReviewId(null);
              setRating(5);
              setComment("");
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-soft hover:bg-primary/95 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Viết đánh giá
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-12 text-center text-sm text-gray-400">
          <MessageSquare className="h-10 w-10 mx-auto opacity-30 mb-2" />
          Chưa có đánh giá nào cho khóa học này.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border bg-white p-5 space-y-4 shadow-soft">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-gray-800">Học viên</span>
                    <span className="text-3xs text-gray-400 font-semibold">
                      {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <div className="flex gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`h-3.5 w-3.5 ${idx < review.rating ? "fill-current" : "text-gray-200"}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  {review.studentId === user?.id && (
                    <>
                      <button
                        onClick={() => {
                          setEditingReviewId(review.id);
                          setRating(review.rating);
                          setComment(review.comment);
                          setModalOpen(true);
                        }}
                        className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-primary transition-all cursor-pointer"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-red-500 transition-all cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  {isTeacherOrAdmin && (
                    <button
                      onClick={() => {
                        setReplyReviewId(replyReviewId === review.id ? null : review.id);
                        setReplyText("");
                      }}
                      className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-primary transition-all cursor-pointer"
                    >
                      <Reply className="h-4 w-4" /> Phản hồi
                    </button>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed break-words">{review.comment}</p>

              {/* Reply form */}
              {replyReviewId === review.id && (
                <form onSubmit={handleReplyReview} className="pl-6 border-l-2 space-y-3">
                  <textarea
                    rows={2}
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Viết phản hồi cho đánh giá này..."
                    className="w-full text-xs rounded-xl border border-gray-200 p-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-gray-50"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setReplyReviewId(null)}
                      className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 rounded-lg"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-1.5 text-xs font-bold bg-primary text-white rounded-lg shadow-soft"
                    >
                      Gửi phản hồi
                    </button>
                  </div>
                </form>
              )}

              {/* Display replies */}
              {review.replies && review.replies.length > 0 && (
                <div className="pl-6 border-l-2 space-y-3 bg-gray-50/50 p-3 rounded-r-xl">
                  {review.replies.map((reply) => (
                    <div key={reply.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-primary">Giảng viên</span>
                        <span className="text-3xs text-gray-400 font-semibold">
                          {new Date(reply.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 break-words leading-relaxed">{reply.replyText}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Write/Edit Review Modal */}
      {modalOpen && (
        <Modal
          isOpen={true}
          onClose={() => !submitting && setModalOpen(false)}
          title={editingReviewId ? "Cập nhật đánh giá" : "Viết đánh giá khóa học"}
          className="w-full max-w-[512px]"
          footer={
            <button
              disabled={submitting}
              onClick={handleSubmitReview}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2 font-bold text-white shadow hover:bg-primary/95 transition-all disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Gửi đánh giá
            </button>
          }
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">Mức độ hài lòng</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= rating ? "text-amber-400 fill-current" : "text-gray-200"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">Nội dung nhận xét</label>
              <textarea
                rows={4}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Hãy chia sẻ trải nghiệm học tập của bạn về khóa học này..."
                className="w-full text-xs rounded-xl border border-gray-200 p-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
