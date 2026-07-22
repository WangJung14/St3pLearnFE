"use client";

import React, { use, useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/apiConfig";
import { ArrowLeft, Play, FileText, CheckCircle2, MessageSquare, Edit3, ChevronRight, Video, Volume2, BookOpen, HelpCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/apiFetch";
import { Modal } from "@/components/ui/Modal";
import { buildAuthHeaders } from "@/lib/authHeaders";
import { unwrapData, type ApiResponse } from "@/lib/apiResponses";
import type { ResumeLearning } from "@/lib/endpointTypes";
import AIAssistantModal from "@/components/ai/AIAssistantModal";
import SpeakingRoomModal from "@/components/courses/SpeakingRoomModal";

interface Lesson {
  id: string;
  title: string;
  orderIndex: number;
  duration: number;
  isPreview: boolean;
  videoUrl?: string;
  audioUrl?: string;
  pdfUrl?: string;
  textContent?: string;
  storageUrl?: string;
  type?: "video" | "audio" | "pdf" | "text" | "quiz";
}

interface Chapter {
  id: string;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
}

interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  curriculum: Chapter[];
}

export default function LearningPlayerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const { token, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const toast = useToast();

  // Các trạng thái bài học đang kích hoạt
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState<"discussion" | "notes">("discussion");
  const [personalNotes, setPersonalNotes] = useState("");
  const [startLessonId, setStartLessonId] = useState<string | null>(null);
  const lastTrackedSecond = useRef(0);
  
  // Trạng thái bình luận thảo luận bài học từ API
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [showExamModal, setShowExamModal] = useState(false);
  const [isSpeakingOpen, setIsSpeakingOpen] = useState(false);

  const { data: comments = [], mutate: mutateComments } = useSWR<any[]>(
    activeLesson?.id ? `/api/courses/lessons/${activeLesson.id}/comments` : null,
    async (url) => {
      const body = await apiFetch<any>(url).catch(() => null);
      if (!body) return [];
      return unwrapData(body) || [];
    },
    { revalidateOnFocus: false }
  );

  // Tải chi tiết thông tin giáo trình khóa học từ API Gateway
  const { data: course, error } = useSWR<CourseDetail>(
    `/api/courses/p/${slug}`,
    async (url) => {
      const body = await apiFetch<ApiResponse<CourseDetail> | CourseDetail>(url, {
        headers: { "X-From-Player": "true" }
      });
      const data = unwrapData(body);
      if (data && data.curriculum) {
        data.curriculum = data.curriculum.map((chapter: any) => ({
          ...chapter,
          lessons: (chapter.lessons || []).map((lesson: any) => {
            const normalized = { ...lesson };
            const type = lesson.contentType || "";
            if (type.includes("PDF")) {
              normalized.pdfUrl = lesson.videoUrl;
              normalized.videoUrl = undefined;
              normalized.type = "pdf";
            } else if (type.includes("AUDIO")) {
              normalized.audioUrl = lesson.videoUrl;
              normalized.videoUrl = undefined;
              normalized.type = "audio";
            } else if (type === "TEXT") {
              normalized.type = "text";
              normalized.videoUrl = undefined;
            } else if (type === "QUIZ") {
              normalized.type = "quiz";
              normalized.storageUrl = lesson.videoUrl;
              normalized.videoUrl = undefined;
            } else {
              normalized.type = "video";
            }
            return normalized;
          })
        }));
      }
      return data;
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  // Tải danh sách bài tập/đề thi của khóa học từ learning-service
  const { data: exams = [] } = useSWR<any[]>(
    course?.id ? `/api/learning/courses/${course.id}/exams` : null,
    async (url) => {
      const body = await apiFetch<any>(url).catch(() => null);
      if (!body) return [];
      return unwrapData(body) || [];
    },
    { revalidateOnFocus: false }
  );

  const examsList = Array.isArray(exams) ? exams : [];
  const courseData = course;
  
  // Chỉ tải tiến độ nếu là Học viên thực sự (Teacher/Admin xem trước không cần track)
  const isStudent = user?.role === "STUDENT";
  
  const resumeKey = token && course?.id && isStudent ? [`${API_BASE_URL}/api/learning/courses/${course.id}/resume`, token] as const : null;
  const { data: resumeData } = useSWR<ResumeLearning>(resumeKey, async ([url, currentToken]: readonly [string, string]) => {
    const res = await fetch(url, { headers: buildAuthHeaders(currentToken, "STUDENT") });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return unwrapData<ResumeLearning>(await res.json() as ApiResponse<ResumeLearning>);
  }, { shouldRetryOnError: false });

  useEffect(() => {
    if (!course?.id || !token || !isStudent) return;
    let active = true;
    apiFetch<ApiResponse<{ lessonId: string }>>(`/api/learning/courses/${course.id}/start`, { method: "POST" })
      .then((body) => { if (active) setStartLessonId(unwrapData(body).lessonId); })
      .catch((cause) => toast.error("Không thể khởi tạo tiến độ", cause instanceof Error ? cause.message : "Request failed"));
    return () => { active = false; };
  }, [course?.id, token, isStudent, toast]);

  // Thiết lập bài học đầu tiên mặc định khi tải giáo trình thành công
  useEffect(() => {
    if (courseData?.curriculum?.length && courseData.curriculum[0].lessons.length) {
      const lessonId = resumeData?.lastLessonId ?? startLessonId;
      const lesson = courseData.curriculum.flatMap((chapter) => chapter.lessons).find((item) => item.id === lessonId);
      setActiveLesson(lesson ?? courseData.curriculum[0].lessons[0]);
    }
  }, [courseData, resumeData?.lastLessonId, startLessonId]);

  // Tải và đồng bộ hóa ghi chú cá nhân từ bộ nhớ Local Storage cục bộ
  useEffect(() => {
    if (activeLesson) {
      try {
        const savedNotes = localStorage.getItem(`edu_note_${slug}_${activeLesson.id}`);
        setPersonalNotes(savedNotes || "");
      } catch (e) {}
    }
  }, [activeLesson, slug]);

  const handleSaveNotes = (val: string) => {
    setPersonalNotes(val);
    if (activeLesson) {
      localStorage.setItem(`edu_note_${slug}_${activeLesson.id}`, val);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !activeLesson?.id) return;
    try {
      await apiFetch(`/api/courses/lessons/${activeLesson.id}/comments`, {
        method: "POST",
        body: JSON.stringify({
          content: newComment.trim(),
          userFullName: user?.fullName || user?.username || "Ẩn danh",
        }),
      });
      setNewComment("");
      mutateComments();
      toast.success("Đã đăng bình luận");
    } catch (cause) {
      toast.error("Không thể đăng bình luận", cause instanceof Error ? cause.message : undefined);
    }
  };

  const handleReplyComment = async (parentCommentId: string) => {
    if (!replyText.trim() || !activeLesson?.id) return;
    try {
      await apiFetch(`/api/courses/lessons/${activeLesson.id}/comments`, {
        method: "POST",
        body: JSON.stringify({
          content: replyText.trim(),
          userFullName: user?.fullName || user?.username || "Ẩn danh",
          parentCommentId,
        }),
      });
      setReplyText("");
      setReplyingTo(null);
      mutateComments();
      toast.success("Đã đăng phản hồi");
    } catch (cause) {
      toast.error("Không thể đăng phản hồi", cause instanceof Error ? cause.message : undefined);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editText.trim()) return;
    try {
      await apiFetch(`/api/courses/lessons/comments/${commentId}`, {
        method: "PUT",
        body: JSON.stringify({
          content: editText.trim(),
          userFullName: user?.fullName || user?.username || "Ẩn danh",
        }),
      });
      setEditText("");
      setEditingCommentId(null);
      mutateComments();
      toast.success("Đã sửa bình luận");
    } catch (cause) {
      toast.error("Không thể sửa bình luận", cause instanceof Error ? cause.message : undefined);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;
    try {
      await apiFetch(`/api/courses/lessons/comments/${commentId}`, {
        method: "DELETE",
      });
      mutateComments();
      toast.success("Đã xóa bình luận");
    } catch (cause) {
      toast.error("Không thể xóa bình luận", cause instanceof Error ? cause.message : undefined);
    }
  };

  const handleCompleteLesson = async () => {
    if (!courseData?.id || !activeLesson || !isStudent) {
      if (!isStudent) toast.info("Tính năng này chỉ dành cho Học viên.");
      return;
    }
    try {
      await apiFetch(`/api/learning/courses/${courseData.id}/lessons/${activeLesson.id}/complete`, { method: "POST" });
      toast.success("Đã hoàn thành bài học", "Tiến độ đã được đồng bộ lên server.");
    } catch (cause) {
      toast.error("Không thể hoàn thành bài học", cause instanceof Error ? cause.message : "Request failed");
    }
  };

  const trackProgress = (currentSeconds: number) => {
    if (!courseData?.id || !activeLesson || !isStudent || currentSeconds - lastTrackedSecond.current < 15) return;
    lastTrackedSecond.current = currentSeconds;
    void apiFetch(`/api/learning/courses/${courseData.id}/lessons/${activeLesson.id}/progress`, {
      method: "POST",
      body: JSON.stringify({ currentSeconds: Math.floor(currentSeconds) }),
    }).catch((cause) => toast.error("Không thể lưu tiến độ", cause instanceof Error ? cause.message : "Request failed"));
  };

  // Chuyển hướng sang trang làm bài kiểm tra trắc nghiệm/phát âm
  const handleTakeQuiz = () => {
    setShowExamModal(true);
  };

  if (error) return <div className="flex h-screen items-center justify-center bg-red-50 p-8 text-red-700">Không thể tải khóa học: {error.message}</div>;
  if (!activeLesson) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900 overflow-hidden">
      {/* Distraction-Free Header */}
      <header className="h-16 border-b border-gray-100 px-6 flex justify-between items-center bg-white shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href={`/courses/${slug}`}
            className="p-2 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-primary transition-colors"
            title="Trở về trang khóa học"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="space-y-0.5">
            <h1 className="text-sm font-extrabold text-gray-900 line-clamp-1">{courseData?.title}</h1>
            <p className="text-3xs font-extrabold text-primary uppercase tracking-widest">Đang phát: {activeLesson.title}</p>
          </div>
        </div>

        <button
          onClick={handleTakeQuiz}
          className="bg-secondary hover:opacity-95 text-white text-2xs font-extrabold px-4 py-2 rounded-xl shadow-md shadow-blue-100 transition-all cursor-pointer"
        >
          Làm bài kiểm tra bài học
        </button>
      </header>

      {/* Main Split-Pane Player Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Media Player & Tabs (Discussion, Notes) */}
        <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
          {/* Media Player Screen */}
          <div className="w-full aspect-video rounded-3xl bg-black overflow-hidden shadow-lg border border-gray-100 relative group">
            {activeLesson.videoUrl ? (
              activeLesson.videoUrl.includes("youtube.com") || activeLesson.videoUrl.includes("youtu.be") || activeLesson.videoUrl.includes("youtube/embed") ? (
                <iframe
                  src={activeLesson.videoUrl}
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={activeLesson.title}
                />
              ) : (
                <video
                  src={activeLesson.videoUrl}
                  controls
                  onTimeUpdate={(event) => trackProgress(event.currentTarget.currentTime)}
                  className="w-full h-full object-contain"
                  poster="https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1200"
                />
              )
            ) : activeLesson.audioUrl ? (
              <div className="w-full h-full bg-gradient-to-tr from-gray-900 to-slate-800 flex flex-col justify-center items-center p-8 space-y-4">
                <Volume2 className="w-16 h-16 text-primary animate-pulse" />
                <div className="text-center space-y-1">
                  <p className="text-white font-bold text-sm">Bài học Audio Listening</p>
                  <p className="text-gray-400 text-xs">{activeLesson.title}</p>
                </div>
                <audio src={activeLesson.audioUrl} controls className="w-full max-w-md mt-4" />
              </div>
            ) : activeLesson.type === "quiz" ? (
              <div className="w-full h-full bg-gradient-to-tr from-slate-900 to-slate-800 flex flex-col justify-center items-center p-6 space-y-4">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 w-[320px] max-w-full text-center space-y-4 shadow-2xl">
                  <div className="w-12 h-12 bg-pink-500/25 rounded-full flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6 text-pink-400" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-white font-extrabold text-xs leading-snug">Bài học Kiểm tra / Trắc nghiệm</h3>
                    <p className="text-gray-300 text-[10px] font-medium leading-relaxed">Bấm nút bên dưới để tiến hành làm bài thi liên kết với bài học này.</p>
                  </div>
                  <button
                    onClick={() => {
                      if (activeLesson.storageUrl) {
                        router.push(`/student/exams/${activeLesson.storageUrl}`);
                      } else {
                        toast.error("Bài kiểm tra chưa được liên kết!");
                      }
                    }}
                    className="w-full bg-primary text-white text-[11px] font-black py-2.5 rounded-xl hover:opacity-95 transition-all shadow-lg hover:shadow-primary/20 cursor-pointer"
                  >
                    Bắt đầu làm bài thi
                  </button>
                </div>
              </div>
            ) : activeLesson.textContent ? (
              <div className="w-full h-full bg-white overflow-y-auto p-8 font-sans leading-relaxed text-gray-800 text-sm select-text">
                <div className="max-w-2xl mx-auto space-y-4">
                  <h1 className="text-xl font-extrabold text-gray-900 border-b border-gray-100 pb-3">{activeLesson.title}</h1>
                  <div className="whitespace-pre-wrap">{activeLesson.textContent}</div>
                </div>
              </div>
            ) : activeLesson.pdfUrl ? (
              <iframe
                src={activeLesson.pdfUrl}
                className="w-full h-full border-none bg-white"
                title={activeLesson.title}
              />
            ) : (
              <div className="w-full h-full bg-slate-50 flex flex-col justify-center items-center p-8 text-center space-y-4">
                <FileText className="w-16 h-16 text-primary" />
                <div className="space-y-1">
                  <h3 className="font-extrabold text-gray-800 text-base">Tài liệu học tập PDF</h3>
                  <p className="text-xs text-gray-500 max-w-sm">Tài liệu đọc hiểu lý thuyết chi tiết bổ sung cho chương học.</p>
                </div>
                <div className="flex gap-3">
                  <a
                    href={activeLesson.pdfUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-primary text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-md shadow-pink-100 transition-all"
                  >
                    Tải về tài liệu PDF
                  </a>
                  <button
                    onClick={handleCompleteLesson}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all"
                  >
                    Đọc trực tiếp
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Row Under Player */}
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <div className="space-y-1">
              <h2 className="font-black text-gray-900 text-base">{activeLesson.title}</h2>
              {activeLesson.pdfUrl && (
                <a
                  href={activeLesson.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" /> Mở tài liệu PDF trong tab mới
                </a>
              )}
            </div>
            <button
              onClick={handleCompleteLesson}
              className="flex items-center gap-1.5 bg-emerald-500 hover:opacity-95 text-white text-2xs font-extrabold px-4 py-2 rounded-xl shadow-md shadow-emerald-100 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Đánh dấu hoàn thành</span>
            </button>
          </div>

          {/* Tabs header */}
          <div className="flex border-b border-gray-100 gap-6">
            <button
              onClick={() => setActiveTab("discussion")}
              className={`pb-3 text-xs font-extrabold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                activeTab === "discussion"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-400 hover:text-gray-900"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Thảo luận bài học
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`pb-3 text-xs font-extrabold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                activeTab === "notes"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-400 hover:text-gray-900"
              }`}
            >
              <Edit3 className="w-4 h-4" />
              Ghi chú của tôi
            </button>
          </div>

          {/* Tabs Content */}
          <div className="flex-grow">
            {activeTab === "discussion" ? (
              <div className="space-y-6">
                <form onSubmit={handleAddComment} className="flex gap-3">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Đặt câu hỏi hoặc chia sẻ ý kiến về bài học này..."
                    className="flex-1 text-xs rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  />
                  <button
                    type="submit"
                    className="bg-primary text-white text-xs font-extrabold px-5 rounded-xl hover:opacity-95 transition-all cursor-pointer"
                  >
                    Gửi bình luận
                  </button>
                </form>

                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="space-y-3">
                      {/* Main comment card */}
                      <div className="flex gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 relative group">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary text-white font-extrabold text-2xs flex items-center justify-center shrink-0">
                          {comment.userFullName.substring(0, 1)}
                        </div>
                        <div className="space-y-2 flex-grow min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-gray-800">{comment.userFullName}</span>
                            {comment.userRole !== "STUDENT" && (
                              <span className="text-[9px] font-black uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                {comment.userRole === "TEACHER" ? "Giảng viên" : "Admin"}
                              </span>
                            )}
                            <span className="text-3xs text-gray-400 font-semibold">
                              {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString("vi-VN") : "Vừa xong"}
                            </span>
                          </div>

                          {editingCommentId === comment.id ? (
                            <div className="space-y-2 mt-1">
                              <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full text-xs rounded-xl border border-gray-200 p-2 outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                                rows={2}
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setEditingCommentId(null)}
                                  className="text-3xs font-bold text-gray-500 hover:text-gray-900 px-2 py-1 rounded"
                                >
                                  Hủy
                                </button>
                                <button
                                  onClick={() => handleEditComment(comment.id)}
                                  className="text-3xs font-bold bg-primary text-white px-2.5 py-1 rounded-lg"
                                >
                                  Lưu
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-600 leading-relaxed break-words">{comment.content}</p>
                          )}

                          <div className="flex items-center gap-4 text-3xs font-bold text-gray-400 pt-1">
                            <button
                              onClick={() => {
                                setReplyingTo(replyingTo === comment.id ? null : comment.id);
                                setReplyText("");
                              }}
                              className="hover:text-primary transition-colors cursor-pointer"
                            >
                              Phản hồi
                            </button>
                            {(comment.userId === user?.id) && (
                              <button
                                onClick={() => {
                                  setEditingCommentId(comment.id);
                                  setEditText(comment.content);
                                }}
                                className="hover:text-primary transition-colors cursor-pointer"
                              >
                                Sửa
                              </button>
                            )}
                            {(comment.userId === user?.id || user?.role === "ADMIN" || user?.role === "TEACHER") && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="hover:text-red-500 transition-colors cursor-pointer"
                              >
                                Xóa
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Replying form */}
                      {replyingTo === comment.id && (
                        <div className="pl-10 flex gap-2">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={`Trả lời ${comment.userFullName}...`}
                            className="flex-1 text-xs rounded-xl border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                          />
                          <button
                            onClick={() => handleReplyComment(comment.id)}
                            className="bg-primary text-white text-3xs font-bold px-4 rounded-xl hover:opacity-95 transition-all cursor-pointer"
                          >
                            Gửi
                          </button>
                        </div>
                      )}

                      {/* Replies loop (Indented) */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="pl-10 space-y-3 border-l-2 border-gray-100/80 ml-4">
                          {comment.replies.map((reply: any) => (
                            <div key={reply.id} className="flex gap-3 p-3 bg-gray-50/50 rounded-2xl border border-gray-100/50 relative group">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-secondary text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">
                                {reply.userFullName.substring(0, 1)}
                              </div>
                              <div className="space-y-1.5 flex-grow min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-extrabold text-gray-800">{reply.userFullName}</span>
                                  {reply.userRole !== "STUDENT" && (
                                    <span className="text-[9px] font-black uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                      {reply.userRole === "TEACHER" ? "Giảng viên" : "Admin"}
                                    </span>
                                  )}
                                  <span className="text-3xs text-gray-400 font-semibold">
                                    {reply.createdAt ? new Date(reply.createdAt).toLocaleDateString("vi-VN") : "Vừa xong"}
                                  </span>
                                </div>

                                {editingCommentId === reply.id ? (
                                  <div className="space-y-2 mt-1">
                                    <textarea
                                      value={editText}
                                      onChange={(e) => setEditText(e.target.value)}
                                      className="w-full text-xs rounded-xl border border-gray-200 p-2 outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                                      rows={2}
                                    />
                                    <div className="flex gap-2 justify-end">
                                      <button
                                        onClick={() => setEditingCommentId(null)}
                                        className="text-3xs font-bold text-gray-500 hover:text-gray-900 px-2 py-1 rounded"
                                      >
                                        Hủy
                                      </button>
                                      <button
                                        onClick={() => handleEditComment(reply.id)}
                                        className="text-3xs font-bold bg-primary text-white px-2.5 py-1 rounded-lg"
                                      >
                                        Lưu
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-600 leading-relaxed break-words">{reply.content}</p>
                                )}

                                <div className="flex items-center gap-4 text-3xs font-bold text-gray-400 pt-1">
                                  {(reply.userId === user?.id) && (
                                    <button
                                      onClick={() => {
                                        setEditingCommentId(reply.id);
                                        setEditText(reply.content);
                                      }}
                                      className="hover:text-primary transition-colors cursor-pointer"
                                    >
                                      Sửa
                                    </button>
                                  )}
                                  {(reply.userId === user?.id || user?.role === "ADMIN" || user?.role === "TEACHER") && (
                                    <button
                                      onClick={() => handleDeleteComment(reply.id)}
                                      className="hover:text-red-500 transition-colors cursor-pointer"
                                    >
                                      Xóa
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-semibold text-gray-400 uppercase">
                  <span>Tự động lưu ghi chú</span>
                  <span className="text-3xs text-gray-300">Dữ liệu lưu trữ trên thiết bị</span>
                </div>
                <textarea
                  rows={6}
                  value={personalNotes}
                  onChange={(e) => handleSaveNotes(e.target.value)}
                  placeholder="Nhập ghi chú quan trọng, cấu trúc câu hay từ vựng mới học..."
                  className="w-full text-xs rounded-2xl border border-gray-200 p-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Outline Curriculum Navigator */}
        <div className="w-80 border-l border-gray-100 bg-gray-50/40 overflow-y-auto hidden lg:flex flex-col">
          <div className="p-5 border-b border-gray-100 bg-white shrink-0">
            <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Chương trình học tập
            </h3>
          </div>

          <div className="flex-1 divide-y divide-gray-100">
            {courseData?.curriculum?.map((chapter) => (
              <div key={chapter.id} className="p-4 space-y-3 bg-white">
                <h4 className="font-extrabold text-gray-800 text-xs leading-relaxed">
                  {chapter.title}
                </h4>
                <div className="space-y-2">
                  {chapter.lessons.map((lesson) => {
                    const isSelected = activeLesson.id === lesson.id;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setActiveLesson(lesson)}
                        className={`w-full text-left p-3 rounded-2xl flex items-start gap-2.5 border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-pink-50/40 border-primary text-primary"
                            : "bg-white border-gray-100 hover:border-pink-200 text-gray-600"
                        }`}
                      >
                        {lesson.type === "video" ? (
                          <Video className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                        ) : lesson.type === "audio" ? (
                          <Volume2 className="w-4 h-4 shrink-0 mt-0.5 text-secondary" />
                        ) : lesson.type === "quiz" ? (
                          <HelpCircle className="w-4 h-4 shrink-0 mt-0.5 text-pink-500" />
                        ) : (
                          <FileText className="w-4 h-4 shrink-0 mt-0.5 text-purple-500" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold leading-tight line-clamp-2">{lesson.title}</p>
                          <span className="text-3xs text-gray-400 font-semibold block mt-1">
                            Thời lượng: {lesson.duration} phút
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Modal danh sách bài thi/bài tập */}
      <Modal
        isOpen={showExamModal}
        onClose={() => setShowExamModal(false)}
        title="Danh sách bài tập / Đề thi"
      >
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-500">Chọn một bài thi/bài tập dưới đây để bắt đầu làm bài:</p>
          {examsList.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 rounded-2xl text-xs text-gray-400 font-bold">
              Khóa học này hiện chưa có bài thi hay bài tập nào được xuất bản.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {examsList.map((exam) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:border-primary/20 transition-all"
                >
                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold text-gray-800">{exam.title}</h4>
                    <p className="text-3xs text-gray-400 font-bold">
                      Thời gian: {exam.durationMinutes} phút | Điểm đỗ: {exam.passingScore}%
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowExamModal(false);
                      router.push(`/student/exams/${exam.id}`);
                    }}
                    className="bg-primary text-white text-3xs font-extrabold px-3 py-1.5 rounded-xl hover:opacity-90 transition-all cursor-pointer"
                  >
                    Làm bài
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
      {course?.id && (
        <AIAssistantModal 
          courseId={course.id} 
          disabled={activeLesson?.type === "quiz"} 
        />
      )}
    </div>
  );
}
