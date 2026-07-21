"use client";

import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import { unwrapData, type ApiResponse } from "@/lib/apiResponses";
import type { RefundRequest } from "@/lib/endpointTypes";
import { useToast } from "@/components/ui/Toast";

export default function StudentPaymentsPage() {
  const toast = useToast(); const [form, setForm] = useState({ paymentOrderId: "", refundAmount: 0, reason: "" }); const [busy, setBusy] = useState(false); const [created, setCreated] = useState<RefundRequest | null>(null);
  const submit = async () => { if (!form.paymentOrderId || form.refundAmount <= 0 || !form.reason.trim()) return; if (!confirm("Gửi yêu cầu hoàn tiền?")) return; setBusy(true); try { const body = await apiFetch<ApiResponse<RefundRequest>>("/api/payment/refunds", { method: "POST", body: JSON.stringify(form) }); setCreated(unwrapData(body)); toast.success("Đã gửi yêu cầu hoàn tiền"); } catch (cause) { toast.error("Không thể gửi yêu cầu", cause instanceof Error ? cause.message : "Request failed"); } finally { setBusy(false); } };
  return <div className="mx-auto max-w-xl space-y-5"><div><h1 className="flex items-center gap-2 text-2xl font-black"><RotateCcw className="text-primary" />Yêu cầu hoàn tiền</h1><p className="text-sm text-gray-500">Backend chưa có API list order; nhập Payment Order ID từ hỗ trợ.</p></div><section className="space-y-3 rounded-2xl border bg-white p-5"><input value={form.paymentOrderId} onChange={(e) => setForm({ ...form, paymentOrderId: e.target.value })} placeholder="Payment Order ID" className="w-full rounded-xl border p-3" /><input type="number" min="1" value={form.refundAmount} onChange={(e) => setForm({ ...form, refundAmount: Number(e.target.value) })} placeholder="Số tiền hoàn" className="w-full rounded-xl border p-3" /><textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Lý do" className="w-full rounded-xl border p-3" /><button disabled={busy || !form.paymentOrderId || form.refundAmount <= 0 || !form.reason.trim()} onClick={submit} className="w-full rounded-xl bg-primary p-3 font-bold text-white disabled:opacity-50">{busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Gửi yêu cầu"}</button>{created && <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Refund ID: <b>{created.id}</b> · {created.status}</div>}</section></div>;
}
