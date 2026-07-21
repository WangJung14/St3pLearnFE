"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { ArrowLeft, ArrowRight, ClipboardCheck, Loader2, FileText, CheckCircle2, XCircle, Brain, Eye } from "lucide-react";
import { RoleGuard } from "@/components/guards/RoleGuard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { API_BASE_URL } from "@/lib/apiConfig";
import { buildAuthHeaders } from "@/lib/authHeaders";
import { unwrapPageContent, unwrapData, type ApiResponse, type PagePayload } from "@/lib/apiResponses";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

interface ApprovalSummary {
  approvalRequestId: string;
  courseId: string;
  courseTitle: string;
  instructorId: string;
  status: string;
  submittedAt: string;
}

interface PendingDocument {
  id: string;
  courseId: string;
  title: string;
  fileUrl?: string;
  fileType?: string;
  textContent?: string;
  status: string;
  uploadedBy: string;
  createdAt: string;
}

async function fetchPendingApprovals([url, token]: readonly [string, string]): Promise<ApprovalSummary[]> {
  const res = await fetch(url, { headers: buildAuthHeaders(token, "ADMIN") });
  if (!res.ok) throw new Error("Không tải được hàng đợi duyệt");
  const body = await res.json() as ApiResponse<PagePayload<ApprovalSummary> | ApprovalSummary[]> | PagePayload<ApprovalSummary> | ApprovalSummary[];
  return unwrapPageContent<ApprovalSummary>(body);
}

async function fetchPendingDocuments([url, token]: readonly [string, string]): Promise<PendingDocument[]> {
  const res = await fetch(url, { headers: buildAuthHeaders(token, "ADMIN") });
  if (!res.ok) return [];
  const body = await res.json();
  const data = unwrapData<PendingDocument[]>(body);
  return Array.isArray(data) ? data : [];
}

export default function AdminApprovalsPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"courses" | "ai_documents">("courses");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<PendingDocument | null>(null);

  // 1. Quản lý hàng đợi duyệt khóa học
  const keyCourses = token ? [`${API_BASE_URL}/api/courses/approvals/pending?page=0&size=20`, token] as const : null;
  const { data: approvals = [], error: errCourses, isLoading: loadingCourses, mutate: mutateCourses } = useSWR<ApprovalSummary[]>(
    keyCourses,
    fetchPendingApprovals,
    { revalidateOnFocus: false }
  );

  // 2. Quản lý hàng đợi duyệt tài liệu AI
  const keyDocs = token ? [`${API_BASE_URL}/api/courses/documents/pending`, token] as const : null;
  const { data: pendingDocs = [], error: errDocs, isLoading: loadingDocs, mutate: mutateDocs } = useSWR<PendingDocument[]>(
    keyDocs,
    fetchPendingDocuments,
    { revalidateOnFocus: false }
  );

  const handleReviewDocument = async (docId: string, approved: boolean) => {
    if (!token) return;
    let rejectReason = "";
    if (!approved) {
      const reason = prompt("Nhập lý do từ chối tài liệu này:");
      if (!reason || !reason.trim()) return;
      rejectReason = reason.trim();
    }

    setReviewingId(docId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/courses/documents/${docId}/review`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(token, "ADMIN"),
        },
        body: JSON.stringify({ approved, rejectReason }),
      });

      if (!res.ok) throw new Error("Thao tác duyệt thất bại");

      toast.success(approved ? "Đã duyệt tài liệu và gửi sang AI nạp ngầm thành công!" : "Đã từ chối tài liệu");
      await mutateDocs();
    } catch (e: unknown) {
      toast.error("Lỗi khi xử lý tài liệu", e instanceof Error ? e.message : "Request failed");
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <RoleGuard allow={["ADMIN"]}>
      <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
        <main className="mx-auto flex w-full max-w-6xl flex-grow flex-col gap-8 px-4 py-8">
          <div className="flex flex-col gap-5 rounded-3xl border border-gray-100 bg-white p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-extrabold text-gray-400 hover:text-primary">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
              <div className="space-y-1">
                <h1 className="text-2xl font-black text-gray-900">Trung tâm Kiểm duyệt</h1>
                <p className="text-sm text-gray-500">Xem xét và phê duyệt giáo trình khóa học và tri thức nạp cho Trợ lý AI.</p>
              </div>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-600">
              <ClipboardCheck className="h-7 w-7" />
            </div>
          </div>

          {/* TAB SELECTION */}
          <div className="flex border-b border-gray-200 gap-2 pb-2">
            <button
              onClick={() => setActiveTab("courses")}
              className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "courses" ? "bg-primary text-white shadow-md shadow-pink-100" : "bg-white text-gray-500 hover:bg-gray-100 border"
              }`}
            >
              <ClipboardCheck className="w-4 h-4" /> Duyệt Khóa học ({approvals.length})
            </button>

            <button
              onClick={() => setActiveTab("ai_documents")}
              className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "ai_documents" ? "bg-primary text-white shadow-md shadow-pink-100" : "bg-white text-gray-500 hover:bg-gray-100 border"
              }`}
            >
              <Brain className="w-4 h-4" /> Tài liệu AI chờ duyệt ({pendingDocs.length})
            </button>
          </div>

          {/* TAB 1: DUYỆT KHÓA HỌC */}
          {activeTab === "courses" && (
            <section className="rounded-3xl border border-gray-100 bg-white shadow-soft overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between border-b border-gray-50 p-6">
                <div>
                  <h2 className="text-base font-black text-gray-900">Hàng đợi kiểm duyệt khóa học</h2>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{approvals.length} yêu cầu đang chờ</p>
                </div>
                <button
                  onClick={() => mutateCourses()}
                  className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-2 text-xs font-extrabold text-gray-500 hover:bg-gray-100"
                >
                  Tải lại
                </button>
              </div>

              {loadingCourses && (
                <div className="flex items-center justify-center gap-2 py-16 text-sm font-bold text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  Đang tải hàng đợi...
                </div>
              )}

              {!loadingCourses && errCourses && (
                <EmptyState title="Không tải được hàng đợi" description={errCourses instanceof Error ? errCourses.message : "Vui lòng thử lại."} />
              )}

              {!loadingCourses && !errCourses && approvals.length === 0 && (
                <EmptyState title="Không có yêu cầu chờ duyệt" description="Khi giáo viên gửi khóa học, yêu cầu sẽ xuất hiện tại đây." />
              )}

              {!loadingCourses && !errCourses && approvals.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Khóa học</TableHead>
                      <TableHead>Giảng viên</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Gửi lúc</TableHead>
                      <TableHead className="text-right">Chi tiết</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvals.map((approval) => (
                      <TableRow key={approval.approvalRequestId}>
                        <TableCell className="font-extrabold text-gray-900">{approval.courseTitle}</TableCell>
                        <TableCell className="text-gray-500">{approval.instructorId.slice(0, 8)}</TableCell>
                        <TableCell>
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-4xs font-black uppercase text-amber-600">
                            {approval.status}
                          </span>
                        </TableCell>
                        <TableCell>{approval.submittedAt ? new Date(approval.submittedAt).toLocaleString("vi-VN") : "-"}</TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <Link
                              href={`/admin/approvals/${approval.approvalRequestId}`}
                              className="inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-pink-100 hover:opacity-95"
                            >
                              Mở
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </section>
          )}

          {/* TAB 2: DUYỆT TÀI LIỆU AI */}
          {activeTab === "ai_documents" && (
            <section className="rounded-3xl border border-gray-100 bg-white shadow-soft overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between border-b border-gray-50 p-6">
                <div>
                  <h2 className="text-base font-black text-gray-900">Danh sách Tài liệu nạp tri thức cho AI</h2>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{pendingDocs.length} tài liệu chờ thẩm định</p>
                </div>
                <button
                  onClick={() => mutateDocs()}
                  className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-2 text-xs font-extrabold text-gray-500 hover:bg-gray-100"
                >
                  Tải lại
                </button>
              </div>

              {loadingDocs && (
                <div className="flex items-center justify-center gap-2 py-16 text-sm font-bold text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  Đang tải danh sách tài liệu...
                </div>
              )}

              {!loadingDocs && errDocs && (
                <EmptyState title="Không tải được tài liệu AI" description="Vui lòng thử lại sau." />
              )}

              {!loadingDocs && !errDocs && pendingDocs.length === 0 && (
                <EmptyState title="Không có tài liệu nào chờ duyệt" description="Tất cả tài liệu giảng viên tải lên đã được thẩm định." />
              )}

              {!loadingDocs && !errDocs && pendingDocs.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên Tài liệu / Chủ đề</TableHead>
                      <TableHead>Định dạng</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày gửi</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingDocs.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-extrabold text-gray-900">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary shrink-0" />
                            <span className="line-clamp-1">{doc.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-3xs font-black uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">
                            {doc.fileType || "doc"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-4xs font-black uppercase text-amber-600">
                            {doc.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {doc.createdAt ? new Date(doc.createdAt).toLocaleString("vi-VN") : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setPreviewDoc(doc)}
                              className="inline-flex items-center gap-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1.5 text-xs font-extrabold hover:bg-purple-100 cursor-pointer"
                              title="Xem nội dung chi tiết"
                            >
                              <Eye className="w-3.5 h-3.5" /> Xem chi tiết
                            </button>
                            <button
                              disabled={reviewingId === doc.id}
                              onClick={() => handleReviewDocument(doc.id, true)}
                              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-extrabold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                            >
                              {reviewingId === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              Duyệt & Nạp AI
                            </button>
                            <button
                              disabled={reviewingId === doc.id}
                              onClick={() => handleReviewDocument(doc.id, false)}
                              className="inline-flex items-center gap-1 rounded-xl bg-red-50 text-red-600 border border-red-100 px-3 py-1.5 text-xs font-extrabold hover:bg-red-100 disabled:opacity-50 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Từ chối
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </section>
          )}
        </main>

        {/* MODAL XEM CHI TIẾT TÀI LIỆU */}
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-2xl bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-purple-50/50">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <div>
                    <h3 className="text-base font-black text-gray-950 line-clamp-1">{previewDoc.title}</h3>
                    <p className="text-3xs font-extrabold text-purple-700 uppercase tracking-wider">
                      Định dạng: {previewDoc.fileType || "doc"} • Trạng thái: {previewDoc.status}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="text-gray-400 hover:text-gray-700 font-extrabold text-sm border border-gray-200 bg-white hover:bg-gray-50 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-4 text-xs font-bold text-gray-600 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div>
                    <span className="text-3xs text-gray-400 block uppercase font-extrabold">Mã khóa học</span>
                    <span className="text-gray-900 break-all">{previewDoc.courseId}</span>
                  </div>
                  <div>
                    <span className="text-3xs text-gray-400 block uppercase font-extrabold">Ngày gửi yêu cầu</span>
                    <span className="text-gray-900">{new Date(previewDoc.createdAt).toLocaleString("vi-VN")}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-extrabold text-gray-900 block">Nội dung chi tiết:</span>
                  {previewDoc.textContent ? (
                    <div className="bg-gray-950 text-gray-100 p-5 rounded-2xl font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-[350px] overflow-y-auto border border-gray-800">
                      {previewDoc.textContent}
                    </div>
                  ) : (
                    <div className="space-y-3 bg-purple-50/50 p-5 rounded-2xl border border-purple-100/50">
                      <p className="text-xs text-purple-950 font-bold leading-relaxed">
                        Đây là tệp tin được tải lên từ máy tính của Giáo viên. Nội dung tệp tin đã được lưu trữ cục bộ tại server:
                      </p>
                      <code className="block bg-white border border-purple-200 p-3 rounded-xl font-mono text-3xs text-purple-800 break-all">
                        {previewDoc.fileUrl}
                      </code>
                      <p className="text-3xs text-purple-700 font-bold">
                        * AI sẽ tự động giải nén và trích xuất nội dung văn bản trực tiếp từ tệp tin này khi tài liệu được phê duyệt.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-gray-50 flex justify-end gap-2 bg-gray-50/50">
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-extrabold text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  disabled={reviewingId === previewDoc.id}
                  onClick={async () => {
                    const docId = previewDoc.id;
                    setPreviewDoc(null);
                    await handleReviewDocument(docId, true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-100 cursor-pointer"
                >
                  Duyệt & Nạp vào AI
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
