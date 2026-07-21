"use client";

import { useState } from "react";
import { Loader2, RotateCcw, CreditCard, ShieldCheck, CheckCircle2, History, AlertCircle, FileText } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import { unwrapData, type ApiResponse } from "@/lib/apiResponses";
import type { RefundRequest } from "@/lib/endpointTypes";
import { useToast } from "@/components/ui/Toast";

export default function StudentPaymentsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"history" | "refund">("history");
  
  // Refund form state
  const [form, setForm] = useState({
    paymentOrderId: "",
    refundAmount: 0,
    reason: "",
  });
  const [busy, setBusy] = useState(false);
  const [createdRefund, setCreatedRefund] = useState<RefundRequest | null>(null);

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.paymentOrderId || form.refundAmount <= 0 || !form.reason.trim()) {
      toast.error("Vui lòng điền đầy đủ các thông tin yêu cầu.");
      return;
    }

    if (!confirm("Bạn có chắc chắn muốn gửi yêu cầu hoàn tiền cho đơn hàng này?")) return;

    setBusy(true);
    try {
      const body = await apiFetch<ApiResponse<RefundRequest>>("/api/payment/refunds", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = unwrapData(body);
      setCreatedRefund(data);
      toast.success("Đã gửi yêu cầu hoàn tiền thành công!");
      setForm({ paymentOrderId: "", refundAmount: 0, reason: "" });
    } catch (cause) {
      toast.error("Gửi yêu cầu hoàn tiền thất bại", cause instanceof Error ? cause.message : "Request failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-[600px] mx-auto space-y-6">
      {/* Header */}
      <div className="w-full bg-white p-6 rounded-3xl border border-gray-100 shadow-soft flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" /> Lịch sử & Hoàn tiền
          </h1>
          <p className="text-xs font-bold text-gray-400 mt-1">
            Quản lý thông tin thanh toán, đơn hàng và gửi yêu cầu hoàn tiền khóa học
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-150 gap-2 pb-2">
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "history" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          <History className="w-4 h-4" /> Lịch sử giao dịch
        </button>
        <button
          onClick={() => setActiveTab("refund")}
          className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "refund" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          <RotateCcw className="w-4 h-4" /> Yêu cầu hoàn tiền
        </button>
      </div>

      {/* TAB 1: LỊCH SỬ GIAO DỊCH */}
      {activeTab === "history" && (
        <div className="w-full space-y-4 animate-fade-in">
          <div className="w-full bg-white p-6 rounded-3xl border border-gray-100 shadow-soft text-center space-y-3 flex flex-col items-center">
            <ShieldCheck className="w-10 h-10 text-emerald-500" />
            <h3 className="w-full text-sm font-extrabold text-gray-800">Thanh toán bảo mật qua VNPay / VNPAY Gateway</h3>
            <p className="w-full text-xs font-medium text-gray-400 leading-relaxed">
              Tất cả các giao dịch mua khóa học của bạn trên St3pLearn đều được mã hóa bảo mật 256-bit và lưu trữ an toàn.
            </p>
          </div>

          <div className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-2 text-xs font-bold text-slate-600">
            <div className="flex items-center gap-2 text-slate-800 font-extrabold">
              <FileText className="w-4 h-4 text-primary" /> Bạn muốn tra cứu lại hóa đơn đơn hàng?
            </div>
            <p className="text-3xs text-slate-400 font-medium">
              Vui lòng sao chép mã **Payment Order ID** từ email xác nhận thanh toán để dán vào tab **&quot;Yêu cầu hoàn tiền&quot;** nếu bạn có nhu cầu hủy hoặc hoàn lại tiền khóa học trong 7 ngày đầu.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: FORM YÊU CẦU HOÀN TIỀN */}
      {activeTab === "refund" && (
        <div className="space-y-4 animate-fade-in">
          <form onSubmit={handleSubmitRefund} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-soft space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-gray-800">Gửi Yêu Cầu Hoàn Tiền</h3>
              <p className="text-3xs text-gray-400 font-bold">
                Điền chính xác mã đơn hàng và số tiền để bộ phận hỗ trợ xử lý cho bạn trong 24h.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-3xs font-extrabold uppercase text-gray-400 mb-1">Mã đơn hàng (Payment Order ID)</label>
                <input
                  type="text"
                  value={form.paymentOrderId}
                  onChange={(e) => setForm({ ...form, paymentOrderId: e.target.value })}
                  placeholder="Ví dụ: ord_98f421a..."
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-3xs font-extrabold uppercase text-gray-400 mb-1">Số tiền muốn hoàn (VNĐ)</label>
                <input
                  type="number"
                  min="1"
                  value={form.refundAmount || ""}
                  onChange={(e) => setForm({ ...form, refundAmount: Number(e.target.value) })}
                  placeholder="Nhập số tiền..."
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-3xs font-extrabold uppercase text-gray-400 mb-1">Lý do hoàn tiền</label>
                <textarea
                  rows={3}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Nhập lý do hoàn tiền (Ví dụ: Đăng ký nhầm khóa học, Nội dung không đúng mô tả...)"
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50 focus:bg-white"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy || !form.paymentOrderId || form.refundAmount <= 0 || !form.reason.trim()}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-black text-xs rounded-xl shadow-md shadow-primary/20 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Gửi yêu cầu hoàn tiền"}
            </button>
          </form>

          {/* Phản hồi sau khi tạo thành công */}
          {createdRefund && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1 animate-fade-in">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Đã gửi yêu cầu hoàn tiền thành công!
              </div>
              <p className="text-3xs font-bold text-emerald-700">
                Mã yêu cầu (Refund ID): <b className="font-mono">{createdRefund.id}</b> • Trạng thái: <b>{createdRefund.status || "PENDING"}</b>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
