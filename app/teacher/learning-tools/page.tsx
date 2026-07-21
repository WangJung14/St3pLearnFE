"use client";

import { useState } from "react";
import { Award, Copy, FileUp, Layers, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import { unwrapData, type ApiResponse } from "@/lib/apiResponses";
import type { Certificate } from "@/lib/endpointTypes";
import { useToast } from "@/components/ui/Toast";

export default function TeacherLearningToolsPage() {
  const toast = useToast(); const [busy, setBusy] = useState<string | null>(null); const [cloneId, setCloneId] = useState(""); const [studentId, setStudentId] = useState(""); const [courseId, setCourseId] = useState(""); const [issued, setIssued] = useState<Certificate | null>(null); const [file, setFile] = useState<File | null>(null);
  const run = async (key: string, action: () => Promise<void>) => { setBusy(key); try { await action(); } catch (cause) { toast.error("Thao tác thất bại", cause instanceof Error ? cause.message : "Request failed"); } finally { setBusy(null); } };
  const createSet = () => run("create-set", async () => { await apiFetch("/api/learning/flashcard-sets", { method: "POST" }); toast.success("Đã gửi yêu cầu tạo flashcard set"); });
  const cloneSet = () => run("clone-set", async () => { await apiFetch(`/api/learning/flashcard-sets/${cloneId}/clone`, { method: "POST" }); toast.success("Đã clone flashcard set"); });
  const importVocabulary = () => run("import", async () => { if (!file) return; const body = new FormData(); body.append("file", file); await apiFetch("/api/learning/vocabulary/import", { method: "POST", body }); toast.success("Đã gửi file CSV"); });
  const issueCertificate = () => run("certificate", async () => { const body = await apiFetch<ApiResponse<Certificate>>("/api/learning/certificates/issue", { method: "POST", body: JSON.stringify({ studentId, courseId }) }); setIssued(unwrapData(body)); toast.success("Đã cấp chứng chỉ"); });
  const button = "flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2 font-bold text-white disabled:opacity-50";
  return <div className="space-y-6"><div><h1 className="text-2xl font-black">Learning tools</h1><p className="text-sm text-gray-500">Flashcard, vocabulary import và chứng chỉ.</p></div><div className="grid gap-5 lg:grid-cols-2">
    <section className="space-y-3 rounded-2xl border bg-white p-5"><h2 className="flex items-center gap-2 font-black"><Layers className="text-secondary" />Flashcard set</h2><button disabled={busy !== null} onClick={createSet} className={button}>{busy === "create-set" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}Tạo set mới</button><div className="flex gap-2"><input value={cloneId} onChange={(e) => setCloneId(e.target.value)} placeholder="Set ID cần clone" className="flex-1 rounded-xl border p-2" /><button disabled={!cloneId || busy !== null} onClick={cloneSet} className={button}><Copy className="h-4 w-4" />Clone</button></div></section>
    <section className="space-y-3 rounded-2xl border bg-white p-5"><h2 className="flex items-center gap-2 font-black"><FileUp className="text-secondary" />Import vocabulary CSV</h2><input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full rounded-xl border p-2" /><button disabled={!file || busy !== null} onClick={importVocabulary} className={button}><FileUp className="h-4 w-4" />Upload CSV</button><p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Backend parser/validator vocabulary hiện vẫn TODO.</p></section>
    <section className="space-y-3 rounded-2xl border bg-white p-5 lg:col-span-2"><h2 className="flex items-center gap-2 font-black"><Award className="text-amber-500" />Cấp chứng chỉ</h2><div className="grid gap-2 sm:grid-cols-2"><input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="Student ID" className="rounded-xl border p-2" /><input value={courseId} onChange={(e) => setCourseId(e.target.value)} placeholder="Course ID" className="rounded-xl border p-2" /></div><button disabled={!studentId || !courseId || busy !== null} onClick={issueCertificate} className={button}><Award className="h-4 w-4" />Cấp chứng chỉ</button>{issued && <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">Certificate ID: <b>{issued.id}</b><br />Code: <b>{issued.certificateCode}</b></div>}</section>
  </div></div>;
}
