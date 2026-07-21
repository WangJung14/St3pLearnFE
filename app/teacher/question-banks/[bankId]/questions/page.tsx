"use client";

import { use, useState } from "react";
import useSWR from "swr";
import { Loader2, Pencil, Plus, Trash2, HelpCircle, Check, AlertCircle } from "lucide-react";
import { API_BASE_URL } from "@/lib/apiConfig";
import { apiFetch } from "@/lib/apiFetch";
import { buildAuthHeaders } from "@/lib/authHeaders";
import { unwrapData, type ApiResponse } from "@/lib/apiResponses";
import type { Question, QuestionDifficulty, QuestionType } from "@/lib/endpointTypes";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

interface FormState {
  type: QuestionType;
  content: string;
  difficulty: QuestionDifficulty;
  points: number;
  // Cho Single Choice (Tự luận ngắn/Điền từ)
  singleChoiceAnswer: string;
  // Cho Multiple Choice (4 đáp án A, B, C, D)
  multiOptions: { id: string; text: string; isCorrect: boolean }[];
  // Cho True/False (Đúng / Sai)
  isTrueCorrect: boolean;
  // Cho Text (Tự luận dài / Essay)
  essayAnswer: string;
}

const EMPTY_FORM: FormState = {
  type: "SINGLE_CHOICE",
  content: "",
  difficulty: "MEDIUM",
  points: 1,
  singleChoiceAnswer: "",
  multiOptions: [
    { id: "A", text: "", isCorrect: false },
    { id: "B", text: "", isCorrect: false },
    { id: "C", text: "", isCorrect: false },
    { id: "D", text: "", isCorrect: false },
  ],
  isTrueCorrect: true,
  essayAnswer: "",
};

export default function QuestionsPage({ params }: { params: Promise<{ bankId: string }> }) {
  const { bankId } = use(params);
  const { token } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const key = token ? [`${API_BASE_URL}/api/learning/question-banks/${bankId}/questions`, token] as const : null;
  const { data = [], error, isLoading, mutate } = useSWR<Question[]>(key, async ([url, currentToken]: readonly [string, string]) => {
    const res = await fetch(url, { headers: buildAuthHeaders(currentToken) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return unwrapData<Question[]>(await res.json() as ApiResponse<Question[]>);
  });

  const save = async () => {
    if (!form.content.trim()) return;

    // Validate inputs based on Question Type
    let metadata: Record<string, any> = {};

    if (form.type === "SINGLE_CHOICE") {
      if (!form.singleChoiceAnswer.trim()) {
        toast.error("Vui lòng nhập đáp án tự luận ngắn!");
        return;
      }
      metadata = {
        options: [
          { id: "A", text: form.singleChoiceAnswer.trim(), isCorrect: true, correct: true }
        ]
      };
    } else if (form.type === "MULTIPLE_CHOICE") {
      const filledOptions = form.multiOptions.filter(o => o.text.trim());
      if (filledOptions.length < 2) {
        toast.error("Vui lòng điền ít nhất 2 đáp án trắc nghiệm!");
        return;
      }
      const hasCorrect = filledOptions.some(o => o.isCorrect);
      if (!hasCorrect) {
        toast.error("Vui lòng chọn ít nhất một đáp án đúng!");
        return;
      }
      metadata = {
        options: filledOptions.map(o => ({
          id: o.id,
          text: o.text.trim(),
          isCorrect: o.isCorrect,
          correct: o.isCorrect
        }))
      };
    } else if (form.type === "TRUE_FALSE") {
      metadata = {
        options: [
          { id: "T", text: "True", isCorrect: form.isTrueCorrect, correct: form.isTrueCorrect },
          { id: "F", text: "False", isCorrect: !form.isTrueCorrect, correct: !form.isTrueCorrect }
        ],
        isTrueFalse: true
      };
    } else if (form.type === "TEXT") {
      metadata = {
        essayAnswer: form.essayAnswer.trim()
      };
    }

    let backendType: any = form.type;
    if (form.type === "TRUE_FALSE") {
      backendType = "SINGLE_CHOICE";
    } else if (form.type === "TEXT") {
      backendType = "ESSAY";
    }

    setSaving(true);
    try {
      const path = editing ? `/api/learning/questions/${editing}` : `/api/learning/question-banks/${bankId}/questions`;
      await apiFetch(path, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({
          type: backendType,
          content: form.content,
          difficulty: form.difficulty,
          points: form.points,
          metadata
        })
      });
      toast.success(editing ? "Đã cập nhật câu hỏi" : "Đã tạo câu hỏi");
      setEditing(null);
      setForm(EMPTY_FORM);
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
    setEditing(question.id);

    // Phân tích metadata ngược lại FormState
    let singleChoiceAnswer = "";
    let multiOptions = [
      { id: "A", text: "", isCorrect: false },
      { id: "B", text: "", isCorrect: false },
      { id: "C", text: "", isCorrect: false },
      { id: "D", text: "", isCorrect: false },
    ];
    let isTrueCorrect = true;
    let essayAnswer = "";

    const meta = (question.metadata || {}) as any;

    let displayType = question.type;
    if (question.type === "SINGLE_CHOICE" && meta.isTrueFalse) {
      displayType = "TRUE_FALSE" as QuestionType;
    } else if ((question.type as string) === "ESSAY") {
      displayType = "TEXT" as QuestionType;
    }

    if (displayType === "SINGLE_CHOICE") {
      if (Array.isArray(meta.options) && meta.options.length > 0) {
        singleChoiceAnswer = meta.options[0].text || "";
      }
    } else if (displayType === "MULTIPLE_CHOICE") {
      if (Array.isArray(meta.options)) {
        multiOptions = [
          { id: "A", text: "", isCorrect: false },
          { id: "B", text: "", isCorrect: false },
          { id: "C", text: "", isCorrect: false },
          { id: "D", text: "", isCorrect: false },
        ].map(def => {
          const found = meta.options.find((o: any) => o.id === def.id);
          return found ? { id: found.id, text: found.text || "", isCorrect: !!found.isCorrect } : def;
        });
      }
    } else if (displayType === "TRUE_FALSE") {
      if (Array.isArray(meta.options)) {
        const trueOpt = meta.options.find((o: any) => o.id === "T");
        if (trueOpt) {
          isTrueCorrect = !!trueOpt.isCorrect;
        }
      }
    } else if (displayType === "TEXT") {
      essayAnswer = meta.essayAnswer || "";
    }

    setForm({
      type: displayType,
      content: question.content,
      difficulty: question.difficulty,
      points: question.points,
      singleChoiceAnswer,
      multiOptions,
      isTrueCorrect,
      essayAnswer,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-950">Câu hỏi trong ngân hàng</h1>
        <p className="text-xs text-gray-500">Bank ID: {bankId}</p>
      </div>

      <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-3xs font-extrabold uppercase text-gray-400">Loại câu hỏi</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as QuestionType })}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="SINGLE_CHOICE">SINGLE_CHOICE (Tự luận ngắn)</option>
              <option value="MULTIPLE_CHOICE">MULTIPLE_CHOICE (4 đáp án)</option>
              <option value="TRUE_FALSE">TRUE_FALSE (Đúng / Sai)</option>
              <option value="TEXT">TEXT (Tự luận dài / Essay)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-3xs font-extrabold uppercase text-gray-400">Độ khó</label>
            <select
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value as QuestionDifficulty })}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="EASY">EASY (Dễ)</option>
              <option value="MEDIUM">MEDIUM (Trung bình)</option>
              <option value="HARD">HARD (Khó)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-3xs font-extrabold uppercase text-gray-400">Điểm số</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={form.points}
              onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-3xs font-extrabold uppercase text-gray-400">Nội dung câu hỏi</label>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Nhập câu hỏi tại đây..."
            rows={3}
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Dynamic Options View based on Selected Question Type */}
        <div className="rounded-2xl bg-gray-50/50 border border-gray-100 p-5 space-y-4">
          <h3 className="text-2xs font-extrabold uppercase text-gray-400 tracking-wider">Cấu hình Đáp án & Option</h3>

          {form.type === "SINGLE_CHOICE" && (
            <div className="space-y-2">
              <label className="text-2xs font-bold text-gray-700 block">Viết đáp án tự luận ngắn đúng:</label>
              <input
                type="text"
                placeholder="Nhập từ hoặc cụm từ chính xác..."
                value={form.singleChoiceAnswer}
                onChange={(e) => setForm({ ...form, singleChoiceAnswer: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
              />
            </div>
          )}

          {form.type === "MULTIPLE_CHOICE" && (
            <div className="space-y-3">
              <p className="text-3xs text-gray-500 font-bold mb-2">Điền các tùy chọn đáp án và chọn ô vuông bên trái cho các đáp án đúng.</p>
              {form.multiOptions.map((opt, index) => (
                <div key={opt.id} className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-gray-100">
                  <input
                    type="checkbox"
                    checked={opt.isCorrect}
                    onChange={(e) => {
                      const copy = [...form.multiOptions];
                      copy[index].isCorrect = e.target.checked;
                      setForm({ ...form, multiOptions: copy });
                    }}
                    className="w-4 h-4 rounded text-primary focus:ring-primary/20 cursor-pointer"
                  />
                  <span className="text-xs font-black text-gray-400">{opt.id}</span>
                  <input
                    type="text"
                    placeholder={`Nội dung lựa chọn ${opt.id}...`}
                    value={opt.text}
                    onChange={(e) => {
                      const copy = [...form.multiOptions];
                      copy[index].text = e.target.value;
                      setForm({ ...form, multiOptions: copy });
                    }}
                    className="flex-1 text-xs border-none outline-none focus:ring-0 p-0"
                  />
                </div>
              ))}
            </div>
          )}

          {form.type === "TRUE_FALSE" && (
            <div className="flex gap-4">
              <label className="flex items-center gap-2 bg-white px-4 py-3 rounded-xl border border-gray-100 flex-1 cursor-pointer hover:bg-gray-100/50 transition-colors">
                <input
                  type="radio"
                  name="true_false"
                  checked={form.isTrueCorrect}
                  onChange={() => setForm({ ...form, isTrueCorrect: true })}
                  className="w-4 h-4 text-primary cursor-pointer"
                />
                <span className="text-xs font-bold text-gray-700">TRUE (Đúng) là đáp án đúng</span>
              </label>
              <label className="flex items-center gap-2 bg-white px-4 py-3 rounded-xl border border-gray-100 flex-1 cursor-pointer hover:bg-gray-100/50 transition-colors">
                <input
                  type="radio"
                  name="true_false"
                  checked={!form.isTrueCorrect}
                  onChange={() => setForm({ ...form, isTrueCorrect: false })}
                  className="w-4 h-4 text-primary cursor-pointer"
                />
                <span className="text-xs font-bold text-gray-700">FALSE (Sai) là đáp án đúng</span>
              </label>
            </div>
          )}

          {form.type === "TEXT" && (
            <div className="space-y-2">
              <label className="text-2xs font-bold text-gray-700 block">Viết gợi ý đáp án tự luận dài (Essay model answer):</label>
              <textarea
                placeholder="Nhập đáp án mẫu gợi ý chấm điểm..."
                value={form.essayAnswer}
                onChange={(e) => setForm({ ...form, essayAnswer: e.target.value })}
                rows={4}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
              />
            </div>
          )}
        </div>

        <button
          disabled={saving || !form.content.trim()}
          onClick={save}
          className="flex items-center justify-center gap-2 rounded-xl bg-secondary hover:opacity-95 px-5 py-3 font-bold text-white disabled:opacity-50 transition-all cursor-pointer w-full"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {editing ? "Cập nhật câu hỏi" : "Thêm câu hỏi mới"}
        </button>
      </section>

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-xs font-bold text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error.message}</span>
        </div>
      )}

      <div className="space-y-4">
        {data.map((question) => {
          let answerPreview = "";
          const meta = (question.metadata || {}) as any;

          let displayType = question.type;
          if (question.type === "SINGLE_CHOICE" && meta.isTrueFalse) {
            displayType = "TRUE_FALSE" as QuestionType;
          } else if ((question.type as string) === "ESSAY") {
            displayType = "TEXT" as QuestionType;
          }

          if (displayType === "SINGLE_CHOICE") {
            if (Array.isArray(meta.options) && meta.options.length > 0) {
              answerPreview = `Đáp án tự luận ngắn: ${meta.options[0].text}`;
            }
          } else if (displayType === "MULTIPLE_CHOICE") {
            if (Array.isArray(meta.options)) {
              answerPreview = "Tùy chọn: " + meta.options.map((o: any) => `${o.id}: ${o.text}${o.isCorrect ? " (Đúng)" : ""}`).join(" | ");
            }
          } else if (displayType === "TRUE_FALSE") {
            if (Array.isArray(meta.options)) {
              const correct = meta.options.find((o: any) => o.isCorrect);
              answerPreview = `Đáp án đúng: ${correct ? correct.text : "N/A"}`;
            }
          } else if (displayType === "TEXT") {
            answerPreview = `Gợi ý tự luận: ${meta.essayAnswer || "Không có"}`;
          }

          return (
            <article
              key={question.id}
              className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div className="space-y-2 flex-grow min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-secondary/10 text-secondary px-2.5 py-0.5 rounded-lg">
                    {displayType}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 px-2.5 py-0.5 rounded-lg">
                    {question.difficulty}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded-lg">
                    {question.points} Điểm
                  </span>
                </div>
                <p className="text-xs font-extrabold text-gray-800 leading-relaxed">{question.content}</p>
                {answerPreview && (
                  <p className="text-3xs text-gray-400 font-bold bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100/50 inline-block">
                    {answerPreview}
                  </p>
                )}
              </div>
              <div className="flex gap-2 shrink-0 self-end sm:self-auto">
                <button
                  onClick={() => edit(question)}
                  className="rounded-xl border border-gray-200 p-2.5 hover:bg-gray-50 hover:text-primary transition-all cursor-pointer"
                  title="Chỉnh sửa câu hỏi"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => remove(question.id)}
                  className="rounded-xl border border-red-100 p-2.5 text-red-600 hover:bg-red-50/50 hover:border-red-200 transition-all cursor-pointer"
                  title="Xóa câu hỏi"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
