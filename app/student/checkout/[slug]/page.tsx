"use client";

import { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, CreditCard, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import useSWR from "swr";
import type { CourseDetail } from "@/components/courses/CourseCheckoutCard";
import { useToast } from "@/components/ui/Toast";
import { API_BASE_URL } from "@/lib/apiConfig";
import { apiFetch } from "@/lib/apiFetch";
import { unwrapData, type ApiResponse } from "@/lib/apiResponses";
import type { CheckoutResponse } from "@/lib/endpointTypes";

const formatMoney = (value: number) => new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
}).format(value);

export default function StudentCheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const toast = useToast();
  const [couponCode, setCouponCode] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: course, error, isLoading, mutate } = useSWR<CourseDetail>(
    `${API_BASE_URL}/api/courses/p/${encodeURIComponent(slug)}`,
    async (url: string) => {
      const response = await fetch(url);
      const body = await response.json().catch(() => null) as ApiResponse<CourseDetail> | CourseDetail | null;
      if (!response.ok || !body) {
        throw new Error((body as ApiResponse<CourseDetail> | null)?.message ?? `HTTP ${response.status}`);
      }
      return unwrapData(body);
    },
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );

  const checkout = async () => {
    if (!course || !accepted || submitting) return;
    setSubmitting(true);
    try {
      const response = unwrapData<CheckoutResponse>(await apiFetch<ApiResponse<CheckoutResponse> | CheckoutResponse>(
        "/api/payment/orders/checkout",
        {
          method: "POST",
          body: JSON.stringify({
            courseId: course.id,
            couponCode: couponCode.trim() || undefined,
          }),
        },
      ));

      if (response.paymentUrl) {
        window.location.assign(response.paymentUrl);
        return;
      }
      if (response.status === "PAID") {
        window.location.assign(`/student/payments?payment=success&orderNumber=${encodeURIComponent(response.orderNumber)}`);
        return;
      }
      throw new Error("Cổng thanh toán chưa trả về đường dẫn hợp lệ.");
    } catch (cause) {
      toast.error("Không thể tạo đơn thanh toán", cause instanceof Error ? cause.message : "Vui lòng thử lại.");
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex min-h-[55vh] items-center justify-center"><Loader2 className="h-9 w-9 animate-spin text-primary" /></div>;
  }
  if (error || !course) {
    return <div className="mx-auto max-w-2xl rounded-2xl border border-red-100 bg-red-50 p-8 text-center"><h1 className="text-xl font-black text-red-700">Không tải được thông tin checkout</h1><p className="mt-2 text-sm text-red-600">{error instanceof Error ? error.message : "Không tìm thấy khóa học."}</p><button onClick={() => void mutate()} className="mt-4 rounded-xl bg-red-600 px-4 py-2 font-bold text-white">Thử lại</button></div>;
  }

  return <div className="mx-auto max-w-5xl space-y-6">
    <div><Link href={`/courses/${slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary"><ArrowLeft className="h-4 w-4" />Quay lại khóa học</Link><h1 className="mt-3 text-3xl font-black">Thanh toán khóa học</h1><p className="mt-1 text-sm text-gray-500">Kiểm tra đơn hàng trước khi chuyển sang cổng VNPay.</p></div>
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black">Thông tin đơn hàng</h2>
        <div className="flex gap-4 rounded-2xl bg-gray-50 p-4"><div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-xl bg-gray-200">{course.thumbnailUrl && <Image src={course.thumbnailUrl} alt={course.title} fill unoptimized className="object-cover" />}</div><div className="min-w-0"><h3 className="font-black text-gray-950">{course.title}</h3><p className="mt-1 text-sm text-gray-500">Giảng viên: {course.instructorName ?? "Đang cập nhật"}</p><p className="mt-3 font-black text-primary">{formatMoney(course.price)}</p></div></div>
        <div><label htmlFor="coupon" className="mb-2 block text-sm font-bold">Mã giảm giá</label><input id="coupon" value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} placeholder="Nhập mã nếu có" className="w-full rounded-xl border px-4 py-3 outline-none focus:border-primary" /><p className="mt-2 text-xs text-gray-500">Mã hợp lệ sẽ được áp dụng khi tạo đơn.</p></div>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 h-4 w-4 accent-pink-600" /><span>Tôi xác nhận thông tin đơn hàng và đồng ý với điều khoản thanh toán, chính sách hoàn tiền của St3pLearn.</span></label>
      </section>
      <aside className="h-fit space-y-5 rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-lg font-black">Tóm tắt thanh toán</h2><div className="space-y-3 text-sm"><div className="flex justify-between text-gray-500"><span>Học phí</span><span>{formatMoney(course.price)}</span></div><div className="flex justify-between border-t pt-4 text-lg font-black"><span>Tổng thanh toán</span><span className="text-primary">{formatMoney(course.price)}</span></div></div><button type="button" onClick={() => void checkout()} disabled={!accepted || submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 font-black text-white disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}{submitting ? "Đang tạo đơn..." : "Thanh toán qua VNPay"}</button><div className="space-y-2 border-t pt-4 text-xs text-gray-500"><p className="flex gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />Thông tin giao dịch được xác thực qua chữ ký VNPay.</p><p className="flex gap-2"><LockKeyhole className="h-4 w-4 shrink-0 text-emerald-600" />St3pLearn không lưu thông tin thẻ của bạn.</p><p className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />Khóa học được kích hoạt sau khi thanh toán thành công.</p></div></aside>
    </div>
  </div>;
}
