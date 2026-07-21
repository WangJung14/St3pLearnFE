"use client";

import { use, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Clock, Loader2, Play, Send } from "lucide-react";
import { API_BASE_URL } from "@/lib/apiConfig";
import { apiFetch } from "@/lib/apiFetch";
import { buildAuthHeaders } from "@/lib/authHeaders";
import { unwrapData, type ApiResponse } from "@/lib/apiResponses";
import type { ExamResult, StartExamResponse } from "@/lib/endpointTypes";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

interface AnswerDraft { selectedOptionIds?: string[]; textAnswer?: string; audioUrl?: string }

export default function StudentExamPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = use(params); const { token } = useAuth(); const toast = useToast();
  const [attempt, setAttempt] = useState<StartExamResponse | null>(null); const [answers, setAnswers] = useState<Record<string, AnswerDraft>>({}); const [submitting, setSubmitting] = useState(false); const [submitted, setSubmitted] = useState(false); const [now, setNow] = useState(Date.now());
  useEffect(() => { if (!attempt || submitted) return; const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, [attempt, submitted]);
  const secondsLeft = useMemo(() => attempt ? Math.max(0, Math.floor((new Date(attempt.endTime).getTime() - now) / 1000)) : 0, [attempt, now]);
  const resultKey = token && attempt && submitted ? [`${API_BASE_URL}/api/learning/exams/attempts/${attempt.attemptId}/result`, token] as const : null;
  const { data: result, error: resultError } = useSWR<ExamResult>(resultKey, async ([url, currentToken]: readonly [string, string]) => { const res = await fetch(url, { headers: buildAuthHeaders(currentToken, "STUDENT") }); if (!res.ok) throw new Error(`HTTP ${res.status}`); return unwrapData<ExamResult>(await res.json() as ApiResponse<ExamResult>); }, { refreshInterval: (data) => data?.status === "GRADED" ? 0 : 5000 });

  const start = async () => { try { const body = await apiFetch<ApiResponse<StartExamResponse>>(`/api/learning/exams/${examId}/attempts`, { method: "POST" }); setAttempt(unwrapData(body)); } catch (cause) { toast.error("Không thể bắt đầu bài thi", cause instanceof Error ? cause.message : "Request failed"); } };
  const submit = async () => { if (!attempt || submitting) return; if (!confirm("Nộp bài thi ngay?")) return; setSubmitting(true); try { await apiFetch(`/api/learning/exams/attempts/${attempt.attemptId}/submit`, { method: "POST", body: JSON.stringify({ answers: attempt.questions.map((q) => ({ questionId: q.id, ...answers[q.id] })) }) }); setSubmitted(true); toast.success("Đã nộp bài"); } catch (cause) { toast.error("Nộp bài thất bại", cause instanceof Error ? cause.message : "Request failed"); } finally { setSubmitting(false); } };
  useEffect(() => { if (attempt && !submitted && secondsLeft === 0) void submit(); }, [secondsLeft, attempt, submitted]);

  if (!attempt) return <div className="mx-auto max-w-xl rounded-3xl border bg-white p-8 text-center shadow-soft"><h1 className="text-2xl font-black">Bắt đầu bài thi</h1><p className="my-3 text-sm text-gray-500">Exam ID: {examId}. Đồng hồ bắt đầu ngay khi server tạo attempt.</p><button onClick={start} className="mx-auto flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-white"><Play className="h-4 w-4" />Bắt đầu</button></div>;
  if (submitted) return <div className="mx-auto max-w-2xl rounded-3xl border bg-white p-8 text-center">{resultError && <p className="text-red-600">{resultError.message}</p>}{!result && <Loader2 className="mx-auto h-6 w-6 animate-spin" />}{result && <><h1 className="text-2xl font-black">Kết quả bài thi</h1><p className="my-4 text-4xl font-black text-primary">{result.score ?? "—"}</p><p className="font-bold">{result.passed ? "Đạt" : "Chưa đạt"} · {result.status}</p></>}</div>;

  return <div className="mx-auto max-w-3xl space-y-5"><div className="sticky top-2 z-10 flex items-center justify-between rounded-2xl border bg-white p-4 shadow"><h1 className="font-black">Bài thi</h1><span className="flex items-center gap-2 font-mono font-black text-red-600"><Clock className="h-4 w-4" />{Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}</span></div>{attempt.questions.map((q, index) => <article key={q.id} className="rounded-2xl border bg-white p-5"><p className="font-bold">{index + 1}. {q.content}</p><p className="mb-3 text-xs text-gray-500">{q.type} · {q.points} điểm</p>{q.metadata?.options?.map((option) => <label key={option.id} className="mb-2 flex gap-2 rounded-xl border p-3 text-sm"><input type={q.type === "MULTIPLE_CHOICE" ? "checkbox" : "radio"} name={q.id} checked={answers[q.id]?.selectedOptionIds?.includes(option.id) ?? false} onChange={() => setAnswers((value) => { const current = value[q.id]?.selectedOptionIds ?? []; const selectedOptionIds = q.type === "MULTIPLE_CHOICE" ? (current.includes(option.id) ? current.filter((id) => id !== option.id) : [...current, option.id]) : [option.id]; return { ...value, [q.id]: { ...value[q.id], selectedOptionIds } }; })} />{option.text}</label>)}{(!q.metadata?.options?.length || q.type === "TEXT") && <textarea value={answers[q.id]?.textAnswer ?? ""} onChange={(e) => setAnswers((value) => ({ ...value, [q.id]: { ...value[q.id], textAnswer: e.target.value } }))} className="w-full rounded-xl border p-3" placeholder="Nhập câu trả lời" />}</article>)}<button disabled={submitting} onClick={submit} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary p-3 font-bold text-white disabled:opacity-50">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Nộp bài</button></div>;
}
