"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CreditCard, Loader2, ReceiptText, RefreshCw, RotateCcw, XCircle } from "lucide-react";
import useSWR from "swr";
import { apiFetch } from "@/lib/apiFetch";
import { unwrapData, unwrapPageContent, type ApiResponse, type PagePayload } from "@/lib/apiResponses";
import type { PaymentOrder, RefundRequest } from "@/lib/endpointTypes";
import { useToast } from "@/components/ui/Toast";

const formatMoney = (value: number, currency = "VND") => new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency,
}).format(value);

const formatDate = (value: string) => new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
}).format(new Date(value));

const STATUS_LABEL: Record<PaymentOrder["status"], string> = {
  CREATED: "Đã tạo",
  PENDING_PAYMENT: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thất bại",
  CANCELLED: "Đã hủy",
  REFUNDED: "Đã hoàn tiền",
};

const statusClass = (status: PaymentOrder["status"]) => {
  if (status === "PAID") return "bg-emerald-50 text-emerald-700";
  if (status === "PENDING_PAYMENT" || status === "CREATED") return "bg-amber-50 text-amber-700";
  if (status === "REFUNDED") return "bg-blue-50 text-blue-700";
  return "bg-red-50 text-red-700";
};

export default function StudentPaymentsPage() {
  const toast = useToast();
  const [result, setResult] = useState<{ type: "success" | "failed"; orderNumber?: string; message?: string } | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | null>(null);
  const [refundAmount, setRefundAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<RefundRequest | null>(null);

  const { data: orders = [], error, isLoading, mutate } = useSWR<PaymentOrder[]>(
    "/api/payment/orders?page=0&size=50&sort=createdAt,desc",
    async (path: string) => unwrapPageContent<PaymentOrder>(await apiFetch<ApiResponse<PagePayload<PaymentOrder> | PaymentOrder[]> | PagePayload<PaymentOrder> | PaymentOrder[]>(path)),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const payment = query.get("payment");
    if (payment === "success" || payment === "failed") {
      const timer = window.setTimeout(() => setResult({
        type: payment,
        orderNumber: query.get("orderNumber") ?? undefined,
        message: query.get("message") ?? undefined,
      }), 0);
      void mutate();
      return () => window.clearTimeout(timer);
    }
  }, [mutate]);

  const openRefund = (order: PaymentOrder) => {
    setSelectedOrder(order);
    setRefundAmount(order.finalAmount);
    setReason("");
    setCreated(null);
  };

  const submitRefund = async () => {
    if (!selectedOrder || refundAmount <= 0 || refundAmount > selectedOrder.finalAmount || !reason.trim()) return;
    if (!window.confirm("Gửi yêu cầu hoàn tiền cho đơn hàng này?")) return;
    setBusy(true);
    try {
      const body = await apiFetch<ApiResponse<RefundRequest> | RefundRequest>("/api/payment/refunds", {
        method: "POST",
        body: JSON.stringify({ paymentOrderId: selectedOrder.id, refundAmount, reason: reason.trim() }),
      });
      setCreated(unwrapData(body));
      toast.success("Đã gửi yêu cầu hoàn tiền");
      await mutate();
    } catch (cause) {
      toast.error("Không thể gửi yêu cầu", cause instanceof Error ? cause.message : "Request failed");
    } finally {
      setBusy(false);
    }
  };

  return <div className="mx-auto max-w-6xl space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="flex items-center gap-2 text-2xl font-black"><CreditCard className="text-primary" />Lịch sử thanh toán</h1><p className="mt-1 text-sm text-gray-500">Theo dõi đơn hàng, trạng thái VNPay và gửi yêu cầu hoàn tiền.</p></div><button onClick={() => void mutate()} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-bold"><RefreshCw className="h-4 w-4" />Làm mới</button></div>

    {result && <div className={`flex items-start gap-3 rounded-2xl border p-4 ${result.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>{result.type === "success" ? <CheckCircle2 className="h-6 w-6 shrink-0" /> : <XCircle className="h-6 w-6 shrink-0" />}<div><p className="font-black">{result.type === "success" ? "Thanh toán thành công" : "Thanh toán chưa thành công"}</p><p className="text-sm">{result.message ?? (result.orderNumber ? `Mã đơn: ${result.orderNumber}` : "Kiểm tra trạng thái đơn hàng bên dưới.")}</p></div></div>}

    {isLoading && <div className="flex justify-center rounded-2xl border bg-white py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
    {!isLoading && error && <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center"><p className="font-black text-red-700">Không tải được lịch sử thanh toán</p><p className="mt-1 text-sm text-red-600">{error instanceof Error ? error.message : "Payment Service không phản hồi."}</p><button onClick={() => void mutate()} className="mt-4 rounded-xl bg-red-600 px-4 py-2 font-bold text-white">Thử lại</button></div>}
    {!isLoading && !error && orders.length === 0 && <div className="rounded-2xl border border-dashed bg-white p-12 text-center"><ReceiptText className="mx-auto h-10 w-10 text-gray-300" /><h2 className="mt-3 font-black">Chưa có giao dịch</h2><p className="mt-1 text-sm text-gray-500">Các đơn thanh toán khóa học sẽ xuất hiện tại đây.</p></div>}
    {!isLoading && !error && orders.length > 0 && <div className="overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-4">Đơn hàng</th><th className="px-5 py-4">Khóa học</th><th className="px-5 py-4">Số tiền</th><th className="px-5 py-4">Cổng</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4 text-right">Thao tác</th></tr></thead><tbody className="divide-y">{orders.map((order) => <tr key={order.id} className="align-top"><td className="px-5 py-4"><p className="font-black">{order.orderNumber}</p><p className="mt-1 text-xs text-gray-500">{formatDate(order.createdAt)}</p></td><td className="px-5 py-4"><span className="font-mono text-xs text-gray-600">{order.courseId}</span></td><td className="px-5 py-4"><p className="font-black">{formatMoney(order.finalAmount, order.currency)}</p>{order.discountAmount > 0 && <p className="mt-1 text-xs text-emerald-600">Giảm {formatMoney(order.discountAmount, order.currency)}</p>}</td><td className="px-5 py-4">{order.gateway ?? (order.finalAmount === 0 ? "Miễn phí" : "—")}</td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${statusClass(order.status)}`}>{STATUS_LABEL[order.status]}</span></td><td className="px-5 py-4 text-right">{order.status === "PAID" && <button onClick={() => openRefund(order)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-bold text-gray-700 hover:border-primary hover:text-primary"><RotateCcw className="h-3.5 w-3.5" />Yêu cầu hoàn tiền</button>}</td></tr>)}</tbody></table></div></div>}

    {selectedOrder && <section className="rounded-2xl border bg-white p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 text-lg font-black"><RotateCcw className="h-5 w-5 text-primary" />Yêu cầu hoàn tiền</h2><p className="mt-1 text-sm text-gray-500">Đơn {selectedOrder.orderNumber} · Tối đa {formatMoney(selectedOrder.finalAmount, selectedOrder.currency)}</p></div><button onClick={() => setSelectedOrder(null)} className="text-sm font-bold text-gray-500">Đóng</button></div><div className="mt-4 grid gap-4 md:grid-cols-2"><div><label htmlFor="refund-amount" className="mb-2 block text-sm font-bold">Số tiền hoàn</label><input id="refund-amount" type="number" min="1" max={selectedOrder.finalAmount} value={refundAmount} onChange={(event) => setRefundAmount(Number(event.target.value))} className="w-full rounded-xl border p-3" /></div><div><label htmlFor="refund-reason" className="mb-2 block text-sm font-bold">Lý do</label><textarea id="refund-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Mô tả lý do cần hoàn tiền" className="min-h-24 w-full rounded-xl border p-3" /></div></div>{refundAmount > selectedOrder.finalAmount && <p className="mt-2 text-sm font-bold text-red-600">Số tiền hoàn không được vượt quá số tiền đã thanh toán.</p>}<button disabled={busy || refundAmount <= 0 || refundAmount > selectedOrder.finalAmount || !reason.trim()} onClick={() => void submitRefund()} className="mt-4 rounded-xl bg-primary px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gửi yêu cầu"}</button>{created && <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Đã tạo yêu cầu <b>{created.id}</b> · {created.status}</div>}</section>}
  </div>;
}
