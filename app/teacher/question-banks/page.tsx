"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Brain, Plus, Edit, Trash2, Save, X, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/apiConfig";
import { buildAuthHeaders } from "@/lib/authHeaders";
import { useToast } from "@/components/ui/Toast";

interface QuestionBank {
  id: string;
  courseId: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface Course {
  id: string;
  title: string;
}

export default function QuestionBanksPage() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading } = useAuth();
  const toast = useToast();
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: "", description: "", courseId: "" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch banks
  const { data: banksResponse, mutate: mutateBanks } = useSWR(
    token ? [`${API_BASE_URL}/api/learning/question-banks`, token] : null,
    async ([url, t]) => {
      const res = await fetch(url, { headers: buildAuthHeaders(t) });
      if (!res.ok) throw new Error("Fetch failed");
      const body = await res.json();
      return body.data as QuestionBank[];
    }
  );

  // Fetch courses
  const { data: coursesResponse } = useSWR(
    token ? [`${API_BASE_URL}/api/courses/my-courses?size=100`, token] : null,
    async ([url, t]) => {
      const res = await fetch(url, { headers: buildAuthHeaders(t) });
      if (!res.ok) throw new Error("Fetch failed");
      const body = await res.json();
      return (body.data.content || body.data) as Course[];
    }
  );

  const banks = banksResponse || [];
  const courses = coursesResponse || [];

  const handleCreateNew = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({ title: "", description: "", courseId: courses[0]?.id || "" });
  };

  const handleEdit = (bank: QuestionBank) => {
    setIsCreating(false);
    setEditingId(bank.id);
    setFormData({ title: bank.title, description: bank.description, courseId: bank.courseId });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);

    const isEdit = !!editingId;
    const url = isEdit 
      ? `${API_BASE_URL}/api/learning/question-banks/${editingId}`
      : `${API_BASE_URL}/api/learning/question-banks`;
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(token),
        },
        body: JSON.stringify(formData),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(body?.message || "Thao tác thất bại");
      }

      toast.success(isEdit ? "Đã cập nhật ngân hàng câu hỏi" : "Tạo ngân hàng câu hỏi thành công");
      handleCancel();
      mutateBanks();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi kết nối server";
      toast.error("Lỗi", message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (bankId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa ngân hàng câu hỏi này?")) return;
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/learning/question-banks/${bankId}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token),
      });

      if (!res.ok) {
        throw new Error("Xóa thất bại");
      }

      toast.success("Đã xóa ngân hàng câu hỏi");
      mutateBanks();
    } catch (err: unknown) {
      toast.error("Lỗi xóa ngân hàng câu hỏi");
    }
  };

  return (
    <div className="space-y-10 animate-fade-in p-2 md:p-6">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center flex-wrap gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              Ngân hàng câu hỏi
            </h1>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Quản lý kho câu hỏi trắc nghiệm & tự luận</p>
          </div>
          {!isCreating && !editingId && (
            <button
              onClick={handleCreateNew}
              className="bg-primary hover:opacity-95 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-md shadow-pink-200 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo ngân hàng mới</span>
            </button>
          )}
        </div>

        {(isCreating || editingId) && (
          <div className="p-6 bg-gray-50/50 border-b border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
              <h3 className="font-bold text-gray-900">{isCreating ? "Tạo Ngân hàng mới" : "Chỉnh sửa Ngân hàng"}</h3>
              
              <div className="space-y-1.5">
                <label className="text-2xs font-extrabold uppercase text-gray-400 tracking-wider">Khóa học</label>
                <select
                  required
                  disabled={!!editingId} // Usually shouldn't change course after creation, or if allowed remove disabled
                  value={formData.courseId}
                  onChange={e => setFormData(f => ({ ...f, courseId: e.target.value }))}
                  className="w-full text-xs rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-primary outline-none bg-white cursor-pointer"
                >
                  <option value="" disabled>-- Chọn khóa học --</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-2xs font-extrabold uppercase text-gray-400 tracking-wider">Tên Ngân hàng</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                  placeholder="VD: Ngân hàng câu hỏi Unit 1..."
                  className="w-full text-xs rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-2xs font-extrabold uppercase text-gray-400 tracking-wider">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  placeholder="Mô tả nội dung của ngân hàng này..."
                  rows={3}
                  className="w-full text-xs rounded-xl border border-gray-200 p-4 focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !formData.courseId}
                  className="bg-primary hover:opacity-95 text-white text-xs font-extrabold py-2 px-6 rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isCreating ? "Tạo mới" : "Lưu thay đổi"}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 text-2xs font-extrabold uppercase tracking-wider">
                <th className="px-6 py-4">Tên Ngân hàng</th>
                <th className="px-6 py-4">Khóa học</th>
                <th className="px-6 py-4">Mô tả</th>
                <th className="px-6 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {banks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400 text-sm font-medium">
                    Bạn chưa tạo ngân hàng câu hỏi nào.
                  </td>
                </tr>
              ) : (
                banks.map((bank) => {
                  const courseTitle = courses.find(c => c.id === bank.courseId)?.title || "Unknown Course";
                  return (
                    <tr key={bank.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{bank.title}</td>
                      <td className="px-6 py-4 text-gray-600 truncate max-w-[200px]" title={courseTitle}>
                        {courseTitle}
                      </td>
                      <td className="px-6 py-4 text-gray-500 truncate max-w-[250px]">
                        {bank.description || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => handleEdit(bank)}
                            className="p-2 rounded-xl bg-gray-50 hover:bg-blue-50 hover:text-blue-500 text-gray-500 border border-gray-100 transition-all cursor-pointer"
                            title="Sửa thông tin"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(bank.id)}
                            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 transition-all cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
