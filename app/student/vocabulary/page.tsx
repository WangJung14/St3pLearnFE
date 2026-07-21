"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { ArrowLeft, Brain, Check, Layers, Loader2, Play, Volume2, X } from "lucide-react";
import { API_BASE_URL } from "@/lib/apiConfig";
import { apiFetch } from "@/lib/apiFetch";
import { buildAuthHeaders } from "@/lib/authHeaders";
import { unwrapData, type ApiResponse, type PagePayload } from "@/lib/apiResponses";
import type { DueCard, FlashcardHistory, FlashcardSetSummary } from "@/lib/endpointTypes";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

export default function VocabularyPage() {
  const { token } = useAuth();
  const search = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const setId = search.get("setId") ?? "";
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const { data: sets = [], error: setsError, isLoading: setsLoading } = useSWR<FlashcardSetSummary[]>(
    token ? ["/api/learning/flashcard-sets/available", token] : null,
    async ([path]: readonly [string, string]) => unwrapData<FlashcardSetSummary[]>(
      await apiFetch<ApiResponse<FlashcardSetSummary[]> | FlashcardSetSummary[]>(path)
    ),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const cardsKey = token && setId
    ? [`${API_BASE_URL}/api/learning/flashcard-sets/${setId}/due-cards?page=0&size=100`, token] as const
    : null;
  const { data: page, error, isLoading, mutate } = useSWR<PagePayload<DueCard>>(
    cardsKey,
    async ([url, currentToken]: readonly [string, string]) => {
      const res = await fetch(url, { headers: buildAuthHeaders(currentToken, "STUDENT") });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return unwrapData<PagePayload<DueCard>>(await res.json() as ApiResponse<PagePayload<DueCard>>);
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const { data: history } = useSWR<FlashcardHistory>(
    token ? [`${API_BASE_URL}/api/learning/dashboard/history`, token] as const : null,
    async ([url, currentToken]: readonly [string, string]) => {
      const res = await fetch(url, { headers: buildAuthHeaders(currentToken, "STUDENT") });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return unwrapData<FlashcardHistory>(await res.json() as ApiResponse<FlashcardHistory>);
    },
    { shouldRetryOnError: false }
  );

  const cards = page?.content ?? [];
  const card = cards[index];
  const selectedSet = sets.find((set) => set.id === setId);

  const openSet = (id: string) => {
    setIndex(0);
    setFlipped(false);
    router.replace(`/student/vocabulary?setId=${encodeURIComponent(id)}`);
  };

  const review = async (qualityScore: number) => {
    if (!card) return;
    setReviewing(true);
    try {
      await apiFetch(`/api/learning/flashcards/${card.flashcardId}/review`, {
        method: "POST",
        body: JSON.stringify({ qualityScore }),
      });
      toast.success("Đã ghi nhận kết quả");
      setFlipped(false);
      if (index < cards.length - 1) setIndex(index + 1);
      else {
        await mutate();
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

  if (!setId) {
    return <div className="space-y-6">
      <header><h1 className="flex items-center gap-2 text-2xl font-black"><Brain className="text-primary" />Luyện flashcard</h1><p className="text-sm text-gray-500">Chọn bộ thẻ công khai hoặc thuộc khóa học của bạn.</p></header>
      {setsLoading && <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin" /></div>}
      {setsError && <div className="rounded-xl bg-red-50 p-4 text-red-700">{setsError instanceof Error ? setsError.message : "Không tải được bộ thẻ"}</div>}
      {!setsLoading && !setsError && sets.length === 0 && <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-gray-500">Chưa có bộ flashcard nào dành cho bạn.</div>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{sets.map((set) => <article key={set.id} className="flex flex-col rounded-2xl border bg-white p-5 shadow-soft"><div className="mb-4 flex items-start justify-between"><Layers className="h-7 w-7 text-secondary" /><span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-black">{set.visibility}</span></div><h2 className="font-black">{set.title}</h2><p className="mb-5 mt-1 text-xs text-gray-500">{set.cardCount} thẻ</p><button disabled={set.cardCount === 0} onClick={() => openSet(set.id)} className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-primary p-3 text-sm font-bold text-white disabled:bg-gray-300"><Play className="h-4 w-4" />{set.cardCount ? "Bắt đầu luyện" : "Bộ thẻ đang trống"}</button></article>)}</div>
    </div>;
  }

  return <div className="mx-auto max-w-3xl space-y-6">
    <button onClick={() => router.replace("/student/vocabulary")} className="flex items-center gap-2 text-sm font-bold text-gray-500"><ArrowLeft className="h-4 w-4" />Chọn bộ thẻ khác</button>
    <header><h1 className="text-2xl font-black">{selectedSet?.title ?? "Luyện flashcard"}</h1><p className="text-sm text-gray-500">{cards.length} thẻ đến hạn</p></header>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{history && Object.entries(history).map(([key, value]) => <div key={key} className="rounded-xl border bg-white p-3"><b className="block text-lg">{typeof value === "number" ? Number(value.toFixed?.(2) ?? value) : String(value)}</b><span className="text-xs text-gray-500">{key}</span></div>)}</div>
    {isLoading && <Loader2 className="mx-auto h-6 w-6 animate-spin" />}
    {error && <div className="rounded-xl bg-red-50 p-4 text-red-700">{error.message}</div>}
    {!isLoading && !error && !card && <div className="rounded-2xl border border-dashed p-8 text-center text-gray-500">Không có thẻ đến hạn trong bộ này.</div>}
    {card && <><button onClick={() => setFlipped(!flipped)} className="flex min-h-72 w-full flex-col items-center justify-center rounded-3xl border bg-white p-8 shadow-soft"><span className="text-xs font-bold uppercase text-gray-400">{card.partOfSpeech}</span><h2 className="my-3 text-4xl font-black">{card.lemma}</h2><p className="text-secondary">{card.phonetic}</p>{flipped && <p className="mt-6 rounded-xl bg-gray-50 p-4 text-lg font-bold">{card.definition || "Chưa có nghĩa"}</p>}</button><div className="flex justify-center gap-5"><button disabled={reviewing} onClick={() => review(1)} className="rounded-full border border-red-100 bg-red-50 p-4 text-red-600"><X /></button><button onClick={speak} className="rounded-full bg-blue-50 p-4 text-secondary"><Volume2 /></button><button disabled={reviewing} onClick={() => review(5)} className="rounded-full bg-emerald-500 p-4 text-white"><Check /></button></div></>}
  </div>;
}
