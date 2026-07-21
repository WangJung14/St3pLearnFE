"use client";

import { use, useState } from "react";
import useSWR from "swr";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { API_BASE_URL } from "@/lib/apiConfig";
import { apiFetch } from "@/lib/apiFetch";
import { buildAuthHeaders } from "@/lib/authHeaders";
import { unwrapData, type ApiResponse } from "@/lib/apiResponses";
import type { Question, QuestionDifficulty, QuestionType } from "@/lib/endpointTypes";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

interface AnswerOption {
  id: string;
  text: string;
  correct: boolean;
}

interface MetadataForm {
  options: AnswerOption[];
  explanation?: string;
  [key: string]: unknown;
}

interface QuestionForm {
  type: QuestionType;
  content: string;
  difficulty: QuestionDifficulty;
  points: number;
  metadata: MetadataForm;
}

const CHOICE_TYPES: QuestionType[] = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"];

function defaultOptions(type: QuestionType): AnswerOption[] {
  if (type === "TRUE_FALSE") {
    return [
      { id: "TRUE", text: "Đúng", correct: true },
      { id: "FALSE", text: "Sai", correct: false },
    ];
  }
  if (type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE") {
    return [
      { id: "A", text: "", correct: true },
      { id: "B", text: "", correct: false },
      { id: "C", text: "", correct: false },
      { id: "D", text: "", correct: false },
    ];
  }
  return [];
}

function emptyForm(): QuestionForm {
  return {
    type: "SINGLE_CHOICE",
    content: "",
    difficulty: "MEDIUM",
    points: 1,
    metadata: { options: defaultOptions("SINGLE_CHOICE"), explanation: "" },
  };
}

export default function QuestionsPage({ params }: { params: Promise<{ bankId: string }> }) {
  const { bankId } = use(params);
  const { token } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<QuestionForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const key = token ? [`${API_BASE_URL}/api/learning/question-banks/${bankId}/questions`, token] as const : null;
  const { data = [], error, isLoading, mutate } = useSWR<Question[]>(
    key,
    async ([url, currentToken]: readonly [string, string]) => {
      const res = await fetch(url, { headers: buildAuthHeaders(currentToken) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return unwrapData<Question[]>(await res.json() as ApiResponse<Question[]>);
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const isChoice = CHOICE_TYPES.includes(form.type);
  const options = form.metadata.options;

  const changeType = (type: QuestionType) => {
    setForm((current) => ({
      ...current,
      type,
      metadata: { ...current.metadata, options: defaultOptions(type) },
    }));
  };

  const updateOption = (index: number, patch: Partial<AnswerOption>) => {
    setForm((current) => ({
      ...current,
      metadata: {
        ...current.metadata,
        options: current.metadata.options.map((option, optionIndex) =>
          optionIndex === index ? { ...option, ...patch } : option
        ),
      },
    }));
  };

  const toggleCorrect = (index: number) => {
    setForm((current) => ({
      ...current,
      metadata: {
        ...current.metadata,
        options: current.metadata.options.map((option, optionIndex) => ({
          ...option,
          correct: current.type === "MULTIPLE_CHOICE"
            ? optionIndex === index ? !option.correct : option.correct
            : optionIndex === index,
        })),
      },
    }));
  };

  const addOption = () => {
    setForm((current) => {
      const usedIds = new Set(current.metadata.options.map(({ id }) => id));
      const id = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").find((candidate) => !usedIds.has(candidate))
        ?? String(current.metadata.options.length + 1);
      return {
        ...current,
        metadata: {
          ...current.metadata,
          options: [...current.metadata.options, { id, text: "", correct: false }],
        },
      };
    });
  };

  const removeOption = (index: number) => {
    setForm((current) => ({
      ...current,
      metadata: {
        ...current.metadata,
        options: current.metadata.options.filter((_, optionIndex) => optionIndex !== index),
      },
    }));
  };

  const save = async () => {
    const content = form.content.trim();
    if (!content) return;

    const normalizedOptions = form.metadata.options.map((option) => ({
      ...option,
      id: option.id.trim(),
      text: option.text.trim(),
    }));

    if (isChoice) {
      const correctCount = normalizedOptions.filter((option) => option.correct).length;
      if (normalizedOptions.length < 2 || normalizedOptions.some((option) => !option.id || !option.text)) {
        toast.warning("Câu hỏi chưa hợp lệ", "Hãy nhập ít nhất hai phương án trả lời.");
        return;
      }
      if (correctCount === 0 || (form.type !== "MULTIPLE_CHOICE" && correctCount !== 1)) {
        toast.warning(
          "Câu hỏi chưa hợp lệ",
          form.type === "MULTIPLE_CHOICE" ? "Hãy chọn ít nhất một đáp án đúng." : "Hãy chọn đúng một đáp án."
        );
        return;
      }
    }

    setSaving(true);
    try {
      const path = editing
        ? `/api/learning/questions/${editing}`
        : `/api/learning/question-banks/${bankId}/questions`;
      await apiFetch(path, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({
          type: form.type,
          content,
          difficulty: form.difficulty,
          points: form.points,
          metadata: {
            ...form.metadata,
            options: isChoice ? normalizedOptions : [],
          },
        }),
      });
      toast.success(editing ? "Đã cập nhật câu hỏi" : "Đã tạo câu hỏi");
      setEditing(null);
      setForm(emptyForm());
      await mutate();
    } catch (cause) {
      toast.error("Không thể lưu câu hỏi", cause instanceof Error ? cause.message : "Request failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Xóa câu hỏi này?")) return;
    try {
      await apiFetch(`/api/learning/questions/${id}`, { method: "DELETE" });
      await mutate();
      toast.success("Đã xóa câu hỏi");
    } catch (cause) {
      toast.error("Không thể xóa", cause instanceof Error ? cause.message : "Request failed");
    }
  };

  const edit = (question: Question) => {
    const savedOptions = question.metadata?.options?.map((option) => ({
      id: option.id,
      text: option.text,
      correct: Boolean(option.correct),
    }));
    setEditing(question.id);
    setForm({
      type: question.type,
      content: question.content,
      difficulty: question.difficulty,
      points: question.points,
      metadata: {
        ...(question.metadata ?? {}),
        options: savedOptions?.length ? savedOptions : defaultOptions(question.type),
      },
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(emptyForm());
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black">Câu hỏi trong ngân hàng</h1>
        <p className="text-sm text-gray-500">Tạo nội dung và đáp án trước khi đưa câu hỏi vào bài thi.</p>
      </header>

      <section className="space-y-5 rounded-2xl border bg-white p-5 shadow-soft">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-xs font-bold text-gray-500">
            Loại câu hỏi
            <select value={form.type} onChange={(event) => changeType(event.target.value as QuestionType)} className="mt-1 w-full rounded-xl border p-3 text-sm">
              <option value="SINGLE_CHOICE">Một đáp án</option>
              <option value="MULTIPLE_CHOICE">Nhiều đáp án</option>
              <option value="TRUE_FALSE">Đúng / Sai</option>
              <option value="TEXT">Tự luận</option>
              <option value="AUDIO">Trả lời âm thanh</option>
            </select>
          </label>
          <label className="text-xs font-bold text-gray-500">
            Độ khó
            <select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value as QuestionDifficulty })} className="mt-1 w-full rounded-xl border p-3 text-sm">
              <option value="EASY">Dễ</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HARD">Khó</option>
            </select>
          </label>
          <label className="text-xs font-bold text-gray-500">
            Điểm
            <input type="number" min="0" step="0.5" value={form.points} onChange={(event) => setForm({ ...form, points: Number(event.target.value) })} className="mt-1 w-full rounded-xl border p-3 text-sm" />
          </label>
        </div>

        <label className="block text-xs font-bold text-gray-500">
          Nội dung câu hỏi
          <textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="Nhập nội dung câu hỏi" className="mt-1 min-h-24 w-full rounded-xl border p-3 text-sm" />
        </label>

        {isChoice && (
          <div className="overflow-hidden rounded-xl border">
            <div className="flex items-center justify-between gap-3 bg-gray-50 p-4">
              <div>
                <h2 className="text-sm font-black">Bảng phương án trả lời</h2>
                <p className="text-xs text-gray-500">{form.type === "MULTIPLE_CHOICE" ? "Có thể đánh dấu nhiều đáp án đúng." : "Đánh dấu một đáp án đúng."}</p>
              </div>
              {form.type !== "TRUE_FALSE" && (
                <button type="button" onClick={addOption} className="flex items-center gap-1 rounded-lg border bg-white px-3 py-2 text-xs font-bold">
                  <Plus className="h-4 w-4" />Thêm dòng
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-y bg-gray-50 text-xs uppercase text-gray-500">
                  <tr><th className="w-24 p-3">Mã</th><th className="p-3">Nội dung phương án</th><th className="w-28 p-3 text-center">Đáp án đúng</th><th className="w-16 p-3" /></tr>
                </thead>
                <tbody className="divide-y">
                  {options.map((option, index) => (
                    <tr key={`${option.id}-${index}`}>
                      <td className="p-3"><input value={option.id} disabled={form.type === "TRUE_FALSE"} onChange={(event) => updateOption(index, { id: event.target.value })} className="w-16 rounded-lg border p-2 text-center font-black disabled:bg-gray-100" /></td>
                      <td className="p-3"><input value={option.text} disabled={form.type === "TRUE_FALSE"} onChange={(event) => updateOption(index, { text: event.target.value })} placeholder={`Nhập phương án ${option.id}`} className="w-full rounded-lg border p-2.5 disabled:bg-gray-100" /></td>
                      <td className="p-3 text-center"><input type={form.type === "MULTIPLE_CHOICE" ? "checkbox" : "radio"} name="correct-answer" checked={option.correct} onChange={() => toggleCorrect(index)} className="h-4 w-4" aria-label={`Đánh dấu ${option.id} là đáp án đúng`} /></td>
                      <td className="p-3 text-center">{form.type !== "TRUE_FALSE" && options.length > 2 && <button type="button" onClick={() => removeOption(index)} title="Xóa phương án" className="rounded-lg p-2 text-red-500 hover:bg-red-50"><X className="h-4 w-4" /></button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <label className="block text-xs font-bold text-gray-500">
          Giải thích đáp án (không bắt buộc)
          <textarea value={form.metadata.explanation ?? ""} onChange={(event) => setForm({ ...form, metadata: { ...form.metadata, explanation: event.target.value } })} className="mt-1 min-h-20 w-full rounded-xl border p-3 text-sm" />
        </label>

        <div className="flex justify-end gap-2">
          {editing && <button type="button" onClick={cancelEdit} className="rounded-xl border px-4 py-2.5 text-sm font-bold">Hủy sửa</button>}
          <button disabled={saving || !form.content.trim()} onClick={save} className="flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {editing ? "Cập nhật câu hỏi" : "Thêm câu hỏi"}
          </button>
        </div>
      </section>

      {isLoading && <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-5 w-5 animate-spin" />Đang tải câu hỏi...</div>}
      {error && <div className="rounded-xl bg-red-50 p-4 text-red-700">{error.message}</div>}
      {!isLoading && !error && data.length === 0 && <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-gray-500">Ngân hàng này chưa có câu hỏi. Điền form phía trên để tạo câu hỏi đầu tiên.</div>}

      <div className="space-y-3">
        {data.map((question) => (
          <article key={question.id} className="rounded-2xl border bg-white p-4">
            <div className="flex justify-between gap-3">
              <div>
                <span className="text-xs font-black text-secondary">{question.type} · {question.difficulty} · {question.points} điểm</span>
                <p className="mt-2 text-sm font-bold">{question.content}</p>
                {question.metadata?.options?.length ? <p className="mt-2 text-xs text-gray-500">{question.metadata.options.map((option) => `${option.id}. ${option.text}${option.correct ? " ✓" : ""}`).join(" · ")}</p> : null}
              </div>
              <div className="flex gap-2">
                <button onClick={() => edit(question)} className="rounded-lg border p-2" title="Sửa câu hỏi"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => remove(question.id)} className="rounded-lg border border-red-100 p-2 text-red-600" title="Xóa câu hỏi"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
