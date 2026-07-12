"use client";

import Link from "next/link";
import useSWR from "swr";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  FolderTree,
  Hash,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/apiConfig";
import { buildAuthHeaders } from "@/lib/authHeaders";
import { unwrapData, unwrapPageContent, type ApiResponse, type PagePayload } from "@/lib/apiResponses";

interface ApprovalSummary {
  approvalRequestId: string;
  courseId: string;
  courseTitle: string;
  instructorId: string;
  status: string;
  submittedAt: string;
}

interface Course {
  id: string;
  title: string;
  status: string;
}

interface Category {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

async function fetchAdminPage<T>([url, token]: readonly [string, string]): Promise<T[]> {
  const res = await fetch(url, { headers: buildAuthHeaders(token, "ADMIN") });
  if (!res.ok) throw new Error("Fetch admin data failed");
  const body = await res.json() as ApiResponse<PagePayload<T> | T[]> | PagePayload<T> | T[];
  return unwrapPageContent<T>(body);
}

async function fetchPublicList<T>(url: string): Promise<T[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Fetch public data failed");
  const body = await res.json() as ApiResponse<T[]> | T[];
  return unwrapData<T[]>(body);
}

export default function AdminDashboard() {
  const { token } = useAuth();

  const { data: pendingApprovals = [], isLoading: pendingLoading } = useSWR<ApprovalSummary[]>(
    token ? [`${API_BASE_URL}/api/courses/approvals/pending?page=0&size=5`, token] as const : null,
    fetchAdminPage,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const { data: courses = [], isLoading: coursesLoading } = useSWR<Course[]>(
    token ? [`${API_BASE_URL}/api/courses?page=0&size=50`, token] as const : null,
    fetchAdminPage,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const { data: categories = [] } = useSWR<Category[]>(
    `${API_BASE_URL}/api/categories`,
    fetchPublicList,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const { data: tags = [] } = useSWR<Tag[]>(
    `${API_BASE_URL}/api/tags`,
    fetchPublicList,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const publishedCourses = courses.filter((course) => course.status === "PUBLISHED").length;
  const draftCourses = courses.filter((course) => course.status === "DRAFT").length;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-amber-50 p-4 text-amber-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-2xl font-black text-gray-900">
                {pendingLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : pendingApprovals.length}
              </span>
              <span className="text-2xs font-extrabold uppercase tracking-wider text-gray-400">Chờ duyệt</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-blue-50 p-4 text-secondary">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-2xl font-black text-gray-900">
                {coursesLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : courses.length}
              </span>
              <span className="text-2xs font-extrabold uppercase tracking-wider text-gray-400">Tổng khóa học</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-pink-50 p-4 text-primary">
              <FolderTree className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-2xl font-black text-gray-900">{categories.length}</span>
              <span className="text-2xs font-extrabold uppercase tracking-wider text-gray-400">Danh mục</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-purple-50 p-4 text-purple-500">
              <Hash className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-2xl font-black text-gray-900">{tags.length}</span>
              <span className="text-2xs font-extrabold uppercase tracking-wider text-gray-400">Tag</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-3xl border border-gray-100 bg-white shadow-soft lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-50 p-6">
            <div>
              <h2 className="text-base font-black text-gray-900">Hàng đợi duyệt khóa học</h2>
              <p className="text-2xs font-semibold uppercase tracking-wider text-gray-400">
                Các giáo trình teacher đã gửi admin kiểm duyệt
              </p>
            </div>
            <Link
              href="/admin/approvals"
              className="inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-pink-100 hover:opacity-95"
            >
              Xem tất cả
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="divide-y divide-gray-50">
            {pendingApprovals.length === 0 ? (
              <div className="p-10 text-center">
                <ClipboardCheck className="mx-auto h-10 w-10 text-gray-200" />
                <p className="mt-3 text-sm font-bold text-gray-400">Không có yêu cầu chờ duyệt.</p>
              </div>
            ) : (
              pendingApprovals.map((approval) => (
                <div key={approval.approvalRequestId} className="flex flex-wrap items-center justify-between gap-4 p-6 hover:bg-gray-50/40">
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-gray-900">{approval.courseTitle}</h3>
                    <p className="text-xs text-gray-400">
                      Giảng viên {approval.instructorId.slice(0, 8)} • {approval.submittedAt ? new Date(approval.submittedAt).toLocaleString("vi-VN") : "-"}
                    </p>
                  </div>
                  <Link
                    href={`/admin/approvals/${approval.approvalRequestId}`}
                    className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-2 text-xs font-extrabold text-gray-600 hover:text-primary"
                  >
                    Xử lý
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-soft">
            <h2 className="text-base font-black text-gray-900">Quản trị taxonomy</h2>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">Quản lý danh mục và tag để giáo viên phân loại khóa học.</p>
            <div className="mt-5 grid grid-cols-1 gap-3">
              <Link href="/admin/categories" className="flex items-center justify-between rounded-2xl bg-pink-50 px-4 py-3 text-xs font-extrabold text-primary hover:bg-pink-100">
                Danh mục
                <FolderTree className="h-4 w-4" />
              </Link>
              <Link href="/admin/tags" className="flex items-center justify-between rounded-2xl bg-blue-50 px-4 py-3 text-xs font-extrabold text-secondary hover:bg-blue-100">
                Tag
                <Hash className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-soft">
            <h2 className="text-base font-black text-gray-900">Tổng quan khóa học</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-emerald-50 p-4 text-center">
                <span className="block text-xl font-black text-emerald-700">{publishedCourses}</span>
                <span className="text-4xs font-black uppercase text-emerald-600">Published</span>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4 text-center">
                <span className="block text-xl font-black text-gray-700">{draftCourses}</span>
                <span className="text-4xs font-black uppercase text-gray-500">Draft</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
