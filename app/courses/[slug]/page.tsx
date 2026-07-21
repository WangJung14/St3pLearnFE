"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ArrowLeft, BookOpen, Loader2, Star, Users, XCircle } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ChapterAccordion from "@/components/courses/ChapterAccordion";
import CourseCheckoutCard, { type CourseDetail } from "@/components/courses/CourseCheckoutCard";
import VideoModal from "@/components/courses/VideoModal";
import CourseReportForm from "@/components/courses/CourseReportForm";
import CourseReviews from "@/components/courses/CourseReviews";
import { Modal } from "@/components/ui/Modal";
import { API_BASE_URL } from "@/lib/apiConfig";
import { apiFetch } from "@/lib/apiFetch";
import { unwrapData, unwrapPageContent, type ApiResponse, type PagePayload } from "@/lib/apiResponses";
import type { CheckoutResponse } from "@/lib/endpointTypes";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

interface EnrollmentItem { courseId: string }

export default function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { token, isAuthenticated } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [removeReason, setRemoveReason] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [preview, setPreview] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [couponCode, setCouponCode] = useState("");

  const { data: course, error, isLoading, mutate } = useSWR<CourseDetail>(
    `/api/courses/p/${encodeURIComponent(slug)}`,
    async (url: string) => {
      const body = await apiFetch<ApiResponse<CourseDetail> | CourseDetail>(url).catch(() => null);
      if (!body) throw new Error("Course Service trả về dữ liệu rỗng hoặc không tải được");
      const value = unwrapData<CourseDetail>(body);
      return { ...value, curriculum: value.curriculum ?? [], avgRating: value.avgRating ?? 0, totalStudents: value.totalStudents ?? 0 };
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const { data: enrollments = [], mutate: mutateEnrollments } = useSWR<EnrollmentItem[]>(
    token ? ["/api/enrollments/my-courses?page=0&size=100", token] : null,
    async ([path]: readonly [string, string]) => unwrapPageContent<EnrollmentItem>(await apiFetch<ApiResponse<PagePayload<EnrollmentItem> | EnrollmentItem[]> | PagePayload<EnrollmentItem> | EnrollmentItem[]>(path)),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const { user } = useAuth();
  const enrolled = Boolean(course && enrollments.some((item) => item.courseId === course.id));
  const hasAccess = Boolean(
    enrolled || 
    user?.role === "ADMIN" || 
    (user?.role === "TEACHER" && course?.instructorId && user?.id === course.instructorId)
  );

  const totals = useMemo(() => {
    const lessons = course?.curriculum?.flatMap((chapter) => chapter.lessons) ?? [];
    return { lessons: lessons.length, duration: lessons.reduce((sum, lesson) => sum + (lesson.duration ?? 0), 0) };
  }, [course]);

  const enroll = async () => {
    if (!course) return;
    if (!isAuthenticated) { router.push(`/student/login?redirect=${encodeURIComponent(`/courses/${slug}`)}`); return; }
    if (hasAccess) { router.push(`/student/player/${slug}`); return; }
    setEnrolling(true);
    try {
      if (course.price > 0) {
        const checkout = unwrapData<CheckoutResponse>(await apiFetch<ApiResponse<CheckoutResponse> | CheckoutResponse>("/api/payment/orders/checkout", { method: "POST", body: JSON.stringify({ courseId: course.id, couponCode: couponCode.trim() || undefined, originalAmount: course.price }) }));
        if (!checkout.paymentUrl) throw new Error("Payment Service không trả paymentUrl");
        window.location.assign(checkout.paymentUrl);
        return;
      }
      await apiFetch("/api/enrollments", { method: "POST", body: JSON.stringify({ courseId: course.id }) });
      await mutateEnrollments();
      toast.success("Đăng ký khóa học thành công");
      router.push(`/student/player/${slug}`);
    } catch (cause) { toast.error("Không thể đăng ký khóa học", cause instanceof Error ? cause.message : undefined); }
    finally { setEnrolling(false); }
  };

  const handleAdminRemove = () => {
    setRemoveReason("");
    setRemoveModalOpen(true);
  };

  const confirmAdminRemove = async () => {
    if (!removeReason.trim()) {
      toast.warning("Vui lòng nhập lý do gỡ khóa học");
      return;
    }
    setRemoveModalOpen(false);
    try {
      await apiFetch(`/api/admin/courses/${course?.id}/remove`, {
        method: "POST",
        body: JSON.stringify({ reason: removeReason.trim() }),
      });
      toast.success("Đã gỡ khóa học thành công");
      router.push("/courses");
    } catch (cause) {
      toast.error("Không thể gỡ khóa học", cause instanceof Error ? cause.message : "Đã có lỗi xảy ra");
    }
  };

  return <div className="flex min-h-screen flex-col bg-gray-50"><Header /><main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 lg:px-8">
    <Link href="/courses" className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-500"><ArrowLeft className="h-4 w-4" />Danh sách khóa học</Link>
    {isLoading && <div className="flex justify-center py-28"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}
    {!isLoading && error && <div className="rounded-2xl border border-red-100 bg-red-50 p-10 text-center"><h1 className="text-xl font-black text-red-700">Không tải được khóa học</h1><p className="mt-2 text-sm text-red-600">{error instanceof Error ? error.message : "Course Service không phản hồi."}</p><button onClick={() => mutate()} className="mt-4 rounded-xl bg-red-600 px-4 py-2 font-bold text-white">Thử lại</button></div>}
    {!isLoading && !error && course && <div className="grid gap-8 lg:grid-cols-[1fr_360px]"><div className="space-y-7"><section className="rounded-3xl bg-gradient-to-br from-secondary to-primary p-8 text-white"><span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">{course.level}</span><h1 className="mt-4 text-3xl font-black">{course.title}</h1><p className="mt-3 leading-relaxed text-white/85">{course.shortDescription}</p><div className="mt-5 flex flex-wrap gap-5 text-sm"><span className="flex items-center gap-1"><Star className="h-4 w-4 fill-current" />{course.avgRating || "Chưa có đánh giá"}</span><span className="flex items-center gap-1"><Users className="h-4 w-4" />{course.totalStudents} học viên</span><span>Giảng viên: {course.instructorName ?? "Chưa cập nhật"}</span></div></section>
      <section className="rounded-2xl border bg-white p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-black">Giới thiệu khóa học</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-600">{course.description}</p></div><div className="flex flex-col gap-3 shrink-0 items-end"><CourseReportForm courseId={course.id} slug={slug} />{user?.role === "ADMIN" && <button onClick={handleAdminRemove} className="inline-flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer"><XCircle className="h-4 w-4" /> Gỡ khóa học (Admin)</button>}</div></div></section>
      <section className="rounded-2xl border bg-white p-6"><h2 className="mb-4 flex items-center gap-2 text-xl font-black"><BookOpen className="h-5 w-5 text-primary" />Chương trình học</h2>{course.curriculum.length === 0 ? <div className="rounded-xl border border-dashed p-8 text-center text-sm text-gray-500">Giảng viên chưa công bố nội dung chương trình.</div> : <ChapterAccordion curriculum={course.curriculum} expandedChapters={expanded} toggleChapter={(id) => setExpanded((value) => ({ ...value, [id]: value[id] === false }))} setActivePreviewVideo={setPreview} />}</section>
      <section className="rounded-3xl border bg-white p-6 shadow-soft">
        <CourseReviews courseId={course.id} hasAccess={hasAccess} isTeacherOrAdmin={user?.role === "TEACHER" || user?.role === "ADMIN"} />
      </section>
    </div><aside className="space-y-3">{course.price > 0 && !enrolled && <input value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} placeholder="Mã giảm giá (nếu có)" className="w-full rounded-xl border bg-white p-3 text-sm" />}<div className={enrolling ? "pointer-events-none opacity-60" : ""}><CourseCheckoutCard courseData={course} totalDuration={totals.duration} totalLessons={totals.lessons} handleEnroll={enroll} setActivePreviewVideo={setPreview} enrolled={hasAccess} /></div>{enrolling && <p className="flex items-center justify-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" />Đang xử lý...</p>}</aside></div>}
  </main><Footer />
  <VideoModal activePreviewVideo={preview} onClose={() => setPreview(null)} />
  {removeModalOpen && (
    <Modal
      isOpen={true}
      onClose={() => setRemoveModalOpen(false)}
      title="Gỡ khóa học vi phạm"
      className="w-full max-w-[512px]"
      footer={
        <button
          onClick={confirmAdminRemove}
          className="rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition-all cursor-pointer"
        >
          Xác nhận gỡ
        </button>
      }
    >
      <div className="space-y-4">
        <label className="block text-sm font-bold text-gray-700">Lý do gỡ khóa học</label>
        <textarea
          value={removeReason}
          onChange={(e) => setRemoveReason(e.target.value)}
          rows={4}
          placeholder="Nhập lý do chi tiết về vi phạm điều khoản của khóa học..."
          className="w-full text-xs rounded-xl border border-gray-200 p-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        />
      </div>
    </Modal>
  )}
</div>;
}
