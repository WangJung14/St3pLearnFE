"use client";

import { use, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import useSWR, { mutate as globalMutate } from "swr";
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  Film,
  Loader2,
  Plus,
  RotateCcw,
  Rocket,
  Send,
  Trash2,
  Video,
} from "lucide-react";
import { RoleGuard } from "@/components/guards/RoleGuard";
import LessonContentUploader from "@/components/courses/LessonContentUploader";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/apiConfig";
import { buildAuthHeaders } from "@/lib/authHeaders";
import { apiFetch } from "@/lib/apiFetch";
import { useToast } from "@/components/ui/Toast";

type LessonType = "VIDEO" | "AUDIO" | "PDF" | "SCORM" | "QUIZ";
type CourseStatus =
  | "DRAFT"
  | "PENDING"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "PUBLISHED"
  | "ARCHIVED";

interface LessonContent {
  contentType: string;
  storageUrl: string;
  fileSize?: number;
  metadata?: Record<string, unknown>;
}

interface Lesson {
  id: string;
  title: string;
  orderIndex: number;
  duration: number;
  lessonType: LessonType;
  isPreview: boolean;
  content?: LessonContent | null;
}

interface Chapter {
  id: string;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
}

interface CourseSnapshot {
  id: string;
  title: string;
  status: CourseStatus;
}

interface ApiResponse<T> {
  data?: T;
  message?: string;
}

interface ChapterResponse {
  id: string;
  title: string;
  displayOrder?: number;
  orderIndex?: number;
}

interface LessonResponse {
  id: string;
  title: string;
  lessonType?: LessonType;
  durationSeconds?: number;
  duration?: number;
  displayOrder?: number;
  orderIndex?: number;
  isPreview?: boolean;
  content?: LessonContent | null;
}

function unwrapData<T>(body: ApiResponse<T> | T): T {
  return (body as ApiResponse<T>).data ?? (body as T);
}

function normalizeLesson(raw: LessonResponse): Lesson {
  return {
    id: raw.id,
    title: raw.title,
    lessonType: raw.lessonType ?? "VIDEO",
    duration: Math.max(1, Math.round(((raw.durationSeconds ?? raw.duration ?? 0) || 0) / 60)),
    orderIndex: raw.displayOrder ?? raw.orderIndex ?? 1,
    isPreview: raw.isPreview ?? false,
    content: raw.content ?? null,
  };
}

function normalizeChapter(raw: ChapterResponse, lessons: Lesson[]): Chapter {
  return {
    id: raw.id,
    title: raw.title,
    orderIndex: raw.displayOrder ?? raw.orderIndex ?? 1,
    lessons: lessons.sort((a, b) => a.orderIndex - b.orderIndex),
  };
}

function statusLabel(status?: CourseStatus) {
  switch (status) {
    case "PUBLISHED":
      return "Đã xuất bản";
    case "APPROVED":
      return "Đã được duyệt";
    case "PENDING":
    case "PENDING_REVIEW":
      return "Đang chờ duyệt";
    case "REJECTED":
      return "Bị từ chối";
    case "ARCHIVED":
      return "Đã lưu trữ";
    default:
      return "Bản nháp";
  }
}

function contentLabel(lesson: Lesson) {
  if (lesson.content?.contentType) return lesson.content.contentType.replace("_CLOUDINARY", "");
  return lesson.lessonType;
}

function CurriculumBuilderContent({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.courseId;

  const router = useRouter();
  const { token } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<"curriculum" | "workflow">("curriculum");
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newLessonTitle, setNewLessonTitle] = useState<Record<string, string>>({});
  const [lessonDuration, setLessonDuration] = useState<Record<string, string>>({});
  const [lessonType, setLessonType] = useState<Record<string, LessonType>>({});
  const [isSavingChapter, setIsSavingChapter] = useState(false);
  const [processingAction, setProcessingAction] = useState<"submit" | "publish" | "cancel" | null>(null);

  const { data: courseSnapshot, mutate: mutateCourseSnapshot } = useSWR<CourseSnapshot>(
    token ? [`/api/courses/${courseId}`, token] : null,
    async ([path]) => {
      const body = await apiFetch<ApiResponse<CourseSnapshot> | CourseSnapshot>(path);
      return unwrapData<CourseSnapshot>(body);
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const {
    data: apiChapters,
    error: curriculumError,
    isLoading,
    mutate: mutateCurriculum,
  } = useSWR<Chapter[]>(
    token ? [`${API_BASE_URL}/api/courses/${courseId}/chapters`, token] : null,
    async ([url, currentToken]) => {
      const chapterRes = await fetch(url, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (!chapterRes.ok) throw new Error("Fetch chapters failed");
      const chapterBody = await chapterRes.json() as ApiResponse<ChapterResponse[]> | ChapterResponse[];
      const rawChapters = unwrapData<ChapterResponse[]>(chapterBody);

      const chapters = await Promise.all(
        rawChapters.map(async (chapter) => {
          const lessonsRes = await fetch(
            `${API_BASE_URL}/api/courses/${courseId}/chapters/${chapter.id}/lessons`,
            { headers: { Authorization: `Bearer ${currentToken}` } }
          );

          if (!lessonsRes.ok) return normalizeChapter(chapter, []);

          const lessonsBody = await lessonsRes.json() as ApiResponse<LessonResponse[]> | LessonResponse[];
          const lessons = unwrapData<LessonResponse[]>(lessonsBody).map(normalizeLesson);
          return normalizeChapter(chapter, lessons);
        })
      );

      return chapters.sort((a, b) => a.orderIndex - b.orderIndex);
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const chapters = apiChapters ?? [];

  const handleAddChapter = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newChapterTitle.trim() || !token) return;

    setIsSavingChapter(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}/chapters`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(token),
        },
        body: JSON.stringify({ title: newChapterTitle.trim() }),
      });

      const body = await res.json().catch(() => null) as { message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Không thêm được chương học");

      setNewChapterTitle("");
      await mutateCurriculum();
      toast.success("Đã thêm chương học mới");
    } catch (cause) {
      toast.error("Không thể thêm chương học", cause instanceof Error ? cause.message : undefined);
    } finally {
      setIsSavingChapter(false);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa chương học này không?")) return;
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}/chapters/${chapterId}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token),
      });
      const body = await res.json().catch(() => null) as { message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Không xóa được chương học");

      await mutateCurriculum();
      toast.success("Đã xóa chương học");
    } catch (cause) {
      toast.error("Không thể xóa chương học", cause instanceof Error ? cause.message : undefined);
    }
  };

  const handleAddLesson = async (chapterId: string) => {
    const title = newLessonTitle[chapterId]?.trim();
    const durationMinutes = Number(lessonDuration[chapterId] || "15");
    const selectedLessonType = lessonType[chapterId] ?? "VIDEO";
    if (!title || !token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}/chapters/${chapterId}/lessons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(token),
        },
        body: JSON.stringify({
          title,
          lessonType: selectedLessonType,
          durationSeconds: Math.max(1, durationMinutes) * 60,
          isPreview: false,
        }),
      });
      const body = await res.json().catch(() => null) as { message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Không thêm được bài học");

      setNewLessonTitle((current) => ({ ...current, [chapterId]: "" }));
      setLessonDuration((current) => ({ ...current, [chapterId]: "15" }));
      await mutateCurriculum();
      toast.success("Đã thêm bài học mới");
    } catch (cause) {
      toast.error("Không thể thêm bài học", cause instanceof Error ? cause.message : undefined);
    }
  };

  const handleDeleteLesson = async (chapterId: string, lessonId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài học này không?")) return;
    if (!token) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`,
        {
          method: "DELETE",
          headers: buildAuthHeaders(token),
        }
      );
      const body = await res.json().catch(() => null) as { message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Không xóa được bài học");

      await mutateCurriculum();
      toast.success("Đã xóa bài học");
    } catch (cause) {
      toast.error("Không thể xóa bài học", cause instanceof Error ? cause.message : undefined);
    }
  };

  const handleCourseAction = async (action: "submit" | "publish" | "cancel") => {
    if (!token) return;

    const copy = {
      submit: "Gửi khóa học cho Admin duyệt?",
      publish: "Xuất bản khóa học đã được duyệt?",
      cancel: "Thu hồi yêu cầu duyệt và đưa khóa học về bản nháp?",
    };

    if (!window.confirm(copy[action])) return;

    setProcessingAction(action);
    try {
      const endpoint =
        action === "submit"
          ? "submit"
          : action === "publish"
          ? "publish"
          : "cancel-submit";

      const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}/${endpoint}`, {
        method: "POST",
        headers: buildAuthHeaders(token),
      });
      const body = await res.json().catch(() => null) as { message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Không cập nhật được trạng thái khóa học");

      await mutateCourseSnapshot();
      await globalMutate((key) =>
        (typeof key === "string" && key.includes("/api/courses/my-courses")) ||
        (Array.isArray(key) && typeof key[0] === "string" && key[0].includes("/api/courses/my-courses"))
      );
      toast.success(body?.message ?? "Đã cập nhật trạng thái khóa học");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không cập nhật được trạng thái khóa học";
      toast.error("Không cập nhật được trạng thái khóa học", message);
    } finally {
      setProcessingAction(null);
    }
  };

  const totalLessons = chapters.reduce((sum, chapter) => sum + chapter.lessons.length, 0);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      <main className="mx-auto flex w-full max-w-5xl flex-grow flex-col gap-8 px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => router.push("/teacher")}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Trở về Dashboard</span>
          </button>

          {curriculumError && (
            <span className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-3xs font-extrabold text-red-600">
              Không kết nối được Course Service
            </span>
          )}
        </div>

        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-5 border-b border-gray-50 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <h1 className="flex items-center gap-2 text-2xl font-black text-gray-900">
                <Film className="h-6 w-6 text-primary" />
                Thiết kế chương trình giảng dạy
              </h1>
              <p className="max-w-2xl text-xs leading-relaxed text-gray-500">
                {courseSnapshot?.title ?? "Quản lý cấu trúc bài học, nội dung đa phương tiện và quy trình duyệt khóa học."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-gray-100 px-3 py-1.5 text-3xs font-black uppercase text-gray-600">
                {statusLabel(courseSnapshot?.status)}
              </span>
              <span className="rounded-full bg-pink-50 px-3 py-1.5 text-3xs font-black uppercase text-primary">
                {totalLessons} bài học
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              { id: "curriculum", label: "Giáo trình", icon: Film },
              { id: "workflow", label: "Duyệt & xuất bản", icon: Rocket },
            ].map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-extrabold transition-all ${
                    selected
                      ? "bg-primary text-white shadow-md shadow-pink-100"
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        {activeTab === "workflow" && (
          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-soft">
            <div className="space-y-1 border-b border-gray-50 pb-4">
              <h2 className="flex items-center gap-2 text-xl font-black text-gray-900">
                <Rocket className="h-5 w-5 text-primary" />
                Quy trình duyệt khóa học
              </h2>
              <p className="text-xs leading-relaxed text-gray-500">
                Gửi khóa học sau khi đã có bài học, chờ Admin duyệt, rồi xuất bản khi trạng thái là APPROVED.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <button
                onClick={() => handleCourseAction("submit")}
                disabled={processingAction !== null || !["DRAFT", "REJECTED"].includes(courseSnapshot?.status ?? "DRAFT")}
                className="flex items-center justify-center gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-xs font-extrabold text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processingAction === "submit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Gửi duyệt
              </button>
              <button
                onClick={() => handleCourseAction("cancel")}
                disabled={processingAction !== null || courseSnapshot?.status !== "PENDING_REVIEW"}
                className="flex items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 text-xs font-extrabold text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processingAction === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Thu hồi
              </button>
              <button
                onClick={() => handleCourseAction("publish")}
                disabled={processingAction !== null || courseSnapshot?.status !== "APPROVED"}
                className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-xs font-extrabold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processingAction === "publish" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Xuất bản
              </button>
            </div>
          </section>
        )}

        {activeTab === "curriculum" && (
          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-soft">
            <div className="space-y-1 border-b border-gray-50 pb-4">
              <h2 className="text-xl font-black text-gray-900">Nội dung bài học</h2>
              <p className="text-xs leading-relaxed text-gray-500">
                Thêm chương, bài học và upload video/audio/PDF qua Cloudinary signature.
              </p>
            </div>

            <form onSubmit={handleAddChapter} className="mt-6 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                required
                value={newChapterTitle}
                onChange={(event) => setNewChapterTitle(event.target.value)}
                placeholder="Ví dụ: Chương 1: Danh từ, Đại từ và Cấu trúc bổ ngữ..."
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-xs outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={isSavingChapter}
                className="flex shrink-0 items-center justify-center gap-1 rounded-xl bg-primary px-6 py-3 text-xs font-extrabold text-white shadow-md shadow-pink-200 transition-opacity hover:opacity-95 disabled:opacity-50"
              >
                {isSavingChapter ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Thêm chương
              </button>
            </form>

            {isLoading && (
              <div className="mt-8 flex items-center justify-center gap-2 rounded-2xl bg-gray-50 py-10 text-sm font-bold text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Đang tải giáo trình...
              </div>
            )}

            {!isLoading && chapters.length === 0 && (
              <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
                <p className="text-sm font-bold text-gray-500">Chưa có chương học nào.</p>
              </div>
            )}

            <div className="mt-8 space-y-6">
              {chapters.map((chapter) => (
                <article key={chapter.id} className="space-y-4 rounded-3xl border border-gray-100 bg-gray-50 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200/60 pb-3">
                    <h3 className="flex-1 text-sm font-extrabold leading-relaxed text-gray-900">
                      {chapter.title}
                    </h3>
                    <button
                      onClick={() => handleDeleteChapter(chapter.id)}
                      className="flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-500 transition-colors hover:bg-red-100 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Xóa chương
                    </button>
                  </div>

                  <div className="space-y-3">
                    {chapter.lessons.length > 0 ? (
                      chapter.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:shadow-soft"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {lesson.lessonType === "VIDEO" || lesson.lessonType === "AUDIO" ? (
                              <Video className="h-5 w-5 shrink-0 text-primary" />
                            ) : (
                              <FileText className="h-5 w-5 shrink-0 text-purple-500" />
                            )}
                            <div className="min-w-0 space-y-0.5">
                              <p className="line-clamp-2 text-xs font-bold text-gray-800">{lesson.title}</p>
                              <p className="text-3xs font-bold text-gray-400">
                                {lesson.duration} phút • {contentLabel(lesson)}
                                {lesson.content?.storageUrl ? " • Đã có nội dung" : " • Chưa upload"}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <LessonContentUploader
                              courseId={courseId}
                              chapterId={chapter.id}
                              lessonId={lesson.id}
                              lessonType={lesson.lessonType}
                              token={token}
                              onUploaded={() => mutateCurriculum()}
                            />
                            <button
                              onClick={() => handleDeleteLesson(chapter.id, lesson.id)}
                              className="rounded-xl border border-red-100 bg-red-50 p-2 text-red-500 transition-colors hover:bg-red-100"
                              title="Xóa bài học"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="pl-2 text-xs italic text-gray-400">Chưa có bài học nào trong chương này.</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2 border-t border-gray-100 pt-3 sm:grid-cols-[1fr_96px_128px_auto]">
                    <input
                      type="text"
                      value={newLessonTitle[chapter.id] || ""}
                      onChange={(event) =>
                        setNewLessonTitle((current) => ({ ...current, [chapter.id]: event.target.value }))
                      }
                      placeholder="Tên bài học mới..."
                      className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="number"
                      min={1}
                      value={lessonDuration[chapter.id] || ""}
                      onChange={(event) =>
                        setLessonDuration((current) => ({ ...current, [chapter.id]: event.target.value }))
                      }
                      placeholder="15 phút"
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
                    />
                    <select
                      value={lessonType[chapter.id] ?? "VIDEO"}
                      onChange={(event) =>
                        setLessonType((current) => ({
                          ...current,
                          [chapter.id]: event.target.value as LessonType,
                        }))
                      }
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
                    >
                      <option value="VIDEO">Video</option>
                      <option value="AUDIO">Audio</option>
                      <option value="PDF">PDF</option>
                      <option value="QUIZ">Quiz</option>
                    </select>
                    <button
                      onClick={() => handleAddLesson(chapter.id)}
                      className="flex items-center justify-center gap-1 rounded-xl bg-secondary px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-blue-100 transition-opacity hover:opacity-95"
                    >
                      <Plus className="h-4 w-4" />
                      Bài học
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default function CurriculumBuilderPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  return (
    <RoleGuard allow={["TEACHER", "ADMIN"]}>
      <CurriculumBuilderContent params={params} />
    </RoleGuard>
  );
}
