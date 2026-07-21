"use client";

import { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { FileWarning, Download, Loader2, CheckCircle2, XCircle, ArrowRight, Flag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import { unwrapData, type ApiResponse, type PagePayload } from "@/lib/apiResponses";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

interface ReportTicket {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  description: string;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminReportsPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<"" | "PENDING" | "RESOLVED" | "DISMISSED">("");
  
  // Modal state
  const [processingReport, setProcessingReport] = useState<ReportTicket | null>(null);
  const [newStatus, setNewStatus] = useState<"PENDING" | "RESOLVED" | "DISMISSED">("RESOLVED");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const query = new URLSearchParams({ page: "0", size: "100" });
  if (statusFilter) query.set("status", statusFilter);
  const path = `/api/admin/reports?${query}`;

  const { data: reportsData, error, isLoading, mutate } = useSWR<PagePayload<ReportTicket>>(
    token ? [path, token] : null,
    async ([url]: readonly [string, string]) => unwrapData<PagePayload<ReportTicket>>(await apiFetch<ApiResponse<PagePayload<ReportTicket>> | PagePayload<ReportTicket>>(url)),
    { revalidateOnFocus: false }
  );

  const reports = reportsData?.content ?? [];

  const processReport = async () => {
    if (!processingReport) return;
    setSaving(true);
    try {
      await apiFetch(`/api/admin/reports/${processingReport.id}/process`, {
        method: "POST",
        body: JSON.stringify({ status: newStatus, adminNotes }),
      });
      toast.success("Đã xử lý báo cáo");
      setProcessingReport(null);
      setAdminNotes("");
      mutate();
    } catch (e) {
      toast.error("Không thể xử lý", e instanceof Error ? e.message : "Đã có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  const download = async (kind: "revenue" | "course") => {
    try {
      const blob = await apiFetch<Blob>(`/api/admin/reports/${kind}/export`, {}, { responseType: "blob" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${kind}_report.xlsx`; anchor.click(); URL.revokeObjectURL(url);
    } catch (cause) { toast.error("Không thể tải báo cáo", cause instanceof Error ? cause.message : undefined); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800"><Flag className="h-3 w-3" /> Đang chờ</span>;
      case "RESOLVED": return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800"><CheckCircle2 className="h-3 w-3" /> Đã xử lý</span>;
      case "DISMISSED": return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-800"><XCircle className="h-3 w-3" /> Bỏ qua</span>;
      default: return <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-gray-900">
            <FileWarning className="h-6 w-6 text-primary" /> Báo cáo & xuất dữ liệu
          </h1>
          <p className="mt-1 text-sm text-gray-500">Xem xét báo cáo vi phạm và tải thống kê dữ liệu.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => download("revenue")} className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-bold shadow-sm hover:bg-gray-50">
            <Download className="h-4 w-4" /> Doanh thu
          </button>
          <button onClick={() => download("course")} className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-bold shadow-sm hover:bg-gray-50">
            <Download className="h-4 w-4" /> Khóa học
          </button>
        </div>
      </header>

      <section className="rounded-3xl border bg-white shadow-soft overflow-hidden">
        <div className="border-b p-4 flex gap-4">
          <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
            {[
              { value: "", label: "Tất cả" },
              { value: "PENDING", label: "Đang chờ" },
              { value: "RESOLVED", label: "Đã xử lý" },
              { value: "DISMISSED", label: "Bỏ qua" },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value as any)}
                className={`flex-1 sm:flex-none px-4 py-2 text-sm font-bold rounded-lg transition-all ${statusFilter === tab.value ? "bg-white text-primary shadow" : "text-gray-500 hover:text-gray-900"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex h-64 flex-col items-center justify-center text-red-500">
            <p>Không thể tải danh sách báo cáo</p>
            <button onClick={() => mutate()} className="mt-4 text-sm font-bold text-primary underline">Thử lại</button>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-gray-400">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mb-4 opacity-50" />
            <p className="font-bold">Không có báo cáo nào</p>
            <p className="text-sm">Mọi thứ đều ổn định.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b">
                <tr>
                  <th className="px-6 py-4 font-bold">Ngày gửi</th>
                  <th className="px-6 py-4 font-bold">Lý do báo cáo</th>
                  <th className="px-6 py-4 font-bold">Đối tượng</th>
                  <th className="px-6 py-4 font-bold">Trạng thái</th>
                  <th className="px-6 py-4 font-bold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {format(new Date(report.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="font-bold text-gray-900 truncate">{report.reason}</p>
                      <p className="text-xs text-gray-500 truncate" title={report.description}>{report.description || "Không có mô tả chi tiết"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {report.targetType}
                      </span>
                      <div className="text-xs text-gray-400 mt-1 truncate max-w-[150px]" title={report.targetId}>{report.targetId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setProcessingReport(report);
                          setNewStatus(report.status === "PENDING" ? "RESOLVED" : report.status);
                          setAdminNotes(report.adminNotes || "");
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        {report.status === "PENDING" ? "Xử lý" : "Cập nhật"} <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {processingReport && (
        <Modal
          isOpen={true}
          onClose={() => !saving && setProcessingReport(null)}
          title="Xử lý báo cáo"
          className="w-full max-w-[512px]"
          footer={
            <button disabled={saving} onClick={processReport} className="rounded-xl bg-primary px-5 py-2 font-bold text-white flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Lưu thay đổi
            </button>
          }
        >
          <div className="space-y-6">
            <div className="rounded-xl bg-gray-50 p-4 border text-sm">
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="text-gray-500 font-bold">Đối tượng:</span>
                <span className="font-mono text-xs">{processingReport.targetType} - {processingReport.targetId}</span>
                <span className="text-gray-500 font-bold">Lý do:</span>
                <span className="font-bold text-gray-900">{processingReport.reason}</span>
                <span className="text-gray-500 font-bold">Mô tả:</span>
                <span className="text-gray-600">{processingReport.description || "Không có"}</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block font-bold text-gray-700">Trạng thái xử lý</label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer bg-white border p-3 rounded-xl flex-1 hover:border-amber-400 transition-colors">
                  <input type="radio" name="status" checked={newStatus === "PENDING"} onChange={() => setNewStatus("PENDING")} className="text-amber-500 focus:ring-amber-500" />
                  <span className="text-sm font-bold text-amber-700">Đang chờ</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-white border p-3 rounded-xl flex-1 hover:border-emerald-400 transition-colors">
                  <input type="radio" name="status" checked={newStatus === "RESOLVED"} onChange={() => setNewStatus("RESOLVED")} className="text-emerald-600 focus:ring-emerald-600" />
                  <span className="text-sm font-bold text-emerald-700">Đã giải quyết</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-white border p-3 rounded-xl flex-1 hover:border-gray-400 transition-colors">
                  <input type="radio" name="status" checked={newStatus === "DISMISSED"} onChange={() => setNewStatus("DISMISSED")} className="text-gray-600 focus:ring-gray-600" />
                  <span className="text-sm font-bold text-gray-700">Bỏ qua</span>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block font-bold text-gray-700">Ghi chú của Admin (Tùy chọn)</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all"
                placeholder="Ghi chú về quyết định xử lý..."
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
