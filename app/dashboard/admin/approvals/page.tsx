"use client";

import Link from "next/link";
import useSWR from "swr";
import { ArrowLeft, ArrowRight, ClipboardCheck, Loader2 } from "lucide-react";
import { RoleGuard } from "@/components/guards/RoleGuard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { API_BASE_URL } from "@/lib/apiConfig";
import { buildAuthHeaders } from "@/lib/authHeaders";
import { unwrapPageContent, type ApiResponse, type PagePayload } from "@/lib/apiResponses";
import { useAuth } from "@/context/AuthContext";

interface ApprovalSummary {
  approvalRequestId: string;
  courseId: string;
  courseTitle: string;
  instructorId: string;
  status: string;
  submittedAt: string;
}

async function fetchPendingApprovals([url, token]: readonly [string, string]): Promise<ApprovalSummary[]> {
  const res = await fetch(url, { headers: buildAuthHeaders(token, "ADMIN") });
  if (!res.ok) throw new Error("Không tải được hàng đợi duyệt");
  const body = await res.json() as ApiResponse<PagePayload<ApprovalSummary> | ApprovalSummary[]> | PagePayload<ApprovalSummary> | ApprovalSummary[];
  return unwrapPageContent<ApprovalSummary>(body);
}

export default function AdminApprovalsPage() {
  const { token } = useAuth();
  const key = token ? [`${API_BASE_URL}/api/courses/approvals/pending?page=0&size=20`, token] as const : null;
  const { data: approvals = [], error, isLoading, mutate } = useSWR<ApprovalSummary[]>(
    key,
    fetchPendingApprovals,
    { revalidateOnFocus: false }
  );

  return (
    <RoleGuard allow={["ADMIN"]}>
      <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
        <main className="mx-auto flex w-full max-w-6xl flex-grow flex-col gap-8 px-4 py-8">
          <div className="flex flex-col gap-5 rounded-3xl border border-gray-100 bg-white p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-xs font-extrabold text-gray-400 hover:text-primary">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
              <div className="space-y-1">
                <h1 className="text-2xl font-black text-gray-900">Duyệt khóa học</h1>
                <p className="text-sm text-gray-500">Xem các giáo trình đang chờ kiểm duyệt và mở trang xử lý chi tiết.</p>
              </div>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-600">
              <ClipboardCheck className="h-7 w-7" />
            </div>
          </div>

          <section className="rounded-3xl border border-gray-100 bg-white shadow-soft overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-50 p-6">
              <div>
                <h2 className="text-base font-black text-gray-900">Hàng đợi kiểm duyệt</h2>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{approvals.length} yêu cầu đang chờ</p>
              </div>
              <button
                onClick={() => mutate()}
                className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-2 text-xs font-extrabold text-gray-500 hover:bg-gray-100"
              >
                Tải lại
              </button>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center gap-2 py-16 text-sm font-bold text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Đang tải hàng đợi...
              </div>
            )}

            {!isLoading && error && (
              <EmptyState title="Không tải được hàng đợi" description={error instanceof Error ? error.message : "Vui lòng thử lại."} />
            )}

            {!isLoading && !error && approvals.length === 0 && (
              <EmptyState title="Không có yêu cầu chờ duyệt" description="Khi giáo viên gửi khóa học, yêu cầu sẽ xuất hiện tại đây." />
            )}

            {!isLoading && !error && approvals.length > 0 && (
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
                            href={`/dashboard/admin/approvals/${approval.approvalRequestId}`}
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
        </main>
      </div>
    </RoleGuard>
  );
}
