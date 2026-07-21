"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { BookOpen, Check, ChevronRight, ClipboardList, Eye, FileQuestion, Loader2, Plus, Send, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import { unwrapData, unwrapPageContent, type ApiResponse, type PagePayload } from "@/lib/apiResponses";
import type { Exam, ExamStatus, Question, QuestionBank } from "@/lib/endpointTypes";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

interface CourseOption { id: string; title: string }
interface ExamForm { courseId: string; title: string; durationMinutes: number; passingScore: number; maxAttempts: number }
const initialForm: ExamForm = { courseId: "", title: "", durationMinutes: 30, passingScore: 50, maxAttempts: 1 };

export default function TeacherExamsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<ExamForm>(initialForm);
  const [bankId, setBankId] = useState("");
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ALL" | ExamStatus>("ALL");
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const { data: exams = [], error, isLoading, mutate } = useSWR<Exam[]>(
    token ? ["/api/learning/exams", token] : null,
    async ([path]: readonly [string, string]) => unwrapData<Exam[]>(await apiFetch<ApiResponse<Exam[]> | Exam[]>(path)),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  const { data: courses = [] } = useSWR<CourseOption[]>(
    token ? ["/api/courses/my-courses?size=100", token] : null,
    async ([path]: readonly [string, string]) => unwrapPageContent<CourseOption>(await apiFetch<ApiResponse<PagePayload<CourseOption> | CourseOption[]> | PagePayload<CourseOption> | CourseOption[]>(path)),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  const { data: banks = [] } = useSWR<QuestionBank[]>(
    token ? ["/api/learning/question-banks", token] : null,
    async ([path]: readonly [string, string]) => unwrapData<QuestionBank[]>(await apiFetch<ApiResponse<QuestionBank[]> | QuestionBank[]>(path)),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  const { data: questions = [], isLoading: questionsLoading } = useSWR<Question[]>(
    token && bankId ? [`/api/learning/question-banks/${bankId}/questions`, token] : null,
    async ([path]: readonly [string, string]) => unwrapData<Question[]>(await apiFetch<ApiResponse<Question[]> | Question[]>(path)),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const availableBanks = useMemo(() => banks.filter((bank) => !form.courseId || bank.courseId === form.courseId), [banks, form.courseId]);
  const visibleExams = exams.filter((exam) => statusFilter === "ALL" || exam.status === statusFilter);
  const selectedPoints = questions.filter((question) => questionIds.includes(question.id)).reduce((sum, question) => sum + question.points, 0);

  const chooseCourse = (courseId: string) => { setForm((value) => ({ ...value, courseId })); setBankId(""); setQuestionIds([]); };
  const chooseBank = (id: string) => { setBankId(id); setQuestionIds([]); };
  const toggleQuestion = (id: string) => setQuestionIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);

  const create = async () => {
    if (!form.courseId || !form.title.trim() || questionIds.length === 0) return;
    setSaving(true);
    try {
      const body = await apiFetch<ApiResponse<Exam> | Exam>("/api/learning/exams", {
        method: "POST",
        body: JSON.stringify({ ...form, title: form.title.trim(), questionIds }),
      });
      const created = unwrapData<Exam>(body);
      toast.success("Đã tạo bản nháp bài thi", "Kiểm tra cấu hình trước khi xuất bản.");
      await mutate();
      router.push(`/teacher/exams/${created.id}`);
    } catch (cause) {
      toast.error("Không thể tạo bài thi", cause instanceof Error ? cause.message : undefined);
    } finally { setSaving(false); }
  };

  const changeStatus = async (exam: Exam, status: ExamStatus) => {
    const label = status === "PUBLISHED" ? "xuất bản" : "lưu trữ";
    if (!confirm(`Xác nhận ${label} bài thi “${exam.title}”?`)) return;
    setProcessing(exam.id);
    try {
      await apiFetch(`/api/learning/exams/${exam.id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
      await mutate();
      toast.success(`Đã ${label} bài thi`);
    } catch (cause) { toast.error(`Không thể ${label}`, cause instanceof Error ? cause.message : undefined); }
    finally { setProcessing(null); }
  };

  const remove = async (exam: Exam) => {
    if (!confirm(`Xóa bài thi “${exam.title}”? Bài đã có lượt thi sẽ được lưu trữ.`)) return;
    setProcessing(exam.id);
    try { await apiFetch(`/api/learning/exams/${exam.id}`, { method: "DELETE" }); await mutate(); toast.success("Đã xử lý bài thi"); }
    catch (cause) { toast.error("Không thể xóa bài thi", cause instanceof Error ? cause.message : undefined); }
    finally { setProcessing(null); }
  };

  return <div className="space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="flex items-center gap-2 text-2xl font-black"><ClipboardList className="text-secondary" />Quản lý bài thi</h1><p className="text-sm text-gray-500">Tạo draft, gắn câu hỏi, xuất bản và chấm bài theo một luồng.</p></div><button onClick={() => setShowCreate((value) => !value)} className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 font-bold text-white"><Plus className="h-4 w-4" />{showCreate ? "Đóng form" : "Tạo bài thi"}</button></header>

    {showCreate && <section className="space-y-6 rounded-2xl border bg-white p-5 shadow-soft">
      <div className="grid gap-2 sm:grid-cols-3">{[{ icon: BookOpen, text: "1. Chọn khóa học" }, { icon: FileQuestion, text: "2. Chọn câu hỏi" }, { icon: Check, text: "3. Tạo bản nháp" }].map(({ icon: Icon, text }) => <div key={text} className="flex items-center gap-2 rounded-xl bg-gray-50 p-3 text-xs font-bold"><Icon className="h-4 w-4 text-secondary" />{text}</div>)}</div>
      <div className="grid gap-3 md:grid-cols-2"><label className="text-xs font-bold text-gray-500">Khóa học<select value={form.courseId} onChange={(event) => chooseCourse(event.target.value)} className="mt-1 w-full rounded-xl border p-3 text-sm"><option value="">Chọn khóa học</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label><label className="text-xs font-bold text-gray-500">Tên bài thi<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-1 w-full rounded-xl border p-3 text-sm" placeholder="Ví dụ: Kiểm tra cuối chương 1" /></label><label className="text-xs font-bold text-gray-500">Thời lượng (phút)<input type="number" min="1" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value) })} className="mt-1 w-full rounded-xl border p-3 text-sm" /></label><label className="text-xs font-bold text-gray-500">Điểm đạt<input type="number" min="0" value={form.passingScore} onChange={(event) => setForm({ ...form, passingScore: Number(event.target.value) })} className="mt-1 w-full rounded-xl border p-3 text-sm" /></label><label className="text-xs font-bold text-gray-500">Số lần thi tối đa<input type="number" min="1" value={form.maxAttempts} onChange={(event) => setForm({ ...form, maxAttempts: Number(event.target.value) })} className="mt-1 w-full rounded-xl border p-3 text-sm" /></label><label className="text-xs font-bold text-gray-500">Ngân hàng câu hỏi<select disabled={!form.courseId} value={bankId} onChange={(event) => chooseBank(event.target.value)} className="mt-1 w-full rounded-xl border p-3 text-sm disabled:bg-gray-100"><option value="">Chọn ngân hàng</option>{availableBanks.map((bank) => <option key={bank.id} value={bank.id}>{bank.title}</option>)}</select></label></div>
      {form.courseId && availableBanks.length === 0 && <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Khóa học chưa có ngân hàng câu hỏi. <button onClick={() => router.push("/teacher/question-banks")} className="font-bold underline">Tạo ngân hàng câu hỏi</button> trước.</div>}
      {questionsLoading && <Loader2 className="h-5 w-5 animate-spin" />}
      {bankId && !questionsLoading && <div className="space-y-3"><div className="flex justify-between text-sm font-bold"><span>Chọn câu hỏi ({questionIds.length}/{questions.length})</span><span>Tổng điểm: {selectedPoints}</span></div>{questions.length === 0 ? <div className="rounded-xl border border-dashed p-5 text-center text-sm text-gray-500">Ngân hàng chưa có câu hỏi.</div> : <div className="max-h-80 space-y-2 overflow-y-auto">{questions.map((question) => <label key={question.id} className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${questionIds.includes(question.id) ? "border-secondary bg-blue-50" : ""}`}><input type="checkbox" checked={questionIds.includes(question.id)} onChange={() => toggleQuestion(question.id)} /><span className="text-sm"><b>{question.type}</b> · {question.content}<small className="block text-gray-500">{question.difficulty} · {question.points} điểm</small></span></label>)}</div>}</div>}
      <div className="flex justify-end"><button disabled={saving || !form.courseId || !form.title.trim() || questionIds.length === 0} onClick={create} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-white disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}Tạo draft và tiếp tục</button></div>
    </section>}

    <div className="flex flex-wrap gap-2">{(["ALL", "DRAFT", "PUBLISHED", "ARCHIVED"] as const).map((status) => <button key={status} onClick={() => setStatusFilter(status)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusFilter === status ? "bg-secondary text-white" : "border bg-white"}`}>{status}</button>)}</div>
    {isLoading && <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-5 w-5 animate-spin" />Đang tải bài thi...</div>}
    {error && <div className="rounded-xl bg-red-50 p-4 text-red-700">{error instanceof Error ? error.message : "Không tải được bài thi"}</div>}
    {!isLoading && !error && visibleExams.length === 0 && <div className="rounded-2xl border border-dashed p-10 text-center text-gray-500">Chưa có bài thi trong trạng thái này.</div>}
    <div className="space-y-3">{visibleExams.map((exam) => <article key={exam.id} className="flex flex-col justify-between gap-4 rounded-2xl border bg-white p-5 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2"><h2 className="font-black">{exam.title}</h2><span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-black">{exam.status}</span></div><p className="mt-1 text-xs text-gray-500">{exam.durationMinutes} phút · Điểm đạt {exam.passingScore} · {exam.questions?.length ?? exam.questionIds?.length ?? 0} câu · Tối đa {exam.maxAttempts} lần</p></div><div className="flex flex-wrap gap-2"><button onClick={() => router.push(`/teacher/exams/${exam.id}`)} className="flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-bold"><Eye className="h-4 w-4" />Cấu hình & chấm bài</button>{exam.status === "DRAFT" && <button disabled={processing === exam.id} onClick={() => changeStatus(exam, "PUBLISHED")} className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white"><Send className="h-4 w-4" />Xuất bản</button>}{exam.status === "PUBLISHED" && <button disabled={processing === exam.id} onClick={() => changeStatus(exam, "ARCHIVED")} className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">Lưu trữ</button>}<button disabled={processing === exam.id} onClick={() => remove(exam)} className="rounded-xl bg-red-50 p-2 text-red-600"><Trash2 className="h-4 w-4" /></button></div></article>)}</div>
  </div>;
}
