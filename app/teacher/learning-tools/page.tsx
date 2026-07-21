"use client";

import { useState } from "react";
import useSWR from "swr";
import { Award, Copy, Download, FileUp, Layers, Loader2, Plus } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import { unwrapData, unwrapPageContent, type ApiResponse, type PagePayload } from "@/lib/apiResponses";
import type { Certificate, FlashcardSetSummary, FlashcardSetVisibility } from "@/lib/endpointTypes";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

interface CourseOption { id: string; title: string }

export default function TeacherLearningToolsPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [cloneId, setCloneId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [issued, setIssued] = useState<Certificate | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [setForm, setSetForm] = useState<{ title: string; courseId: string; visibility: FlashcardSetVisibility }>({ title: "", courseId: "", visibility: "PRIVATE" });
  const [cardForm, setCardForm] = useState({ setId: "", lemma: "", phonetic: "", partOfSpeech: "", definition: "" });

  const { data: sets = [], error: setsError, isLoading: setsLoading, mutate: mutateSets } = useSWR<FlashcardSetSummary[]>(
    token ? ["/api/learning/flashcard-sets/my-sets", token] : null,
    async ([path]: readonly [string, string]) => unwrapData<FlashcardSetSummary[]>(
      await apiFetch<ApiResponse<FlashcardSetSummary[]> | FlashcardSetSummary[]>(path)
    ),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const { data: courses = [] } = useSWR<CourseOption[]>(
    token ? ["/api/courses/my-courses?size=100", token] : null,
    async ([path]: readonly [string, string]) => unwrapPageContent<CourseOption>(
      await apiFetch<ApiResponse<PagePayload<CourseOption> | CourseOption[]> | PagePayload<CourseOption> | CourseOption[]>(path)
    ),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const run = async (key: string, action: () => Promise<void>) => {
    setBusy(key);
    try { await action(); }
    catch (cause) { toast.error("Thao tác thất bại", cause instanceof Error ? cause.message : "Request failed"); }
    finally { setBusy(null); }
  };

  const createSet = () => run("create-set", async () => {
    const title = setForm.title.trim();
    if (!title) return;
    await apiFetch("/api/learning/flashcard-sets", {
      method: "POST",
      body: JSON.stringify({ title, courseId: setForm.courseId || null, visibility: setForm.visibility }),
    });
    setSetForm({ title: "", courseId: "", visibility: "PRIVATE" });
    await mutateSets();
    toast.success("Đã tạo flashcard set");
  });

  const cloneSet = (id = cloneId) => run(`clone-${id}`, async () => {
    await apiFetch(`/api/learning/flashcard-sets/${id}/clone`, { method: "POST" });
    setCloneId("");
    await mutateSets();
    toast.success("Đã clone flashcard set");
  });

  const addCard = () => run("add-card", async () => {
    if (!cardForm.setId || !cardForm.lemma.trim() || !cardForm.definition.trim()) return;
    await apiFetch(`/api/learning/flashcard-sets/${cardForm.setId}/cards`, {
      method: "POST",
      body: JSON.stringify({
        lemma: cardForm.lemma.trim(),
        language: "EN",
        phonetic: cardForm.phonetic.trim(),
        partOfSpeech: cardForm.partOfSpeech.trim(),
        cefrLevel: "UNKNOWN",
        definition: cardForm.definition.trim(),
      }),
    });
    setCardForm((current) => ({ ...current, lemma: "", phonetic: "", partOfSpeech: "", definition: "" }));
    await mutateSets();
    toast.success("Đã thêm thẻ vào set");
  });

  const importVocabulary = () => run("import", async () => {
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    await apiFetch("/api/learning/vocabulary/import", { method: "POST", body });
    toast.success("Đã gửi file CSV");
  });

  const issueCertificate = () => run("certificate", async () => {
    const body = await apiFetch<ApiResponse<Certificate>>("/api/learning/certificates/issue", {
      method: "POST",
      body: JSON.stringify({ studentId, courseId }),
    });
    setIssued(unwrapData(body));
    toast.success("Đã cấp chứng chỉ");
  });

  const button = "flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2 font-bold text-white disabled:opacity-50";

  return <div className="space-y-6">
    <header><h1 className="text-2xl font-black">Learning tools</h1><p className="text-sm text-gray-500">Flashcard, vocabulary import và chứng chỉ.</p></header>

    <section className="space-y-5 rounded-2xl border bg-white p-5">
      <div><h2 className="flex items-center gap-2 font-black"><Layers className="text-secondary" />Flashcard set của tôi</h2><p className="text-xs text-gray-500">Tạo và quản lý các bộ thẻ dành cho học viên.</p></div>
      <div className="grid gap-3 md:grid-cols-3">
        <input value={setForm.title} onChange={(event) => setSetForm({ ...setForm, title: event.target.value })} placeholder="Tên bộ thẻ" className="rounded-xl border p-3 text-sm" />
        <select value={setForm.courseId} onChange={(event) => setSetForm({ ...setForm, courseId: event.target.value })} className="rounded-xl border p-3 text-sm"><option value="">Không gắn khóa học</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select>
        <select value={setForm.visibility} onChange={(event) => setSetForm({ ...setForm, visibility: event.target.value as FlashcardSetVisibility })} className="rounded-xl border p-3 text-sm"><option value="PRIVATE">Riêng tư</option><option value="COURSE_ONLY">Theo khóa học</option><option value="PUBLIC">Công khai</option></select>
      </div>
      <button disabled={!setForm.title.trim() || busy !== null || (setForm.visibility === "COURSE_ONLY" && !setForm.courseId)} onClick={createSet} className={button}>{busy === "create-set" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Tạo set mới</button>

      <div className="space-y-3 rounded-xl bg-gray-50 p-4">
        <h3 className="text-sm font-black">Thêm thẻ vào set</h3>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
          <select value={cardForm.setId} onChange={(event) => setCardForm({ ...cardForm, setId: event.target.value })} className="rounded-xl border bg-white p-2.5 text-sm"><option value="">Chọn flashcard set</option>{sets.map((set) => <option key={set.id} value={set.id}>{set.title}</option>)}</select>
          <input value={cardForm.lemma} onChange={(event) => setCardForm({ ...cardForm, lemma: event.target.value })} placeholder="Từ vựng" className="rounded-xl border p-2.5 text-sm" />
          <input value={cardForm.phonetic} onChange={(event) => setCardForm({ ...cardForm, phonetic: event.target.value })} placeholder="Phiên âm" className="rounded-xl border p-2.5 text-sm" />
          <input value={cardForm.partOfSpeech} onChange={(event) => setCardForm({ ...cardForm, partOfSpeech: event.target.value })} placeholder="Loại từ" className="rounded-xl border p-2.5 text-sm" />
          <input value={cardForm.definition} onChange={(event) => setCardForm({ ...cardForm, definition: event.target.value })} placeholder="Nghĩa" className="rounded-xl border p-2.5 text-sm" />
        </div>
        <button disabled={!cardForm.setId || !cardForm.lemma.trim() || !cardForm.definition.trim() || busy !== null} onClick={addCard} className={button}>{busy === "add-card" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Thêm thẻ</button>
      </div>

      {setsLoading && <Loader2 className="h-5 w-5 animate-spin" />}
      {setsError && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{setsError instanceof Error ? setsError.message : "Không tải được bộ thẻ"}</div>}
      {!setsLoading && !setsError && sets.length === 0 && <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">Bạn chưa có flashcard set nào.</div>}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{sets.map((set) => <article key={set.id} className="rounded-xl border p-4"><div className="flex justify-between gap-2"><h3 className="font-black">{set.title}</h3><span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold">{set.visibility}</span></div><p className="mt-2 text-xs text-gray-500">{set.cardCount} thẻ · ID {set.id.slice(0, 8)}</p><button disabled={busy !== null} onClick={() => cloneSet(set.id)} className="mt-3 flex items-center gap-1 text-xs font-bold text-secondary"><Copy className="h-3.5 w-3.5" />Nhân bản</button></article>)}</div>

      <div className="flex gap-2 border-t pt-4"><input value={cloneId} onChange={(event) => setCloneId(event.target.value)} placeholder="Set ID công khai cần clone" className="flex-1 rounded-xl border p-2" /><button disabled={!cloneId.trim() || busy !== null} onClick={() => cloneSet()} className={button}><Copy className="h-4 w-4" />Clone</button></div>
    </section>

    <div className="grid gap-5 lg:grid-cols-2">
      <section className="space-y-3 rounded-2xl border bg-white p-5"><h2 className="flex items-center gap-2 font-black"><FileUp className="text-secondary" />Import vocabulary CSV</h2><a href="/templates/vocabulary-import-template.csv" download className="flex w-fit items-center gap-2 rounded-xl border border-secondary px-4 py-2 text-sm font-bold text-secondary"><Download className="h-4 w-4" />Tải file CSV mẫu</a><input type="file" accept=".csv,text/csv" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="w-full rounded-xl border p-2" /><button disabled={!file || busy !== null} onClick={importVocabulary} className={button}><FileUp className="h-4 w-4" />Upload CSV</button><p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Backend parser/validator vocabulary hiện vẫn TODO.</p></section>
      <section className="space-y-3 rounded-2xl border bg-white p-5"><h2 className="flex items-center gap-2 font-black"><Award className="text-amber-500" />Cấp chứng chỉ</h2><input value={studentId} onChange={(event) => setStudentId(event.target.value)} placeholder="Student ID" className="w-full rounded-xl border p-2" /><input value={courseId} onChange={(event) => setCourseId(event.target.value)} placeholder="Course ID" className="w-full rounded-xl border p-2" /><button disabled={!studentId || !courseId || busy !== null} onClick={issueCertificate} className={button}><Award className="h-4 w-4" />Cấp chứng chỉ</button>{issued && <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">Certificate ID: <b>{issued.id}</b><br />Code: <b>{issued.certificateCode}</b></div>}</section>
    </div>
  </div>;
}
