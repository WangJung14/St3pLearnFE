"use client";

import { use, useState } from "react";
import useSWR from "swr";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/apiConfig";
import { apiFetch } from "@/lib/apiFetch";
import { buildAuthHeaders } from "@/lib/authHeaders";
import { unwrapData, type ApiResponse } from "@/lib/apiResponses";
import type { Question, QuestionDifficulty, QuestionType } from "@/lib/endpointTypes";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

const EMPTY = { type: "SINGLE_CHOICE" as QuestionType, content: "", difficulty: "MEDIUM" as QuestionDifficulty, points: 1, metadata: "{}" };

export default function QuestionsPage({ params }: { params: Promise<{ bankId: string }> }) {
  const { bankId } = use(params);
  const { token } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const key = token ? [`${API_BASE_URL}/api/learning/question-banks/${bankId}/questions`, token] as const : null;
  const { data = [], error, isLoading, mutate } = useSWR<Question[]>(key, async ([url, currentToken]: readonly [string, string]) => {
    const res = await fetch(url, { headers: buildAuthHeaders(currentToken) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return unwrapData<Question[]>(await res.json() as ApiResponse<Question[]>);
  });

  const save = async () => {
    if (!form.content.trim()) return;
    let metadata: Record<string, unknown>;
    try { metadata = JSON.parse(form.metadata) as Record<string, unknown>; } catch { toast.error("Metadata phải là JSON hợp lệ"); return; }
    setSaving(true);
    try {
      const path = editing ? `/api/learning/questions/${editing}` : `/api/learning/question-banks/${bankId}/questions`;
      await apiFetch(path, { method: editing ? "PUT" : "POST", body: JSON.stringify({ type: form.type, content: form.content, difficulty: form.difficulty, points: form.points, metadata }) });
      toast.success(editing ? "Đã cập nhật câu hỏi" : "Đã tạo câu hỏi");
      setEditing(null); setForm(EMPTY); await mutate();
    } catch (cause) { toast.error("Không thể lưu câu hỏi", cause instanceof Error ? cause.message : "Request failed"); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Xóa câu hỏi này?")) return;
    try { await apiFetch(`/api/learning/questions/${id}`, { method: "DELETE" }); await mutate(); toast.success("Đã xóa câu hỏi"); }
    catch (cause) { toast.error("Không thể xóa", cause instanceof Error ? cause.message : "Request failed"); }
  };

  const edit = (question: Question) => { setEditing(question.id); setForm({ type: question.type, content: question.content, difficulty: question.difficulty, points: question.points, metadata: JSON.stringify(question.metadata ?? {}, null, 2) }); };

  return <div className="space-y-6"><div><h1 className="text-2xl font-black">Câu hỏi trong ngân hàng</h1><p className="text-xs text-gray-500">Bank ID: {bankId}</p></div>
    <section className="grid gap-3 rounded-2xl border bg-white p-5 md:grid-cols-2"><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as QuestionType })} className="rounded-xl border p-2"><option>SINGLE_CHOICE</option><option>MULTIPLE_CHOICE</option><option>TRUE_FALSE</option><option>TEXT</option><option>AUDIO</option></select><select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as QuestionDifficulty })} className="rounded-xl border p-2"><option>EASY</option><option>MEDIUM</option><option>HARD</option></select><textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Nội dung câu hỏi" className="rounded-xl border p-3 md:col-span-2" /><textarea value={form.metadata} onChange={(e) => setForm({ ...form, metadata: e.target.value })} rows={5} className="rounded-xl border p-3 font-mono text-xs md:col-span-2" /><label className="text-sm">Điểm <input type="number" min="0" step="0.5" value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} className="ml-2 rounded-lg border p-2" /></label><button disabled={saving || !form.content.trim()} onClick={save} className="flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2 font-bold text-white disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{editing ? "Cập nhật" : "Thêm câu hỏi"}</button></section>
    {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}{error && <div className="rounded-xl bg-red-50 p-4 text-red-700">{error.message}</div>}
    <div className="space-y-3">{data.map((question) => <article key={question.id} className="rounded-2xl border bg-white p-4"><div className="flex justify-between gap-3"><div><span className="text-xs font-black text-secondary">{question.type} · {question.difficulty} · {question.points} điểm</span><p className="mt-2 text-sm font-bold">{question.content}</p></div><div className="flex gap-2"><button onClick={() => edit(question)} className="rounded-lg border p-2"><Pencil className="h-4 w-4" /></button><button onClick={() => remove(question.id)} className="rounded-lg border border-red-100 p-2 text-red-600"><Trash2 className="h-4 w-4" /></button></div></div></article>)}</div>
  </div>;
}
