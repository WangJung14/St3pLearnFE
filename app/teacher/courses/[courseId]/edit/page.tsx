"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ArrowLeft, BookOpen, Save, Loader2, Sparkles } from "lucide-react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/apiConfig";
import { apiFetch } from "@/lib/apiFetch";
import { buildAuthHeaders } from "@/lib/authHeaders";
import { useToast } from "@/components/ui/Toast";
import { courseCreateSchema, type CourseCreateFormInput, type CourseCreateFormValues } from "@/lib/validations";

interface CourseEditData {
  title?: string;
  shortDescription?: string;
  description?: string;
  price?: number;
  level?: string;
  language?: string;
  categories?: Category[];
}

interface Category { id: string; name: string }

export default function EditCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const { token, isAuthenticated, isLoading } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CourseCreateFormInput, unknown, CourseCreateFormValues>({
    resolver: zodResolver(courseCreateSchema),
    defaultValues: {
      title: "",
      shortDescription: "",
      description: "",
      price: 0,
      level: "B1",
      language: "English",
      categoryId: "",
    },
  });

  // Chuyển hướng về trang đăng nhập nếu chưa xác thực bảo mật
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const { data: categories = [], error: categoriesError, isLoading: categoriesLoading } = useSWR<Category[]>(
    token ? ["/api/categories", token] : null,
    async ([path]: readonly [string, string]) => {
      const body = await apiFetch<{ data?: Category[] } | Category[]>(path);
      return Array.isArray(body) ? body : body.data ?? [];
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  // Fetch course details
  const { data: courseData } = useSWR(
<<<<<<< Updated upstream
    token ? [`/api/courses/${params.courseId}`, token] : null,
    async ([path, currentToken]: readonly [string, string]) => {
      const body = await apiFetch<{ data?: CourseEditData } | CourseEditData>(path, {
        headers: buildAuthHeaders(currentToken),
      });
      return (body as { data?: CourseEditData }).data ?? (body as CourseEditData);
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
=======
    token ? [`${API_BASE_URL}/api/courses/${resolvedParams.courseId}`, token] : null,
    async ([url, t]) => {
      const res = await fetch(url, { headers: buildAuthHeaders(t) });
      if (!res.ok) throw new Error("Fetch failed");
      const body = await res.json();
      return body.data;
    }
>>>>>>> Stashed changes
  );

  // Set default form values when course data is loaded
  useEffect(() => {
    if (courseData) {
      reset({
        title: courseData.title || "",
        shortDescription: courseData.shortDescription || "",
        description: courseData.description || "",
        price: courseData.price || 0,
        level: courseData.level || "B1",
        language: courseData.language || "English",
        categoryId: courseData.categories?.[0]?.id || "",
      });
    }
  }, [courseData, reset]);

  const fieldClassName = (field: keyof CourseCreateFormInput, base: string) =>
    `${base} ${
      errors[field] ? "border-red-300 focus:ring-red-400" : "border-gray-200 focus:ring-primary"
    }`;

  const onSubmit: SubmitHandler<CourseCreateFormValues> = async (data) => {
    if (!token) return;
    setIsSaving(true);

    try {
      // Gửi yêu cầu POST cập nhật khóa học lên API Gateway
      const res = await fetch(`${API_BASE_URL}/api/courses/${resolvedParams.courseId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(token),
        },
        body: JSON.stringify({
          title: data.title,
          shortDescription: data.shortDescription,
          description: data.description,
          price: data.price,
          level: data.level,
          language: data.language
        }),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(body?.message || "Cập nhật khóa học thất bại.");
      }

<<<<<<< Updated upstream
      await apiFetch(`/api/courses/${params.courseId}/taxonomy`, {
        method: "POST",
        body: JSON.stringify({ categoryIds: [data.categoryId], tagIds: [] }),
      });
=======
      if (data.categoryId) {
        await fetch(`${API_BASE_URL}/api/courses/${resolvedParams.courseId}/taxonomy`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(token),
          },
          body: JSON.stringify({
            categoryIds: [data.categoryId],
            tagIds: [],
          }),
        }).catch(() => null);
      }
>>>>>>> Stashed changes

      toast.success("Cập nhật thành công", "Thông tin khóa học đã được lưu.");
      router.push("/teacher");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi API";
      toast.error("Không thể cập nhật khóa học", message);
    } finally {
      setIsSaving(false);
    }
  };

  const onInvalid = () => {
    const firstError = Object.values(errors)[0];
    if (firstError?.message) {
      toast.warning("Thông tin khóa học chưa hợp lệ", firstError.message);
    }
  };

  const levelsList = ["A1", "A2", "B1", "B2", "C1", "C2", "IELTS", "TOEIC", "TOEFL"];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <main className="flex-grow max-w-3xl w-full mx-auto px-4 py-10 space-y-6">
        {/* Back button */}
        <div>
          <button
            onClick={() => router.push("/teacher")}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Dashboard</span>
          </button>
        </div>

        {/* Form panel */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-6 sm:p-8 space-y-6">
          <div className="space-y-1 border-b border-gray-50 pb-4">
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Chỉnh sửa khóa học
            </h1>
            <p className="text-xs text-gray-500">Cập nhật thông tin cơ bản cho khóa học của bạn.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-5 text-sm">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-2xs font-extrabold uppercase text-gray-400 tracking-wider">Tên khóa học</label>
              <input
                type="text"
                {...registerField("title")}
                placeholder="Ví dụ: IELTS Masterclass: Lộ trình Step-by-Step 7.5+..."
                aria-invalid={Boolean(errors.title)}
                className={fieldClassName(
                  "title",
                  "w-full text-xs rounded-xl border px-4 py-3 focus:ring-2 focus:border-transparent outline-none transition-all"
                )}
              />
              {errors.title && (
                <p className="text-3xs font-bold text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Short Description */}
            <div className="space-y-1.5">
              <label className="text-2xs font-extrabold uppercase text-gray-400 tracking-wider">Mô tả ngắn gọn (Thẻ hiển thị)</label>
              <input
                type="text"
                {...registerField("shortDescription")}
                placeholder="Ví dụ: Làm chủ cả 4 kỹ năng Nghe, Nói, Đọc, Viết chuẩn cấu trúc đề thi..."
                aria-invalid={Boolean(errors.shortDescription)}
                className={fieldClassName(
                  "shortDescription",
                  "w-full text-xs rounded-xl border px-4 py-3 focus:ring-2 focus:border-transparent outline-none transition-all"
                )}
              />
              {errors.shortDescription && (
                <p className="text-3xs font-bold text-red-500">{errors.shortDescription.message}</p>
              )}
            </div>

            {/* Level & Price & Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-2xs font-extrabold uppercase text-gray-400 tracking-wider">Trình độ</label>
                <select
                  {...registerField("level")}
                  className="w-full text-xs rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white cursor-pointer"
                >
                  {levelsList.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-2xs font-extrabold uppercase text-gray-400 tracking-wider">Ngôn ngữ</label>
                <select
                  {...registerField("language")}
                  className="w-full text-xs rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white cursor-pointer"
                >
                  <option value="English">English</option>
                  <option value="Vietnamese">Vietnamese</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-2xs font-extrabold uppercase text-gray-400 tracking-wider">Học phí (VND)</label>
                <input
                  type="number"
                  min="0"
                  {...registerField("price", { valueAsNumber: true })}
                  placeholder="0 (Miễn phí)"
                  aria-invalid={Boolean(errors.price)}
                  className={fieldClassName(
                    "price",
                    "w-full text-xs rounded-xl border px-4 py-3 focus:ring-2 focus:border-transparent outline-none transition-all"
                  )}
                />
                {errors.price && (
                  <p className="text-3xs font-bold text-red-500">{errors.price.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-2xs font-extrabold uppercase text-gray-400 tracking-wider">Danh mục</label>
                <select {...registerField("categoryId")} disabled={categoriesLoading || Boolean(categoriesError)} className={fieldClassName("categoryId", "w-full text-xs rounded-xl border px-4 py-3 outline-none bg-white disabled:bg-gray-100")}>
                  <option value="">{categoriesLoading ? "Đang tải..." : "Chọn danh mục"}</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
                {categoriesError && <p className="text-3xs font-bold text-red-500">Không tải được danh mục.</p>}
                {errors.categoryId && <p className="text-3xs font-bold text-red-500">{errors.categoryId.message}</p>}
              </div>

            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-2xs font-extrabold uppercase text-gray-400 tracking-wider">Giới thiệu giáo trình chi tiết</label>
              <textarea
                rows={5}
                {...registerField("description")}
                placeholder="Nhập giới thiệu chi tiết về nội dung giảng dạy, mục tiêu đầu ra và đối tượng học viên..."
                aria-invalid={Boolean(errors.description)}
                className={fieldClassName(
                  "description",
                  "w-full text-xs rounded-2xl border p-4 focus:ring-2 focus:border-transparent outline-none transition-all"
                )}
              />
              {errors.description && (
                <p className="text-3xs font-bold text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex justify-end pt-4 border-t border-gray-50">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-primary hover:opacity-95 text-white text-xs font-extrabold py-3.5 px-8 rounded-xl shadow-md shadow-pink-200 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
