"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Brain, Check, Loader2, Volume2, X, Plus, BookOpen, Globe, Lock, ArrowLeft, PlusCircle } from "lucide-react";
import { API_BASE_URL } from "@/lib/apiConfig";
import { apiFetch } from "@/lib/apiFetch";
import { buildAuthHeaders } from "@/lib/authHeaders";
import { unwrapData, type ApiResponse, type PagePayload } from "@/lib/apiResponses";
import type { DueCard, FlashcardHistory } from "@/lib/endpointTypes";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

interface FlashcardSet {
  id: string;
  title: string;
  visibility: "PUBLIC" | "PRIVATE" | "SYSTEM" | "COURSE_ONLY";
  setCards?: any[];
}

export default function VocabularyPage() {
  const { token } = useAuth();
  const search = useSearchParams();
  const router = useRouter();
  const toast = useToast();

  const setId = search.get("setId") ?? "";
  const [activeTab, setActiveTab] = useState<"my-sets" | "public-sets">("my-sets");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSetTitle, setNewSetTitle] = useState("");
  const [newSetVisibility, setNewSetVisibility] = useState("PRIVATE");

  const [showAddWordId, setShowAddWordId] = useState<string | null>(null);
  const [newWordLemma, setNewWordLemma] = useState("");
  const [newWordPOS, setNewWordPOS] = useState("noun");
  const [newWordPhonetic, setNewWordPhonetic] = useState("");
  const [newWordDef, setNewWordDef] = useState("");

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  // 1. Tải danh sách bộ từ vựng cá nhân
  const { data: mySets = [], mutate: mutateMySets } = useSWR<FlashcardSet[]>(
    token && activeTab === "my-sets" ? [`${API_BASE_URL}/api/learning/flashcard-sets?publicOnly=false`, token] as const : null,
    async ([url, t]: readonly [string, string]) => {
      const res = await fetch(url, { headers: buildAuthHeaders(t, "STUDENT") });
      if (!res.ok) return [];
      const body = await res.json();
      return unwrapData<FlashcardSet[]>(body) || [];
    }
  );

  // 2. Tải danh sách bộ từ vựng công khai
  const { data: publicSets = [], mutate: mutatePublicSets } = useSWR<FlashcardSet[]>(
    token && activeTab === "public-sets" ? [`${API_BASE_URL}/api/learning/flashcard-sets?publicOnly=true`, token] as const : null,
    async ([url, t]: readonly [string, string]) => {
      const res = await fetch(url, { headers: buildAuthHeaders(t, "STUDENT") });
      if (!res.ok) return [];
      const body = await res.json();
      return unwrapData<FlashcardSet[]>(body) || [];
    }
  );

  // 3. Tải danh sách thẻ cần học của bộ thẻ đang chọn
  const cardsKey = token && setId ? [`${API_BASE_URL}/api/learning/flashcard-sets/${setId}/due-cards?page=0&size=100`, token] as const : null;
  const { data: page, error: cardsError, isLoading: loadingCards, mutate: mutateCards } = useSWR<PagePayload<DueCard>>(
    cardsKey,
    async ([url, t]: readonly [string, string]) => {
      const res = await fetch(url, { headers: buildAuthHeaders(t, "STUDENT") });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return unwrapData<PagePayload<DueCard>>(await res.json() as ApiResponse<PagePayload<DueCard>>);
    },
    { revalidateOnFocus: false }
  );

  // 4. Tải lịch sử học tập
  const { data: history } = useSWR<FlashcardHistory>(
    token ? [`${API_BASE_URL}/api/learning/dashboard/history`, token] as const : null,
    async ([url, t]: readonly [string, string]) => {
      const res = await fetch(url, { headers: buildAuthHeaders(t, "STUDENT") });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return unwrapData<FlashcardHistory>(await res.json() as ApiResponse<FlashcardHistory>);
    },
    { shouldRetryOnError: false }
  );

  const cards = page?.content ?? [];
  const card = cards[index];

  // Hành động học tập
  const review = async (qualityScore: number) => {
    if (!card) return;
    setReviewing(true);
    try {
      await apiFetch(`/api/learning/flashcards/${card.flashcardId}/review`, {
        method: "POST",
        body: JSON.stringify({ qualityScore })
      });
      toast.success("Đã ghi nhận kết quả ôn tập");
      setFlipped(false);
      if (index < cards.length - 1) {
        setIndex(index + 1);
      } else {
        await mutateCards();
        setIndex(0);
      }
    } catch (cause) {
      toast.error("Không thể lưu đánh giá", cause instanceof Error ? cause.message : "Request failed");
    } finally {
      setReviewing(false);
    }
  };

  const speak = () => {
    if (!card || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(card.lemma);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  // Tạo bộ từ vựng mới
  const handleCreateSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSetTitle.trim()) return;
    try {
      await apiFetch("/api/learning/flashcard-sets", {
        method: "POST",
        body: JSON.stringify({ title: newSetTitle.trim(), visibility: newSetVisibility })
      });
      toast.success("Đã tạo bộ từ vựng mới");
      setNewSetTitle("");
      setShowCreateForm(false);
      void mutateMySets();
    } catch (err) {
      toast.error("Không thể tạo bộ từ vựng");
    }
  };

  // Nhân bản bộ từ vựng công khai
  const handleCloneSet = async (setIdToClone: string) => {
    try {
      await apiFetch(`/api/learning/flashcard-sets/${setIdToClone}/clone`, { method: "POST" });
      toast.success("Đã lưu bộ từ vựng về bộ thẻ cá nhân!");
      setActiveTab("my-sets");
      void mutateMySets();
    } catch (err) {
      toast.error("Nhân bản bộ từ vựng thất bại");
    }
  };

  // Thêm từ mới vào bộ thẻ
  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddWordId || !newWordLemma.trim() || !newWordDef.trim()) return;
    try {
      await apiFetch(`/api/learning/flashcard-sets/${showAddWordId}/words`, {
        method: "POST",
        body: JSON.stringify({
          lemma: newWordLemma.trim(),
          partOfSpeech: newWordPOS,
          phonetic: newWordPhonetic.trim(),
          definition: newWordDef.trim()
        })
      });
      toast.success(`Đã thêm từ "${newWordLemma}" thành công!`);
      setNewWordLemma("");
      setNewWordPhonetic("");
      setNewWordDef("");
      setShowAddWordId(null);
      void mutateMySets();
    } catch (err) {
      toast.error("Thêm từ thất bại");
    }
  };

  // GIAO DIỆN HỌC CARD (Khi đã chọn setId)
  if (setId) {
    return (
      <div className="w-[600px] max-w-full mx-auto space-y-6">
        <button
          onClick={() => {
            router.replace("/student/vocabulary");
            setIndex(0);
            setFlipped(false);
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại bộ thẻ
        </button>

        {loadingCards && <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />}
        {cardsError && <div className="rounded-2xl bg-red-50 p-4 text-xs font-bold text-red-700">{cardsError.message}</div>}

        {!loadingCards && !cardsError && cards.length === 0 && (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center space-y-3">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="font-extrabold text-sm text-gray-700">Bộ thẻ chưa có từ vựng cần học</h3>
            <p className="text-3xs text-gray-400 max-w-xs mx-auto">
              Không có thẻ từ vựng nào đến hạn ôn tập trong bộ thẻ này. Bạn hãy bấm vào nút &quot;Thêm từ&quot; để bổ sung từ mới nhé!
            </p>
          </div>
        )}

        {card && (
          <div className="space-y-6">
            <div className="flex justify-between items-center text-3xs font-extrabold uppercase text-gray-400 tracking-wider">
              <span>Đang học từ vựng</span>
              <span>Thẻ {index + 1} / {cards.length}</span>
            </div>

            {/* Thẻ lật Flashcard */}
            <button
              onClick={() => setFlipped(!flipped)}
              className="flex min-h-[300px] w-full flex-col items-center justify-center rounded-3xl border border-gray-150 bg-white p-8 shadow-soft hover:shadow-hover hover:border-primary/20 transition-all cursor-pointer text-center relative overflow-hidden"
            >
              <span className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-wider bg-gray-50 text-gray-400 px-2 py-0.5 rounded-lg">
                Mặt {flipped ? "sau" : "trước"}
              </span>

              <span className="text-xs font-extrabold uppercase tracking-widest text-primary bg-primary/5 px-3 py-1 rounded-xl">
                {card.partOfSpeech}
              </span>
              <h2 className="my-4 text-4xl font-black text-gray-900 tracking-tight">{card.lemma}</h2>
              <p className="text-sm font-bold text-secondary tracking-wide">{card.phonetic}</p>

              {flipped && (
                <div className="mt-8 border-t border-gray-100 pt-6 max-w-sm w-full animate-fade-in">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Ý nghĩa</p>
                  <p className="text-sm font-extrabold text-gray-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {card.backType === "MEANING" ? "Định nghĩa/Giải nghĩa từ" : "Nội dung phản hồi chi tiết của từ vựng"}
                  </p>
                </div>
              )}
            </button>

            {/* Các phím phản hồi ôn tập */}
            <div className="flex justify-center items-center gap-6">
              <button
                disabled={reviewing}
                onClick={() => review(1)}
                className="w-14 h-14 rounded-full border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center shadow transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Quên từ / Phát âm sai"
              >
                <X className="w-6 h-6" />
              </button>
              <button
                onClick={speak}
                className="w-16 h-16 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer animate-pulse"
                title="Phát âm tiếng Anh"
              >
                <Volume2 className="w-7 h-7" />
              </button>
              <button
                disabled={reviewing}
                onClick={() => review(5)}
                className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Thuộc từ / Nhớ đúng"
              >
                <Check className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // GIAO DIỆN CHỌN BỘ THẺ CHÍNH
  return (
    <div className="w-[600px] max-w-full mx-auto space-y-6">
      {/* Thống kê lịch sử ôn tập */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {history && (
          <>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-soft">
              <b className="block text-xl font-black text-primary">{history.totalCardsReviewed}</b>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Đã ôn tập</span>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-soft">
              <b className="block text-xl font-black text-secondary">{history.newCardsLearned}</b>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Từ mới học</span>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-soft">
              <b className="block text-xl font-black text-emerald-600">{history.masteredCards}</b>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Đã thuần thục</span>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-soft">
              <b className="block text-xl font-black text-purple-600">{history.averageEasinessFactor.toFixed(1)}</b>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Độ dễ TB</span>
            </div>
          </>
        )}
      </div>

      {/* Tabs chuyển đổi giữa bộ thẻ cá nhân và cộng đồng */}
      <div className="flex justify-between items-center border-b border-gray-150 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("my-sets")}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
              activeTab === "my-sets" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            Bộ thẻ của tôi
          </button>
          <button
            onClick={() => setActiveTab("public-sets")}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
              activeTab === "public-sets" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            Thư viện cộng đồng
          </button>
        </div>

        {activeTab === "my-sets" && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-1.5 text-xs font-black text-primary hover:opacity-90 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Tạo bộ thẻ
          </button>
        )}
      </div>

      {/* Form tạo bộ thẻ mới */}
      {showCreateForm && activeTab === "my-sets" && (
        <form onSubmit={handleCreateSet} className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl space-y-3 animate-fade-in">
          <h3 className="text-xs font-black text-slate-800">Tạo Bộ Từ Vựng Mới</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập tên bộ thẻ (Ví dụ: Từ vựng IELTS Basic)..."
              value={newSetTitle}
              onChange={(e) => setNewSetTitle(e.target.value)}
              className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white font-bold"
              required
            />
            <select
              value={newSetVisibility}
              onChange={(e) => setNewSetVisibility(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white font-bold"
            >
              <option value="PRIVATE">Riêng tư</option>
              <option value="PUBLIC">Công khai</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-3 py-1.5 text-3xs font-extrabold text-gray-500 rounded-lg hover:bg-gray-150 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-3xs font-black text-white bg-primary rounded-lg hover:opacity-90 cursor-pointer"
            >
              Tạo bộ thẻ
            </button>
          </div>
        </form>
      )}

      {/* Pop-up thêm từ mới */}
      {showAddWordId && (
        <form onSubmit={handleAddWord} className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl space-y-3 animate-fade-in">
          <h3 className="text-xs font-black text-slate-800">Thêm từ vựng mới vào bộ thẻ</h3>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Từ tiếng Anh (e.g. Apple)"
              value={newWordLemma}
              onChange={(e) => setNewWordLemma(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white font-bold"
              required
            />
            <input
              type="text"
              placeholder="Phiên âm (e.g. /ˈæp.əl/)"
              value={newWordPhonetic}
              onChange={(e) => setNewWordPhonetic(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white font-bold"
            />
            <select
              value={newWordPOS}
              onChange={(e) => setNewWordPOS(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white font-bold"
            >
              <option value="noun">Danh từ (n)</option>
              <option value="verb">Động từ (v)</option>
              <option value="adjective">Tính từ (adj)</option>
              <option value="adverb">Trạng từ (adv)</option>
              <option value="preposition">Giới từ</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="Nghĩa của từ / Định nghĩa giải nghĩa..."
            value={newWordDef}
            onChange={(e) => setNewWordDef(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white font-bold"
            required
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddWordId(null)}
              className="px-3 py-1.5 text-3xs font-extrabold text-gray-500 rounded-lg hover:bg-gray-150 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-3xs font-black text-white bg-primary rounded-lg hover:opacity-90 cursor-pointer"
            >
              Thêm từ
            </button>
          </div>
        </form>
      )}

      {/* Danh sách các bộ thẻ hiển thị */}
      <div className="space-y-3">
        {activeTab === "my-sets" ? (
          mySets.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 p-8 text-center text-xs font-bold text-gray-400">
              Bạn chưa tạo bộ từ vựng cá nhân nào. Bấm &quot;Tạo bộ thẻ&quot; ở trên để bắt đầu!
            </div>
          ) : (
            mySets.map((set) => (
              <div key={set.id} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-2xl shadow-soft hover:border-primary/20 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-black text-gray-800">{set.title}</h4>
                    {set.visibility === "PUBLIC" ? (
                      <span title="Công khai"><Globe className="w-3.5 h-3.5 text-emerald-500" /></span>
                    ) : (
                      <span title="Riêng tư"><Lock className="w-3.5 h-3.5 text-amber-500" /></span>
                    )}
                  </div>
                  <p className="text-3xs text-gray-400 font-bold">
                    Có {set.setCards?.length || 0} thẻ từ vựng
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddWordId(set.id)}
                    className="px-3 py-1.5 text-3xs font-extrabold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer"
                  >
                    Thêm từ
                  </button>
                  <button
                    onClick={() => router.replace(`/student/vocabulary?setId=${set.id}`)}
                    className="px-4 py-1.5 text-3xs font-black text-white bg-primary rounded-xl hover:opacity-90 cursor-pointer"
                  >
                    Luyện tập
                  </button>
                </div>
              </div>
            ))
          )
        ) : (
          publicSets.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 p-8 text-center text-xs font-bold text-gray-400">
              Thư viện cộng đồng hiện chưa có bộ từ vựng công khai nào.
            </div>
          ) : (
            publicSets.map((set) => (
              <div key={set.id} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-2xl shadow-soft hover:border-primary/20 transition-all">
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-gray-800">{set.title}</h4>
                  <p className="text-3xs text-gray-400 font-bold">
                    Có {set.setCards?.length || 0} thẻ từ vựng • Người tạo: St3pLearn
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCloneSet(set.id)}
                    className="px-3 py-1.5 text-3xs font-black text-primary border border-primary/20 rounded-xl hover:bg-primary/5 cursor-pointer"
                  >
                    Lưu về bộ thẻ của tôi
                  </button>
                  <button
                    onClick={() => router.replace(`/student/vocabulary?setId=${set.id}`)}
                    className="px-4 py-1.5 text-3xs font-black text-white bg-primary rounded-xl hover:opacity-90 cursor-pointer"
                  >
                    Luyện tập
                  </button>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
