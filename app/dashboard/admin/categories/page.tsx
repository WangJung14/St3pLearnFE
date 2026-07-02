"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { ArrowLeft, FolderTree, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RoleGuard } from "@/components/guards/RoleGuard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { API_BASE_URL } from "@/lib/apiConfig";
import { buildAuthHeaders } from "@/lib/authHeaders";
import { unwrapData, type ApiResponse } from "@/lib/apiResponses";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { taxonomyNameSchema } from "@/lib/validations";
import { z } from "zod";

type TaxonomyNameValues = z.infer<typeof taxonomyNameSchema>;

interface Category {
  id: string;
  name: string;
  slug?: string;
}

async function fetchCategories(url: string): Promise<Category[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Không tải được danh mục");
  const body = await res.json() as ApiResponse<Category[]> | Category[];
  return unwrapData<Category[]>(body);
}

export default function AdminCategoryPage() {
  const { token } = useAuth();
  const [editing, setEditing] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<TaxonomyNameValues>({
    resolver: zodResolver(taxonomyNameSchema),
    defaultValues: { name: "" },
  });

  const { data: categories = [], error, isLoading, mutate } = useSWR<Category[]>(
    `${API_BASE_URL}/api/categories`,
    fetchCategories,
    { revalidateOnFocus: false }
  );

  const resetForm = () => {
    reset({ name: "" });
    setEditing(null);
  };

  const onSubmit = async (data: TaxonomyNameValues) => {
    if (!token) return;
    setIsSaving(true);
    try {
      const endpoint = editing
        ? `${API_BASE_URL}/api/categories/${editing.id}`
        : `${API_BASE_URL}/api/categories`;
      const res = await fetch(endpoint, {
        method: editing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(token, "ADMIN"),
        },
        body: JSON.stringify({ name: data.name }),
      });
      const body = await res.json().catch(() => null) as { message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Lưu danh mục thất bại");

      resetForm();
      await mutate();
      toast.success(editing ? "Đã cập nhật danh mục" : "Đã tạo danh mục");
    } catch (err: unknown) {
      toast.error("Lưu danh mục thất bại", err instanceof Error ? err.message : undefined);
    } finally {
      setIsSaving(false);
    }
  };

  const onInvalid = () => {
    const firstError = Object.values(errors)[0];
    if (firstError?.message) {
      toast.warning("Tên danh mục chưa hợp lệ", firstError.message);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!token) return;
    if (!window.confirm(`Xóa danh mục "${category.name}"?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/categories/${category.id}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token, "ADMIN"),
      });
      const body = await res.json().catch(() => null) as { message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Xóa danh mục thất bại");

      await mutate();
      toast.success("Đã xóa danh mục");
    } catch (err: unknown) {
      toast.error("Xóa danh mục thất bại", err instanceof Error ? err.message : undefined);
    }
  };

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
                <h1 className="text-2xl font-black text-gray-900">Quản lý danh mục</h1>
                <p className="text-sm text-gray-500">Tạo, sửa và xóa category dùng cho taxonomy khóa học.</p>
              </div>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-pink-100 bg-pink-50 text-primary">
              <FolderTree className="h-7 w-7" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
            <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="h-fit rounded-3xl border border-gray-100 bg-white p-6 shadow-soft space-y-4">
              <div className="space-y-1">
                <h2 className="text-base font-black text-gray-900">{editing ? "Sửa danh mục" : "Thêm danh mục"}</h2>
                <p className="text-xs text-gray-500">Slug sẽ được backend đồng bộ theo tên danh mục.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-2xs font-extrabold uppercase tracking-wider text-gray-400">Tên danh mục</label>
                <input
                  {...registerField("name")}
                  placeholder="Ví dụ: Grammar"
                  aria-invalid={Boolean(errors.name)}
                  className={`w-full rounded-xl border px-4 py-3 text-xs outline-none focus:ring-2 ${
                    errors.name ? "border-red-300 focus:ring-red-400" : "border-gray-200 focus:ring-primary"
                  }`}
                />
                {errors.name && (
                  <p className="text-3xs font-bold text-red-500">{errors.name.message}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-extrabold text-white shadow-md shadow-pink-100 disabled:opacity-60"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {editing ? "Cập nhật" : "Tạo mới"}
                </button>
                {editing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 text-gray-500 hover:bg-gray-50"
                    title="Hủy sửa"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </form>

            <section className="rounded-3xl border border-gray-100 bg-white shadow-soft overflow-hidden">
              {isLoading && (
                <div className="flex items-center justify-center gap-2 py-16 text-sm font-bold text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  Đang tải danh mục...
                </div>
              )}
              {!isLoading && error && (
                <EmptyState title="Không tải được danh mục" description={error instanceof Error ? error.message : "Vui lòng thử lại."} />
              )}
              {!isLoading && !error && categories.length === 0 && (
                <EmptyState title="Chưa có danh mục" description="Tạo danh mục đầu tiên để giáo viên gắn taxonomy cho khóa học." />
              )}
              {!isLoading && !error && categories.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead className="text-right">Tác vụ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-extrabold text-gray-900">{category.name}</TableCell>
                        <TableCell className="text-gray-500">{category.slug ?? "-"}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditing(category);
                                setValue("name", category.name);
                              }}
                              className="rounded-xl border border-gray-100 bg-gray-50 p-2 text-gray-500 hover:text-primary"
                              title="Sửa"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(category)}
                              className="rounded-xl border border-red-100 bg-red-50 p-2 text-red-600 hover:bg-red-100"
                              title="Xóa"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </section>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
