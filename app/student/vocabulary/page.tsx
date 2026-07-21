"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Brain, Check, Loader2, Volume2, X } from "lucide-react";
import { API_BASE_URL } from "@/lib/apiConfig";
import { apiFetch } from "@/lib/apiFetch";
import { buildAuthHeaders } from "@/lib/authHeaders";
import { unwrapData, type ApiResponse, type PagePayload } from "@/lib/apiResponses";
import type { DueCard, FlashcardHistory } from "@/lib/endpointTypes";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

export default function VocabularyPage() {
  const { token } = useAuth(); const search = useSearchParams(); const router = useRouter(); const toast = useToast();
  const setId = search.get("setId") ?? ""; const [inputId, setInputId] = useState(setId); const [index, setIndex] = useState(0); const [flipped, setFlipped] = useState(false); const [reviewing, setReviewing] = useState(false);
  const cardsKey = token && setId ? [`${API_BASE_URL}/api/learning/flashcard-sets/${setId}/due-cards?page=0&size=100`, token] as const : null;
  const { data: page, error, isLoading, mutate } = useSWR<PagePayload<DueCard>>(cardsKey, async ([url, t]: readonly [string, string]) => { const res = await fetch(url, { headers: buildAuthHeaders(t, "STUDENT") }); if (!res.ok) throw new Error(`HTTP ${res.status}`); return unwrapData<PagePayload<DueCard>>(await res.json() as ApiResponse<PagePayload<DueCard>>); }, { revalidateOnFocus: false });
  const { data: history } = useSWR<FlashcardHistory>(token ? [`${API_BASE_URL}/api/learning/dashboard/history`, token] as const : null, async ([url, t]: readonly [string, string]) => { const res = await fetch(url, { headers: buildAuthHeaders(t, "STUDENT") }); if (!res.ok) throw new Error(`HTTP ${res.status}`); return unwrapData<FlashcardHistory>(await res.json() as ApiResponse<FlashcardHistory>); }, { shouldRetryOnError: false });
  const cards = page?.content ?? []; const card = cards[index];
  const review = async (qualityScore: number) => { if (!card) return; setReviewing(true); try { await apiFetch(`/api/learning/flashcards/${card.flashcardId}/review`, { method: "POST", body: JSON.stringify({ qualityScore }) }); toast.success("Đã ghi nhận kết quả"); setFlipped(false); if (index < cards.length - 1) setIndex(index + 1); else { await mutate(); setIndex(0); } } catch (cause) { toast.error("Không thể lưu đánh giá", cause instanceof Error ? cause.message : "Request failed"); } finally { setReviewing(false); } };
  const speak = () => { if (!card || !("speechSynthesis" in window)) return; const utterance = new SpeechSynthesisUtterance(card.lemma); utterance.lang = "en-US"; window.speechSynthesis.speak(utterance); };

  if (!setId) return <div className="mx-auto max-w-xl space-y-4 rounded-3xl border bg-white p-8 text-center shadow-soft"><Brain className="mx-auto h-10 w-10 text-primary" /><h1 className="text-2xl font-black">Luyện flashcard</h1><p className="text-sm text-gray-500">Backend chưa có API liệt kê flashcard set. Nhập Set ID được giảng viên cung cấp.</p><input value={inputId} onChange={(e) => setInputId(e.target.value)} placeholder="Flashcard Set ID" className="w-full rounded-xl border p-3" /><button disabled={!inputId.trim()} onClick={() => router.replace(`/student/vocabulary?setId=${encodeURIComponent(inputId.trim())}`)} className="rounded-xl bg-primary px-5 py-3 font-bold text-white disabled:opacity-50">Mở bộ thẻ</button></div>;
  return <div className="mx-auto max-w-3xl space-y-6"><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{history && Object.entries(history).map(([key, value]) => <div key={key} className="rounded-xl border bg-white p-3"><b className="block text-lg">{typeof value === "number" ? Number(value.toFixed?.(2) ?? value) : String(value)}</b><span className="text-xs text-gray-500">{key}</span></div>)}</div>{isLoading && <Loader2 className="mx-auto h-6 w-6 animate-spin" />}{error && <div className="rounded-xl bg-red-50 p-4 text-red-700">{error.message}</div>}{!isLoading && !error && !card && <div className="rounded-2xl border border-dashed p-8 text-center text-gray-500">Không có thẻ đến hạn.</div>}{card && <><button onClick={() => setFlipped(!flipped)} className="flex min-h-72 w-full flex-col items-center justify-center rounded-3xl border bg-white p-8 shadow-soft"><span className="text-xs font-bold uppercase text-gray-400">{card.partOfSpeech}</span><h2 className="my-3 text-4xl font-black">{card.lemma}</h2><p className="text-secondary">{card.phonetic}</p>{flipped && <p className="mt-6 rounded-xl bg-gray-50 p-4 text-sm">Loại mặt sau: {card.backType}. Nội dung chi tiết phụ thuộc vocabulary service.</p>}</button><div className="flex justify-center gap-5"><button disabled={reviewing} onClick={() => review(1)} className="rounded-full border border-red-100 bg-red-50 p-4 text-red-600"><X /></button><button onClick={speak} className="rounded-full bg-blue-50 p-4 text-secondary"><Volume2 /></button><button disabled={reviewing} onClick={() => review(5)} className="rounded-full bg-emerald-500 p-4 text-white"><Check /></button></div></>}</div>;
}
