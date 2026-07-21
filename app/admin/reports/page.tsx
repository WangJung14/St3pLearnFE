"use client";

import { useState } from "react";
import useSWR from "swr";
import { Download, Loader2, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import { unwrapData, type ApiResponse, type PagePayload } from "@/lib/apiResponses";
import type { ReportStatus, ReportTicket } from "@/lib/endpointTypes";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

const statuses: Array<ReportStatus | "ALL"> = ["ALL", "PENDING", "RESOLVED", "DISMISSED"];

export default function AdminReportsPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState<ReportStatus | "ALL">("ALL");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const query = new URLSearchParams({ page: "0", size: "50" });
  if (status !== "ALL") query.set("status", status);
  const path = `/api/admin/reports?${query}`;

  const { data, error, isLoading, mutate } = useSWR<PagePayload<ReportTicket>>(
    token ? [path, token] : null,
    async ([url]: readonly [string, string]) => unwrapData<PagePayload<ReportTicket>>(await apiFetch<ApiResponse<PagePayload<ReportTicket>> | PagePayload<ReportTicket>>(url)),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  const reports = data?.content ?? [];

  const processReport = async (report: ReportTicket, nextStatus: ReportStatus) => {
    if (!confirm(`${nextStatus === "RESOLVED" ? "Xử lý" : "Bỏ qua"} báo cáo này?`)) return;
    setProcessing(report.id);
    try {
      await apiFetch(`/api/admin/reports/${report.id}/process`, { method: "POST", body: JSON.stringify({ status: nextStatus, adminNotes: notes[report.id]?.trim() || undefined }) });
      await mutate(); toast.success("Đã cập nhật báo cáo");
    } catch (cause) { toast.error("Không thể xử lý báo cáo", cause instanceof Error ? cause.message : undefined); }
    finally { setProcessing(null); }
  };

  const download = async (kind: "revenue" | "course") => {
    try {
      const blob = await apiFetch<Blob>(`/api/admin/reports/${kind}/export`, {}, { responseType: "blob" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${kind}_report.xlsx`; anchor.click(); URL.revokeObjectURL(url);
    } catch (cause) { toast.error("Không thể tải báo cáo", cause instanceof Error ? cause.message : undefined); }
  };

  return <div className="space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-black">Báo cáo & xuất dữ liệu</h1><p className="text-sm text-gray-500">Kiểm duyệt report từ Catalog Service và xuất dữ liệu từ Admin Service.</p></div><div className="flex gap-2"><button onClick={() => download("revenue")} className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-bold"><Download className="h-4 w-4" />Doanh thu</button><button onClick={() => download("course")} className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-bold"><Download className="h-4 w-4" />Khóa học</button></div></header>
    <div className="flex flex-wrap gap-2">{statuses.map((value) => <button key={value} onClick={() => setStatus(value)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${status === value ? "bg-secondary text-white" : "border bg-white"}`}>{value}</button>)}</div>
    {isLoading && <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-5 w-5 animate-spin" />Đang tải báo cáo...</div>}
    {error && <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">Không tải được báo cáo: {error instanceof Error ? error.message : "Request failed"}</div>}
    {!isLoading && !error && reports.length === 0 && <div className="rounded-2xl border border-dashed p-10 text-center text-gray-500">Không có báo cáo trong trạng thái này.</div>}
    <div className="space-y-3">{reports.map((report) => <article key={report.id} className="rounded-2xl border bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><div><span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-bold">{report.targetType}</span><h2 className="mt-2 font-black">{report.reason}</h2><p className="text-xs text-gray-500">Target: {report.targetId} · Reporter: {report.reporterId}</p></div><span className="flex items-center gap-1 text-xs font-black text-secondary"><ShieldCheck className="h-4 w-4" />{report.status}</span></div>{report.description && <p className="mt-3 text-sm text-gray-600">{report.description}</p>}{report.status === "PENDING" && <div className="mt-4 flex flex-col gap-2 sm:flex-row"><input value={notes[report.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [report.id]: event.target.value }))} placeholder="Ghi chú quản trị" className="flex-1 rounded-xl border p-2 text-sm" /><button disabled={processing === report.id} onClick={() => processReport(report, "RESOLVED")} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Xử lý</button><button disabled={processing === report.id} onClick={() => processReport(report, "DISMISSED")} className="rounded-xl bg-gray-700 px-3 py-2 text-xs font-bold text-white">Bỏ qua</button></div>}</article>)}</div>
  </div>;
}
