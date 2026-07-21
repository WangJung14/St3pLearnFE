"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ArrowLeft, Check, ClipboardCheck, FileQuestion, Loader2, Save, Send } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import { unwrapData, type ApiResponse, type PagePayload } from "@/lib/apiResponses";
import type { Exam, ExamAttempt, ExamAttemptStatus, ExamStatus, Question, QuestionBank } from "@/lib/endpointTypes";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

interface EditForm { title: string; durationMinutes: number; passingScore: number; maxAttempts: number }
interface GradeValue { pointsAwarded: number; feedbackText: string }

export default function TeacherExamDetailPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = use(params);
  const { token } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [formOverride, setFormOverride] = useState<EditForm | null>(null);
  const [bankId, setBankId] = useState("");
  const [questionIdsOverride, setQuestionIdsOverride] = useState<string[] | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<"ALL" | ExamAttemptStatus>("ALL");
  const [selectedAttempt, setSelectedAttempt] = useState<ExamAttempt | null>(null);
  const [grades, setGrades] = useState<Record<string, GradeValue>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const { data: exam, error, isLoading, mutate } = useSWR<Exam>(
    token ? [`/api/learning/exams/${examId}`, token] : null,
    async ([path]: readonly [string, string]) => unwrapData<Exam>(await apiFetch<ApiResponse<Exam> | Exam>(path)),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  const submissionsPath = `/api/learning/exams/${examId}/submissions?page=0&size=100${submissionStatus === "ALL" ? "" : `&status=${submissionStatus}`}`;
  const { data: submissionPage, error: submissionsError, isLoading: submissionsLoading, mutate: mutateSubmissions } = useSWR<PagePayload<ExamAttempt>>(
    token ? [submissionsPath, token] : null,
    async ([path]: readonly [string, string]) => unwrapData<PagePayload<ExamAttempt>>(await apiFetch<ApiResponse<PagePayload<ExamAttempt>> | PagePayload<ExamAttempt>>(path)),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  const { data: banks = [] } = useSWR<QuestionBank[]>(
    token ? ["/api/learning/question-banks", token] : null,
    async ([path]: readonly [string, string]) => unwrapData<QuestionBank[]>(await apiFetch<ApiResponse<QuestionBank[]> | QuestionBank[]>(path)),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  const { data: bankQuestions = [], isLoading: questionsLoading } = useSWR<Question[]>(
    token && bankId ? [`/api/learning/question-banks/${bankId}/questions`, token] : null,
    async ([path]: readonly [string, string]) => unwrapData<Question[]>(await apiFetch<ApiResponse<Question[]> | Question[]>(path)),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const submissions = submissionPage?.content ?? [];
  const availableBanks = useMemo(() => banks.filter((bank) => bank.courseId === exam?.courseId), [banks, exam?.courseId]);
  const examQuestions = exam?.questions ?? [];
  const form = formOverride ?? { title: exam?.title ?? "", durationMinutes: exam?.durationMinutes ?? 30, passingScore: exam?.passingScore ?? 50, maxAttempts: exam?.maxAttempts ?? 1 };
  const questionIds = questionIdsOverride ?? exam?.questions?.map(({ id }) => id) ?? exam?.questionIds ?? [];

  const updateInfo = async () => {
    if (!form.title.trim()) return;
    setBusy("info");
    try { await apiFetch(`/api/learning/exams/${examId}`, { method: "PUT", body: JSON.stringify({ ...form, title: form.title.trim() }) }); await mutate(); setFormOverride(null); toast.success("Đã lưu thông tin bài thi"); }
    catch (cause) { toast.error("Không thể cập nhật", cause instanceof Error ? cause.message : undefined); }
    finally { setBusy(null); }
  };

  const toggleQuestion = (id: string) => setQuestionIdsOverride((current) => { const values = current ?? questionIds; return values.includes(id) ? values.filter((value) => value !== id) : [...values, id]; });
  const saveQuestions = async () => {
    if (exam?.status !== "DRAFT") return;
    setBusy("questions");
    try { await apiFetch(`/api/learning/exams/${examId}/questions`, { method: "PUT", body: JSON.stringify({ questionIds }) }); await mutate(); setQuestionIdsOverride(null); toast.success("Đã cập nhật câu hỏi"); }
    catch (cause) { toast.error("Không thể cập nhật câu hỏi", cause instanceof Error ? cause.message : undefined); }
    finally { setBusy(null); }
  };

  const changeStatus = async (status: ExamStatus) => {
    if (!exam || !confirm(`Chuyển bài thi sang trạng thái ${status}?`)) return;
    setBusy("status");
    try { await apiFetch(`/api/learning/exams/${examId}/status`, { method: "PUT", body: JSON.stringify({ status }) }); await mutate(); toast.success("Đã cập nhật trạng thái"); }
    catch (cause) { toast.error("Không thể đổi trạng thái", cause instanceof Error ? cause.message : undefined); }
    finally { setBusy(null); }
  };

  const openGrade = (attempt: ExamAttempt) => {
    const initial: Record<string, GradeValue> = {};
    examQuestions.forEach((question) => { initial[question.id] = { pointsAwarded: 0, feedbackText: "" }; });
    setGrades(initial); setSelectedAttempt(attempt);
  };
  const submitGrades = async () => {
    if (!selectedAttempt) return;
    setBusy("grade");
    try {
      await apiFetch(`/api/learning/exams/submissions/${selectedAttempt.id}/grade`, { method: "PUT", body: JSON.stringify({ grades: examQuestions.map((question) => ({ questionId: question.id, ...grades[question.id] })) }) });
      await mutateSubmissions(); setSelectedAttempt(null); toast.success("Đã chấm bài");
    } catch (cause) { toast.error("Không thể chấm bài", cause instanceof Error ? cause.message : undefined); }
    finally { setBusy(null); }
  };

  if (isLoading) return <div className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" />Đang tải bài thi...</div>;
  if (error || !exam) return <div className="rounded-xl bg-red-50 p-4 text-red-700">{error instanceof Error ? error.message : "Không tìm thấy bài thi"}</div>;

  return <div className="space-y-6">
    <button onClick={() => router.push("/teacher/exams")} className="flex items-center gap-2 text-sm font-bold text-gray-500"><ArrowLeft className="h-4 w-4" />Danh sách bài thi</button>
    <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-black">{exam.title}</h1><p className="text-sm text-gray-500">Flow: cấu hình → câu hỏi → xuất bản → submission → chấm bài</p></div><div className="flex gap-2"><span className="rounded-full bg-gray-100 px-3 py-2 text-xs font-black">{exam.status}</span>{exam.status === "DRAFT" && <button disabled={busy !== null || questionIds.length === 0} onClick={() => changeStatus("PUBLISHED")} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"><Send className="h-4 w-4" />Xuất bản</button>}{exam.status === "PUBLISHED" && <button disabled={busy !== null} onClick={() => changeStatus("ARCHIVED")} className="rounded-xl bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700">Lưu trữ</button>}{exam.status === "ARCHIVED" && <button disabled={busy !== null} onClick={() => changeStatus("DRAFT")} className="rounded-xl border px-4 py-2 text-xs font-bold">Khôi phục Draft</button>}</div></header>

    <section className="space-y-4 rounded-2xl border bg-white p-5"><h2 className="font-black">1. Thông tin bài thi</h2><div className="grid gap-3 md:grid-cols-2"><label className="text-xs font-bold text-gray-500">Tên bài thi<input value={form.title} onChange={(event) => setFormOverride({ ...form, title: event.target.value })} className="mt-1 w-full rounded-xl border p-3 text-sm" /></label><label className="text-xs font-bold text-gray-500">Thời lượng (phút)<input type="number" min="1" value={form.durationMinutes} onChange={(event) => setFormOverride({ ...form, durationMinutes: Number(event.target.value) })} className="mt-1 w-full rounded-xl border p-3 text-sm" /></label><label className="text-xs font-bold text-gray-500">Điểm đạt<input type="number" min="0" value={form.passingScore} onChange={(event) => setFormOverride({ ...form, passingScore: Number(event.target.value) })} className="mt-1 w-full rounded-xl border p-3 text-sm" /></label><label className="text-xs font-bold text-gray-500">Số lần thi tối đa<input type="number" min="1" value={form.maxAttempts} onChange={(event) => setFormOverride({ ...form, maxAttempts: Number(event.target.value) })} className="mt-1 w-full rounded-xl border p-3 text-sm" /></label></div><button disabled={busy !== null} onClick={updateInfo} className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" />Lưu thông tin</button></section>

    <section className="space-y-4 rounded-2xl border bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-black">2. Câu hỏi ({questionIds.length})</h2><p className="text-xs text-gray-500">Chỉ sửa được khi bài thi ở trạng thái DRAFT.</p></div><select disabled={exam.status !== "DRAFT"} value={bankId} onChange={(event) => setBankId(event.target.value)} className="rounded-xl border p-2 text-sm"><option value="">Chọn ngân hàng để thêm câu hỏi</option>{availableBanks.map((bank) => <option key={bank.id} value={bank.id}>{bank.title}</option>)}</select></div>
      <div className="space-y-2">{examQuestions.map((question) => <div key={question.id} className="rounded-xl bg-gray-50 p-3 text-sm"><b>{question.type}</b> · {question.content}<small className="block text-gray-500">{question.points} điểm · {question.difficulty}</small></div>)}{examQuestions.length === 0 && <div className="rounded-xl border border-dashed p-5 text-center text-sm text-gray-500">Bài thi chưa có câu hỏi.</div>}</div>
      {questionsLoading && <Loader2 className="h-5 w-5 animate-spin" />}{bankId && <div className="max-h-72 space-y-2 overflow-y-auto border-t pt-4">{bankQuestions.map((question) => <label key={question.id} className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${questionIds.includes(question.id) ? "border-secondary bg-blue-50" : ""}`}><input type="checkbox" disabled={exam.status !== "DRAFT"} checked={questionIds.includes(question.id)} onChange={() => toggleQuestion(question.id)} /><span className="text-sm">{question.content}<small className="block text-gray-500">{question.type} · {question.points} điểm</small></span></label>)}</div>}
      {exam.status === "DRAFT" && <button disabled={busy !== null || questionIds.length === 0} onClick={saveQuestions} className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 font-bold text-white disabled:opacity-50"><FileQuestion className="h-4 w-4" />Lưu danh sách câu hỏi</button>}
    </section>

    <section className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-black">3. Bài nộp</h2><p className="text-xs text-gray-500">Theo dõi trạng thái và chấm các câu cần giáo viên đánh giá.</p></div><select value={submissionStatus} onChange={(event) => setSubmissionStatus(event.target.value as typeof submissionStatus)} className="rounded-xl border p-2 text-sm"><option value="ALL">Tất cả</option><option value="STARTED">Đang làm</option><option value="SUBMITTED">Đã nộp</option><option value="NEEDS_GRADING">Cần chấm</option><option value="GRADED">Đã chấm</option><option value="EXPIRED">Hết hạn</option></select></div>
      {submissionsLoading && <Loader2 className="h-5 w-5 animate-spin" />}{submissionsError && <div className="rounded-xl bg-red-50 p-4 text-red-700">{submissionsError instanceof Error ? submissionsError.message : "Không tải được bài nộp"}</div>}{!submissionsLoading && !submissionsError && submissions.length === 0 && <div className="rounded-2xl border border-dashed p-8 text-center text-gray-500">Chưa có bài nộp.</div>}
      <div className="space-y-3">{submissions.map((attempt) => <article key={attempt.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4"><div><b>{attempt.studentName || attempt.studentEmail || attempt.studentId}</b><p className="text-xs text-gray-500">{attempt.status} · Điểm {attempt.score ?? "—"} · {attempt.passed === undefined ? "Chưa có kết quả" : attempt.passed ? "Đạt" : "Chưa đạt"}</p></div><button disabled={attempt.status === "STARTED" || attempt.status === "EXPIRED"} onClick={() => openGrade(attempt)} className="flex items-center gap-2 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"><ClipboardCheck className="h-4 w-4" />Chấm bài</button></article>)}</div>
    </section>

    {selectedAttempt && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6"><div><h2 className="text-xl font-black">Chấm bài: {selectedAttempt.studentName || selectedAttempt.studentId}</h2><p className="text-xs text-amber-700">Backend chưa có API trả nội dung câu trả lời cho Teacher; form này chấm điểm theo từng câu hỏi của đề.</p></div>{examQuestions.map((question) => <div key={question.id} className="space-y-2 rounded-xl border p-4"><p className="text-sm font-bold">{question.content}</p><div className="grid gap-2 sm:grid-cols-2"><label className="text-xs text-gray-500">Điểm / {question.points}<input type="number" min="0" max={question.points} step="0.5" value={grades[question.id]?.pointsAwarded ?? 0} onChange={(event) => setGrades((current) => ({ ...current, [question.id]: { ...current[question.id], pointsAwarded: Number(event.target.value) } }))} className="mt-1 w-full rounded-lg border p-2" /></label><label className="text-xs text-gray-500">Nhận xét<input value={grades[question.id]?.feedbackText ?? ""} onChange={(event) => setGrades((current) => ({ ...current, [question.id]: { ...current[question.id], feedbackText: event.target.value } }))} className="mt-1 w-full rounded-lg border p-2" /></label></div></div>)}<div className="flex justify-end gap-2"><button onClick={() => setSelectedAttempt(null)} className="rounded-xl border px-4 py-2 font-bold">Hủy</button><button disabled={busy === "grade" || examQuestions.length === 0} onClick={submitGrades} className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 font-bold text-white disabled:opacity-50">{busy === "grade" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Lưu điểm</button></div></div></div>}
  </div>;
}
