"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Check, Loader2, Tags } from "lucide-react";
import { API_BASE_URL } from "@/lib/apiConfig";
import { buildAuthHeaders } from "@/lib/authHeaders";
import { useToast } from "@/components/ui/Toast";
import { getValidationMessage, taxonomySchema } from "@/lib/validations";

interface TaxonomyItem {
  id: string;
  name: string;
  slug?: string;
}

interface CourseTaxonomySnapshot {
  categories?: TaxonomyItem[];
  tags?: TaxonomyItem[];
}

interface ApiResponse<T> {
  data?: T;
  message?: string;
}

interface CourseTaxonomyFormProps {
  courseId: string;
  token: string | null;
}

function unwrapData<T>(body: ApiResponse<T> | T): T {
  return (body as ApiResponse<T>).data ?? (body as T);
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Không tải được dữ liệu phân loại");
  const body = await res.json() as ApiResponse<T> | T;
  return unwrapData<T>(body);
}

export default function CourseTaxonomyForm({ courseId, token }: CourseTaxonomyFormProps) {
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const toast = useToast();

  const {
    data: categories = [],
    error: categoriesError,
    isLoading: categoriesLoading,
  } = useSWR<TaxonomyItem[]>(
    `${API_BASE_URL}/api/categories`,
    fetchJson,
    { revalidateOnFocus: false }
  );

  const { data: tags = [], error: tagsError } = useSWR<TaxonomyItem[]>(
    `${API_BASE_URL}/api/tags`,
    fetchJson,
    { revalidateOnFocus: false }
  );

  const { data: courseSnapshot, mutate: mutateCourseSnapshot } = useSWR<CourseTaxonomySnapshot>(
    `${API_BASE_URL}/api/courses/${courseId}`,
    fetchJson,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  useEffect(() => {
    if (!courseSnapshot) return;
    setCategoryIds(courseSnapshot.categories?.map((category) => category.id) ?? []);
    setTagIds(courseSnapshot.tags?.map((tag) => tag.id) ?? []);
  }, [courseSnapshot]);

  const toggleValue = (current: string[], value: string) =>
    current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (!token) {
      setErrorMessage("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      toast.error("Không thể lưu phân loại", "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      return;
    }

    const parsed = taxonomySchema.safeParse({ categoryIds, tagIds });
    if (!parsed.success) {
      const error = getValidationMessage(parsed.error);
      setErrorMessage(error);
      toast.warning("Phân loại chưa hợp lệ", error);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}/taxonomy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(token),
        },
        body: JSON.stringify(parsed.data),
      });

      const body = await res.json().catch(() => null) as { message?: string } | null;
      if (!res.ok) {
        throw new Error(body?.message ?? "Cập nhật taxonomy thất bại");
      }

      setMessage("Đã cập nhật danh mục và tag cho khóa học.");
      toast.success("Đã cập nhật phân loại");
      await mutateCourseSnapshot();
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Cập nhật taxonomy thất bại";
      setErrorMessage(error);
      toast.error("Cập nhật phân loại thất bại", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1 border-b border-gray-50 pb-4">
        <h2 className="flex items-center gap-2 text-xl font-black text-gray-900">
          <Tags className="h-5 w-5 text-primary" />
          Phân loại khóa học
        </h2>
        <p className="text-xs leading-relaxed text-gray-500">
          Chọn danh mục và tag để khóa học xuất hiện đúng trong bộ lọc tìm kiếm công khai.
        </p>
      </div>

      {categoriesLoading && (
        <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-xs font-bold text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Đang tải danh mục...
        </div>
      )}

      {categoriesError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-xs font-bold text-red-600">
          Không tải được danh mục từ backend.
        </div>
      )}

      {!categoriesLoading && !categoriesError && categories.length > 0 && (
        <div className="space-y-3">
          <label className="text-2xs font-extrabold uppercase tracking-wider text-gray-400">
            Danh mục bắt buộc
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {categories.map((category) => {
              const selected = categoryIds.includes(category.id);
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setCategoryIds((current) => toggleValue(current, category.id))}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-xs font-bold transition-all ${
                    selected
                      ? "border-primary bg-pink-50/60 text-primary"
                      : "border-gray-100 bg-white text-gray-600 hover:border-pink-200"
                  }`}
                >
                  <span>{category.name}</span>
                  {selected && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!categoriesLoading && !categoriesError && categories.length === 0 && (
        <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4 text-xs font-bold text-yellow-700">
          Chưa có danh mục nào. Admin cần tạo danh mục trước khi giáo viên gắn taxonomy.
        </div>
      )}

      <div className="space-y-3">
        <label className="text-2xs font-extrabold uppercase tracking-wider text-gray-400">
          Tag tùy chọn
        </label>

        {tagsError ? (
          <p className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4 text-xs font-bold text-yellow-700">
            Không tải được tag. Bạn vẫn có thể lưu danh mục trước.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const selected = tagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setTagIds((current) => toggleValue(current, tag.id))}
                  className={`rounded-full border px-3 py-1.5 text-xs font-extrabold transition-all ${
                    selected
                      ? "border-secondary bg-blue-50 text-secondary"
                      : "border-gray-100 bg-white text-gray-500 hover:border-blue-200"
                  }`}
                >
                  {tag.name}
                </button>
              );
            })}
            {tags.length === 0 && (
              <span className="text-xs font-semibold text-gray-400">
                Chưa có tag nào trong hệ thống.
              </span>
            )}
          </div>
        )}
      </div>

      {errorMessage && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
          {errorMessage}
        </p>
      )}

      {message && (
        <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
          {message}
        </p>
      )}

      <div className="flex justify-end border-t border-gray-50 pt-4">
        <button
          type="submit"
          disabled={isSaving || categoryIds.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-extrabold text-white shadow-md shadow-pink-100 transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Lưu phân loại
        </button>
      </div>
    </form>
  );
}
