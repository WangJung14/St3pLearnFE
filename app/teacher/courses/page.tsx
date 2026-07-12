"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Plus, BookOpen, Users, DollarSign, Star, Edit, Check, Eye, Trash2, Send, RotateCcw, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/apiConfig";
import { buildAuthHeaders } from "@/lib/authHeaders";
import { useToast } from "@/components/ui/Toast";

interface Course {
  id: string;
  title: string;
  slug: string;
  level: string;
  price: number;
  status: "DRAFT" | "PENDING" | "PENDING_REVIEW" | "APPROVED" | "PUBLISHED" | "REJECTED" | "ARCHIVED";
  totalStudents?: number;
  avgRating?: number;
}

const MOCK_TEACHER_COURSES: Course[] = [
  {
    id: "ielts-1",
    title: "IELTS Masterclass: Step-by-Step 7.5+",
    slug: "ielts-masterclass-step-by-step-7-5",
    level: "IELTS",
    price: 1200000,
    status: "PUBLISHED",
    totalStudents: 3450,
    avgRating: 4.8
  },
  {
    id: "grammar-1",
    title: "English Grammar for Beginners & Intermediate",
    slug: "english-grammar-for-beginners-intermediate",
    level: "B1",
    price: 500000,
    status: "DRAFT",
    totalStudents: 0,
    avgRating: 0
  }
];

export default function TeacherCoursesPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const toast = useToast();

  // Fetch teacher's courses from backend gateway
  const { data: coursesResponse, error, mutate } = useSWR(
    token ? [`${API_BASE_URL}/api/courses/my-courses`, token] : null,
    async ([url, t]: readonly [string, string]) => {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${t}`,
        },
      });
      if (!res.ok) throw new Error("Fetch failed");
      const body = await res.json();
      return body.data;
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  let courses: Course[] = [];
  let isFallback = false;

  if (error || !coursesResponse) {
    courses = MOCK_TEACHER_COURSES;
    isFallback = true;
  } else {
    const content = coursesResponse.content || coursesResponse;
    courses = Array.isArray(content) ? content : [];
  }

  // Handle submit for approval
  const handleSubmitApproval = async (courseId: string) => {
    if (!window.confirm("Gửi khóa học này cho Admin duyệt?")) return;
    if (!token) return;
    setIsProcessing(courseId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}/submit`, {
        method: "POST",
        headers: buildAuthHeaders(token),
      });
      if (res.ok) {
        toast.success("Gửi duyệt khóa học thành công");
        mutate();
      } else {
        const body = await res.json().catch(() => null);
        toast.error("Lỗi khi gửi duyệt", body?.message);
      }
    } catch (e) {
      toast.error("Lỗi kết nối server");
    } finally {
      setIsProcessing(null);
    }
  };

  // Handle publish
  const handlePublishCourse = async (courseId: string) => {
    if (!window.confirm("Xuất bản khóa học đã được Admin duyệt?")) return;
    if (!token) return;
    setIsProcessing(courseId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}/publish`, {
        method: "POST",
        headers: buildAuthHeaders(token),
      });
      if (res.ok) {
        toast.success("Xuất bản khóa học thành công", "Học viên đã có thể tìm thấy khóa học này.");
        mutate();
      } else {
        const body = await res.json().catch(() => null);
        toast.error("Lỗi khi xuất bản", body?.message);
      }
    } catch (e) {
      toast.error("Lỗi kết nối server");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleCancelSubmit = async (courseId: string) => {
    if (!window.confirm("Thu hồi yêu cầu duyệt và đưa khóa học về bản nháp?")) return;
    if (!token) return;
    setIsProcessing(courseId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}/cancel-submit`, {
        method: "POST",
        headers: buildAuthHeaders(token),
      });
      const body = await res.json().catch(() => null);
      if (res.ok) {
        toast.success(body?.message || "Đã thu hồi yêu cầu duyệt");
        mutate();
      } else {
        toast.error("Lỗi khi thu hồi yêu cầu duyệt", body?.message);
      }
    } catch {
      toast.error("Lỗi kết nối server");
    } finally {
      setIsProcessing(null);
    }
  };

  // Handle soft delete / archive
  const handleArchiveCourse = async (courseId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn lưu trữ (xóa tạm thời) khóa học này không?")) return;
    if (!token) return;
    setIsProcessing(courseId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}/archive`, {
        method: "DELETE",
        headers: buildAuthHeaders(token),
      });
      if (res.ok) {
        toast.success("Đã lưu trữ khóa học thành công");
        mutate();
      } else {
        toast.error("Không thể lưu trữ khóa học này");
      }
    } catch (e) {
      toast.error("Lỗi kết nối server");
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Courses Management Table */}

      {/* Courses Management Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center flex-wrap gap-4">
          <div className="space-y-0.5">
            <h4 className="font-extrabold text-gray-900 text-base">Bài giảng của tôi</h4>
            <p className="text-2xs font-semibold text-gray-400 uppercase tracking-wider">Danh sách giáo trình & khóa học tự thiết kế</p>
          </div>
          <button
            onClick={() => router.push("/teacher/courses/new")}
            className="bg-primary hover:opacity-95 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-md shadow-pink-200 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo khóa học mới</span>
          </button>
        </div>

        {isFallback && (
          <div className="bg-yellow-50 text-yellow-800 text-2xs font-semibold px-6 py-2 border-b border-yellow-100">
            ⚠️ Chế độ xem thử: Đang hiển thị danh sách khóa học giả định do kết nối microservice đang khởi động.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 text-2xs font-extrabold uppercase tracking-wider">
                <th className="px-6 py-4">Khóa học</th>
                <th className="px-6 py-4">Trình độ</th>
                <th className="px-6 py-4">Học phí</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-center">Tác vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{course.title}</td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-secondary text-4xs font-black uppercase px-2 py-0.5 rounded">
                      {course.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-600">
                    {course.price === 0 ? "Miễn phí" : `${course.price.toLocaleString()} đ`}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-4xs font-black uppercase px-2.5 py-1 rounded-full ${
                        course.status === "PUBLISHED"
                          ? "bg-emerald-50 text-emerald-600"
                          : course.status === "APPROVED"
                          ? "bg-blue-50 text-blue-600"
                          : course.status === "PENDING" || course.status === "PENDING_REVIEW"
                          ? "bg-amber-50 text-amber-600"
                          : course.status === "REJECTED"
                          ? "bg-red-50 text-red-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {course.status === "PUBLISHED"
                        ? "Đã xuất bản"
                        : course.status === "APPROVED"
                        ? "Đã duyệt"
                        : course.status === "PENDING" || course.status === "PENDING_REVIEW"
                        ? "Đang chờ duyệt"
                        : course.status === "REJECTED"
                        ? "Bị từ chối"
                        : "Bản nháp"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center items-center gap-2">
                      <button
                        onClick={() => router.push(`/teacher/courses/${course.id}/edit`)}
                        className="p-2 rounded-xl bg-gray-50 hover:bg-blue-50 hover:text-blue-500 text-gray-500 border border-gray-100 transition-all cursor-pointer"
                        title="Chỉnh sửa thông tin"
                      >
                        <Settings className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => router.push(`/teacher/courses/${course.id}/curriculum`)}
                        className="p-2 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-primary text-gray-500 border border-gray-100 transition-all cursor-pointer"
                        title="Quản lý bài giảng"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {(course.status === "DRAFT" || course.status === "REJECTED") && (
                        <button
                          onClick={() => handleSubmitApproval(course.id)}
                          disabled={isProcessing === course.id}
                          className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-100 transition-all cursor-pointer"
                          title="Gửi duyệt khóa học"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}

                      {(course.status === "PENDING" || course.status === "PENDING_REVIEW") && (
                        <button
                          onClick={() => handleCancelSubmit(course.id)}
                          disabled={isProcessing === course.id}
                          className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-100 transition-all cursor-pointer"
                          title="Thu hồi yêu cầu duyệt"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}

                      {course.status === "APPROVED" && (
                        <button
                          onClick={() => handlePublishCourse(course.id)}
                          disabled={isProcessing === course.id}
                          className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 transition-all cursor-pointer"
                          title="Xuất bản khóa học"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleArchiveCourse(course.id)}
                        disabled={isProcessing === course.id}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 transition-all cursor-pointer"
                        title="Lưu trữ (Xóa)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
