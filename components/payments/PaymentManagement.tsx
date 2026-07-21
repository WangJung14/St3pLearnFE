"use client";

import { useState } from "react";
import { BadgePercent, CheckCircle, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import type { CouponPayload, DiscountType } from "@/lib/endpointTypes";
import { useToast } from "@/components/ui/Toast";

const initialCoupon: CouponPayload = { code: "", courseId: "", discountType: "PERCENTAGE", discountValue: 10, maxDiscount: 0, usageLimit: 100, startDate: "", endDate: "" };
const inputClass = "rounded-xl border p-2";

export default function PaymentManagement({ canApproveRefund }: { canApproveRefund: boolean }) {
  const toast = useToast();
  const [coupon, setCoupon] = useState(initialCoupon);
  const [refundId, setRefundId] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const createCoupon = async () => {
    if (!coupon.code || !coupon.startDate || !coupon.endDate) return;
    setBusy("coupon");
    try {
      await apiFetch("/api/payment/coupons", { method: "POST", body: JSON.stringify({ ...coupon, courseId: coupon.courseId || null, maxDiscount: coupon.maxDiscount || null, usageLimit: coupon.usageLimit || null }) });
      setCoupon(initialCoupon); toast.success("Đã tạo coupon");
    } catch (cause) { toast.error("Không thể tạo coupon", cause instanceof Error ? cause.message : undefined); }
    finally { setBusy(null); }
  };
  const approve = async () => {
    if (!refundId || !confirm("Phê duyệt yêu cầu hoàn tiền này?")) return;
    setBusy("refund");
    try { await apiFetch(`/api/payment/refunds/${refundId}/approve`, { method: "POST" }); setRefundId(""); toast.success("Đã phê duyệt hoàn tiền"); }
    catch (cause) { toast.error("Không thể phê duyệt", cause instanceof Error ? cause.message : undefined); }
    finally { setBusy(null); }
  };

  return <div className="space-y-6"><header><h1 className="text-2xl font-black">Quản lý thanh toán</h1><p className="text-sm text-gray-500">Coupon và refund qua Payment Service.</p></header>
    <section className="space-y-3 rounded-2xl border bg-white p-5"><h2 className="flex items-center gap-2 font-black"><BadgePercent className="text-primary" />Tạo coupon</h2><div className="grid gap-3 md:grid-cols-2"><input value={coupon.code} onChange={(event) => setCoupon({ ...coupon, code: event.target.value.toUpperCase() })} placeholder="Mã coupon" className={inputClass} /><input value={coupon.courseId} onChange={(event) => setCoupon({ ...coupon, courseId: event.target.value })} placeholder="Course ID (tùy chọn)" className={inputClass} /><select value={coupon.discountType} onChange={(event) => setCoupon({ ...coupon, discountType: event.target.value as DiscountType })} className={inputClass}><option value="PERCENTAGE">PERCENTAGE</option><option value="FIXED_AMOUNT">FIXED_AMOUNT</option></select><input type="number" min="0" value={coupon.discountValue} onChange={(event) => setCoupon({ ...coupon, discountValue: Number(event.target.value) })} placeholder="Giá trị giảm" className={inputClass} /><input type="number" min="0" value={coupon.maxDiscount} onChange={(event) => setCoupon({ ...coupon, maxDiscount: Number(event.target.value) })} placeholder="Giảm tối đa" className={inputClass} /><input type="number" min="1" value={coupon.usageLimit} onChange={(event) => setCoupon({ ...coupon, usageLimit: Number(event.target.value) })} placeholder="Giới hạn lượt dùng" className={inputClass} /><label className="text-xs font-bold text-gray-500">Bắt đầu<input type="datetime-local" value={coupon.startDate} onChange={(event) => setCoupon({ ...coupon, startDate: event.target.value })} className={`mt-1 w-full ${inputClass}`} /></label><label className="text-xs font-bold text-gray-500">Kết thúc<input type="datetime-local" value={coupon.endDate} onChange={(event) => setCoupon({ ...coupon, endDate: event.target.value })} className={`mt-1 w-full ${inputClass}`} /></label></div><button disabled={busy !== null || !coupon.code || !coupon.startDate || !coupon.endDate} onClick={createCoupon} className="rounded-xl bg-primary px-4 py-2 font-bold text-white disabled:opacity-50">{busy === "coupon" ? "Đang tạo..." : "Tạo coupon"}</button></section>
    {canApproveRefund && <section className="space-y-3 rounded-2xl border bg-white p-5"><h2 className="flex items-center gap-2 font-black"><CheckCircle className="text-emerald-600" />Phê duyệt hoàn tiền</h2><p className="text-xs text-gray-500">Backend chưa có API list refund; nhập Refund ID trực tiếp.</p><div className="flex gap-2"><input value={refundId} onChange={(event) => setRefundId(event.target.value)} placeholder="Refund ID" className={`flex-1 ${inputClass}`} /><button disabled={!refundId || busy !== null} onClick={approve} className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white">{busy === "refund" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}</button></div></section>}
  </div>;
}
