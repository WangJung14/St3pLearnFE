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
  const [selectedAttempt, setSelectedAttempt] = useState<any | null>(null);
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

  const openGrade = async (attempt: ExamAttempt) => {
    try {
      const res = await apiFetch(`/api/learning/exams/submissions/${attempt.id}`);
      const detail = unwrapData<any>(res);
      const initial: Record<string, GradeValue> = {};
      
      const qList = detail.questions || [];
      qList.forEach((q: any) => {
        initial[q.questionId] = {
          pointsAwarded: q.score ?? 0,
          feedbackText: q.feedback || ""
        };
      });
      
      setGrades(initial);
      setSelectedAttempt(detail);
    } catch (e) {
      toast.error("Không thể tải chi tiết bài nộp của học viên", e instanceof Error ? e.message : undefined);
    }
  };
  const submitGrades = async () => {
    if (!selectedAttempt) return;
    setBusy("grade");
    const qList = selectedAttempt.questions || [];
    try {
      await apiFetch(`/api/learning/exams/submissions/${selectedAttempt.attemptId || selectedAttempt.id}/grade`, {
        method: "PUT",
        body: JSON.stringify({
          grades: qList.map((q: any) => ({
            questionId: q.questionId,
            ...grades[q.questionId]
          }))
        })
      });
      await mutateSubmissions();
      setSelectedAttempt(null);
      toast.success("Đã chấm điểm thành công");
    } catch (cause) {
      toast.error("Không thể chấm bài", cause instanceof Error ? cause.message : undefined);
    } finally {
      setBusy(null);
    }
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

    {selectedAttempt && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-black text-gray-950">Chấm bài nộp của học viên</h2>
            <p className="text-2xs text-gray-500 font-bold mt-1">
              Trạng thái: <span className="text-secondary uppercase">{selectedAttempt.status}</span> | Tổng điểm: {selectedAttempt.score ?? "Chưa chấm"}
            </p>
          </div>

          <div className="space-y-4 pr-1">
            {(selectedAttempt.questions || []).map((q: any) => {
              const studentAns = q.studentAnswer || {};
              const selectedIds = Array.isArray(studentAns.selectedOptionIds) ? studentAns.selectedOptionIds : [];
              const meta = q.metadata || {};
              const options = Array.isArray(meta.options) ? meta.options : [];

              return (
                <div key={q.questionId} className="space-y-3 rounded-2xl border border-gray-150 p-4 bg-white shadow-sm">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <span className="text-[10px] font-black uppercase bg-secondary/10 text-secondary px-2 py-0.5 rounded">
                        {q.type}
                      </span>
                      <p className="text-xs font-extrabold text-gray-800 mt-2 leading-relaxed">{q.content}</p>
                    </div>
                    <span className="text-xs font-bold text-gray-400 shrink-0">
                      Tối đa: {q.points}đ
                    </span>
                  </div>

                  {/* Render Options for Choices Types */}
                  {(q.type === "SINGLE_CHOICE" || q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE") && options.length > 0 && (
                    <div className="grid gap-2 sm:grid-cols-2 mt-2">
                      {options.map((opt: any) => {
                        const isSelected = selectedIds.includes(opt.id);
                        const isCorrect = !!(opt.correct || opt.isCorrect);
                        
                        let borderClass = "border-gray-100 bg-gray-50/50";
                        let badgeText = "";
                        let badgeClass = "";

                        if (isSelected) {
                          if (isCorrect) {
                            borderClass = "border-emerald-500 bg-emerald-50/30 text-emerald-800";
                            badgeText = "Học viên chọn đúng";
                            badgeClass = "bg-emerald-500 text-white";
                          } else {
                            borderClass = "border-rose-500 bg-rose-50/30 text-rose-800";
                            badgeText = "Học viên chọn sai";
                            badgeClass = "bg-rose-500 text-white";
                          }
                        } else {
                          if (isCorrect) {
                            borderClass = "border-emerald-300 bg-emerald-50/10 text-emerald-700 border-dashed";
                            badgeText = "Đáp án đúng";
                            badgeClass = "bg-emerald-100 text-emerald-700";
                          }
                        }

                        return (
                          <div key={opt.id} className={`p-3 rounded-xl border text-xs font-semibold relative ${borderClass}`}>
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-gray-400 shrink-0">{opt.id}.</span>
                              <span className="flex-grow">{opt.text}</span>
                            </div>
                            {badgeText && (
                              <span className={`absolute top-2 right-2 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${badgeClass}`}>
                                {badgeText}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Render Answer for Essay/Text Type */}
                  {(q.type === "ESSAY" || q.type === "TEXT") && (
                    <div className="space-y-2 mt-2 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase">Câu trả lời của học viên:</span>
                        <p className="text-xs bg-white border border-gray-100 p-3 rounded-xl whitespace-pre-wrap font-medium text-gray-800">
                          {studentAns.textAnswer || <span className="text-gray-400 italic">Không có câu trả lời</span>}
                        </p>
                      </div>
                      {meta.essayAnswer && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-emerald-600 uppercase">Đáp án gợi ý mẫu:</span>
                          <p className="text-xs bg-emerald-50/20 border border-emerald-100/50 p-3 rounded-xl whitespace-pre-wrap font-medium text-emerald-800">
                            {meta.essayAnswer}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2 pt-3 border-t border-gray-50">
                    <label className="text-3xs font-extrabold uppercase text-gray-400">
                      Điểm chấm / {q.points}
                      <input
                        type="number"
                        min="0"
                        max={q.points}
                        step="0.5"
                        value={grades[q.questionId]?.pointsAwarded ?? 0}
                        onChange={(event) => setGrades((current) => ({
                          ...current,
                          [q.questionId]: {
                            ...current[q.questionId],
                            pointsAwarded: Number(event.target.value)
                          }
                        }))}
                        className="mt-1.5 w-full rounded-xl border border-gray-200 p-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </label>
                    <label className="text-3xs font-extrabold uppercase text-gray-400">
                      Nhận xét của giáo viên
                      <input
                        value={grades[q.questionId]?.feedbackText ?? ""}
                        onChange={(event) => setGrades((current) => ({
                          ...current,
                          [q.questionId]: {
                            ...current[q.questionId],
                            feedbackText: event.target.value
                          }
                        }))}
                        placeholder="Nhập phản hồi/nhận xét..."
                        className="mt-1.5 w-full rounded-xl border border-gray-200 p-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2.5 border-t border-gray-100 pt-4">
            <button
              onClick={() => setSelectedAttempt(null)}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-xs font-extrabold hover:bg-gray-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              disabled={busy === "grade"}
              onClick={submitGrades}
              className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-5 py-2.5 text-xs font-extrabold text-white disabled:opacity-50 cursor-pointer"
            >
              {busy === "grade" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Lưu điểm chấm
            </button>
          </div>
        </div>
      </div>
    )}
  </div>;
}
