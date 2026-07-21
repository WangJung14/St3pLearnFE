"use client";

import React, { use, useState, useEffect } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/apiConfig";
import { ArrowLeft, Play, FileText, CheckCircle2, MessageSquare, Edit3, ChevronRight, Video, Volume2, BookOpen } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

interface Lesson {
  id: string;
  title: string;
  orderIndex: number;
  duration: number;
  isPreview: boolean;
  videoUrl?: string;
  audioUrl?: string;
  pdfUrl?: string;
  type?: "video" | "audio" | "pdf";
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

// Fallback Mock data for course player if API fails or returns empty curriculum
const MOCK_PLAYERS: Record<string, CourseDetail> = {
  "ielts-masterclass-step-by-step-7-5": {
    id: "ielts-1",
    title: "IELTS Masterclass: Step-by-Step 7.5+",
    slug: "ielts-masterclass-step-by-step-7-5",
    curriculum: [
      {
        id: "ch-1",
        title: "Chương 1: Giới thiệu và Cấu trúc đề thi IELTS mới nhất",
        orderIndex: 1,
        lessons: [
          {
            id: "les-1",
            title: "Tổng quan cấu trúc bài thi IELTS Academic & General Training",
            orderIndex: 1,
            duration: 12,
            isPreview: true,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            type: "video"
          },
          {
            id: "les-2",
            title: "Tiêu chí chấm điểm 4 kỹ năng và Chiến lược đặt mục tiêu",
            orderIndex: 2,
            duration: 15,
            isPreview: false,
            pdfUrl: "#",
            type: "pdf"
          },
        ],
      },
      {
        id: "ch-2",
        title: "Chương 2: IELTS Listening & Reading Mastery",
        orderIndex: 2,
        lessons: [
          {
            id: "les-3",
            title: "Chiến thuật Skimming & Scanning siêu tốc trong Reading",
            orderIndex: 1,
            duration: 20,
            isPreview: true,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            type: "video"
          },
          {
            id: "les-4",
            title: "Mẹo giải quyết dạng bài Matching Headings & Multiple Choice",
            orderIndex: 2,
            duration: 25,
            isPreview: false,
            audioUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            type: "audio"
          }
        ]
      }
    ]
  }
};

export default function LearningPlayerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const { token, isAuthenticated } = useAuth();
  const router = useRouter();
  const toast = useToast();

  // Các trạng thái bài học đang kích hoạt
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState<"discussion" | "notes">("discussion");
  const [personalNotes, setPersonalNotes] = useState("");
  
  // Trạng thái bình luận thảo luận bài học
  const [comments, setComments] = useState<Array<{ id: number; author: string; text: string; date: string }>>([
    { id: 1, author: "Bùi Gia Hân", text: "Video giải thích cực kỳ dễ hiểu ạ, đặc biệt là phần Skimming và Scanning trong IELTS Reading.", date: "2 giờ trước" },
    { id: 2, author: "Trần Tuấn Kiệt", text: "Cho em hỏi tài liệu PDF của chương 1 tải ở đâu ạ?", date: "1 ngày trước" }
  ]);
  const [newComment, setNewComment] = useState("");

  // Tải chi tiết thông tin giáo trình khóa học từ API Gateway
  const { data: course, error } = useSWR<CourseDetail>(
    `${API_BASE_URL}/api/courses/p/${slug}`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Fetch failed");
      const body = await res.json();
      return body.data;
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  let courseData = course;
  if (error || !course) {
    courseData = MOCK_PLAYERS[slug] || MOCK_PLAYERS["ielts-masterclass-step-by-step-7-5"];
  }

  // Thiết lập bài học đầu tiên mặc định khi tải giáo trình thành công
  useEffect(() => {
    if (courseData?.curriculum?.length && courseData.curriculum[0].lessons.length) {
      setActiveLesson(courseData.curriculum[0].lessons[0]);
    }
  }, [courseData]);

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

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment) return;
    setComments((prev) => [
      ...prev,
      { id: Date.now(), author: "Học Viên", text: newComment, date: "Vừa xong" }
    ]);
    setNewComment("");
  };

  const handleCompleteLesson = () => {
    toast.success("Đã hoàn thành bài học", "+5 XP cho tiến độ học tập.");
    try {
      const savedXp = localStorage.getItem("edu_xp");
      const currentXp = savedXp ? parseInt(savedXp) : 340;
      localStorage.setItem("edu_xp", (currentXp + 5).toString());
    } catch (err) {}
  };

  // Chuyển hướng sang trang làm bài kiểm tra trắc nghiệm/phát âm
  const handleTakeQuiz = () => {
    if (activeLesson) {
      router.push(`/student/quiz/${activeLesson.id}?redirect=/student/player/${slug}`);
    }
  };

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
            href="/student"
            className="p-2 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-primary transition-colors"
            title="Trở về Dashboard"
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
              activeLesson.videoUrl.includes("youtube.com/embed") || activeLesson.type === 'youtube' ? (
                <iframe
                  src={activeLesson.videoUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={activeLesson.videoUrl}
                  controls
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
            ) : (
              <div className="w-full h-full bg-slate-50 flex flex-col justify-center items-center p-8 text-center space-y-4">
                <FileText className="w-16 h-16 text-primary" />
                <div className="space-y-1">
                  <h3 className="font-extrabold text-gray-800 text-base">Tài liệu học tập PDF</h3>
                  <p className="text-xs text-gray-500 max-w-sm">Tài liệu đọc hiểu lý thuyết chi tiết bổ sung cho chương học.</p>
                </div>
                <div className="flex gap-3">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      toast.success("Đã tải tài liệu PDF");
                    }}
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
            <h2 className="font-black text-gray-900 text-base">{activeLesson.title}</h2>
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
                    <div key={comment.id} className="flex gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary text-white font-extrabold text-2xs flex items-center justify-center">
                        {comment.author.substring(0, 1)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-gray-800">{comment.author}</span>
                          <span className="text-3xs text-gray-400 font-semibold">{comment.date}</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{comment.text}</p>
                      </div>
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
                        {lesson.videoUrl ? (
                          <Video className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                        ) : lesson.audioUrl ? (
                          <Volume2 className="w-4 h-4 shrink-0 mt-0.5 text-secondary" />
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
    </div>
  );
}
