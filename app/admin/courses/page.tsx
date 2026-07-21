"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { BookOpen, Search, Filter, Loader2, Eye, Trash2, CheckCircle, Clock, XCircle, FileText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/apiConfig";
import { buildAuthHeaders } from "@/lib/authHeaders";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/apiFetch";

interface Course {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  level: string;
  price: number;
  status: string;
  instructorId: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export default function AdminCoursesPage() {
  const { token, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  
  const [page, setPage] = useState(0);
  const size = 10;
  
  const [isArchiving, setIsArchiving] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Gọi API lấy danh sách toàn bộ khóa học (Admin route)
  const { data: coursesData, mutate, isLoading: isFetching } = useSWR(
    token ? [`${API_BASE_URL}/api/courses?page=${page}&size=${size}`, token] : null,
    async ([url, t]) => {
      const res = await fetch(url, { headers: buildAuthHeaders(t) });
      if (!res.ok) throw new Error("Fetch failed");
      const body = await res.json();
      return body.data; // Page<Course>
    }
  );

  const courses = (coursesData?.content || []) as Course[];
  const totalElements = coursesData?.totalElements || 0;
  const totalPages = coursesData?.totalPages || 0;

  const handleArchiveCourse = async (courseId: string) => {
    if (!token) return;
    if (!confirm("Bạn có chắc chắn muốn lưu trữ (xóa mềm) khóa học này? Hành động này sẽ ẩn khóa học khỏi hệ thống.")) return;
    
    setIsArchiving(courseId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}/archive`, {
        method: "DELETE",
        headers: buildAuthHeaders(token),
      });

      if (!res.ok) {
        throw new Error("Lỗi khi lưu trữ khóa học");
      }

      toast.success("Thành công", "Đã lưu trữ khóa học thành công");
      mutate();
    } catch (err) {
      toast.error("Thất bại", "Không thể lưu trữ khóa học");
    } finally {
      setIsArchiving(null);
    }
  };

  const handleRemoveCourse = async (courseId: string) => {
    const reason = window.prompt("Nhập lý do gỡ khóa học vi phạm:");
    if (!reason?.trim()) return;
    if (!confirm("Gỡ nội dung khóa học và gửi thông báo cho giảng viên?")) return;
    setIsRemoving(courseId);
    try {
      await apiFetch(`/api/admin/courses/${courseId}/remove`, { method: "POST", body: JSON.stringify({ reason: reason.trim() }) });
      toast.success("Đã gỡ khóa học vi phạm");
      await mutate();
    } catch (cause) {
      toast.error("Không thể gỡ khóa học", cause instanceof Error ? cause.message : "Request failed");
    } finally {
      setIsRemoving(null);
    }
  };

  const migrateStatuses = async () => {
    if (!confirm("Chạy migration trạng thái cho toàn bộ khóa học? Chỉ thực hiện khi đã phối hợp với Backend.")) return;
    setIsMigrating(true);
    try {
      await apiFetch("/api/courses/admin/migrate-status", { method: "POST" });
      toast.success("Migration trạng thái hoàn tất");
      await mutate();
    } catch (cause) {
      toast.error("Migration thất bại", cause instanceof Error ? cause.message : "Request failed");
    } finally {
      setIsMigrating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-2xs font-bold uppercase"><CheckCircle className="w-3 h-3" /> Đã xuất bản</span>;
      case "APPROVED":
        return <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-2xs font-bold uppercase"><CheckCircle className="w-3 h-3" /> Đã duyệt</span>;
      case "PENDING":
      case "PENDING_REVIEW":
        return <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-2xs font-bold uppercase"><Clock className="w-3 h-3" /> Chờ duyệt</span>;
      case "REJECTED":
        return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-2xs font-bold uppercase"><XCircle className="w-3 h-3" /> Từ chối</span>;
      case "ARCHIVED":
        return <span className="flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-1 rounded-full text-2xs font-bold uppercase"><Trash2 className="w-3 h-3" /> Đã lưu trữ</span>;
      default: // DRAFT
        return <span className="flex items-center gap-1 text-gray-500 bg-gray-50 px-2 py-1 rounded-full text-2xs font-bold uppercase"><FileText className="w-3 h-3" /> Bản nháp</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-2 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary" />
            Quản lý khóa học
          </h1>
          <p className="text-sm font-semibold text-gray-500">
            Xem và quản lý toàn bộ {totalElements > 0 && <span className="text-primary font-bold">{totalElements}</span>} khóa học trên hệ thống
          </p>
        </div>
        
        {/* Placeholder for future search/filter */}
        <div className="flex gap-2 w-full sm:w-auto">
          <button disabled={isMigrating} onClick={migrateStatuses} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 disabled:opacity-50">
            {isMigrating ? "Đang migrate..." : "Migrate status"}
          </button>
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm khóa học..." 
              className="w-full text-sm pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
          <button className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 text-2xs font-extrabold uppercase tracking-wider">
                <th className="px-6 py-4">Khóa học</th>
                <th className="px-6 py-4">Trình độ / Giá</th>
                <th className="px-6 py-4">Giảng viên</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {isFetching ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-xs font-semibold">Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400 text-sm font-medium">
                    Chưa có khóa học nào trên hệ thống.
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 max-w-[250px] truncate" title={course.title}>
                        {course.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 max-w-[250px] truncate">
                        {course.shortDescription || course.slug}
                      </p>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <span className="inline-block bg-blue-50 text-secondary text-2xs font-black uppercase px-2 py-0.5 rounded">
                        {course.level}
                      </span>
                      <div className="font-semibold text-gray-600 text-xs mt-1">
                        {course.price === 0 ? "Miễn phí" : `${course.price.toLocaleString()} đ`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-lg truncate max-w-[120px] inline-block" title={course.instructorId}>
                        {course.instructorId.split("-")[0]}...
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(course.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => window.open(`/courses/${course.slug}`, "_blank")}
                          className="p-2 rounded-xl bg-gray-50 hover:bg-blue-50 hover:text-blue-500 text-gray-500 border border-gray-100 transition-all cursor-pointer"
                          title="Xem chi tiết trên Public Catalog"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {course.status !== "ARCHIVED" && (
                          <button
                            onClick={() => handleArchiveCourse(course.id)}
                            disabled={isArchiving === course.id}
                            className="p-2 rounded-xl bg-gray-50 hover:bg-red-50 hover:text-red-500 text-gray-500 border border-gray-100 transition-all cursor-pointer disabled:opacity-50"
                            title="Lưu trữ (Xóa mềm)"
                          >
                            {isArchiving === course.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveCourse(course.id)}
                          disabled={isRemoving === course.id}
                          className="p-2 rounded-xl border border-red-100 bg-red-50 text-red-600 disabled:opacity-50"
                          title="Gỡ khóa học vi phạm"
                        >
                          {isRemoving === course.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-500 font-semibold">
              Trang {page + 1} / {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                Trước
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
