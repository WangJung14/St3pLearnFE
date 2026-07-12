"use client";

import Link from "next/link";
import useSWR from "swr";
import { mutate as globalMutate } from "swr";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Heart,
  Loader2,
  Star,
  Trash2,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { CourseCardSkeleton } from "@/components/ui/Skeleton";
import { RoleGuard } from "@/components/guards/RoleGuard";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/apiConfig";
import { apiFetch } from "@/lib/apiFetch";
import { useToast } from "@/components/ui/Toast";

interface WishlistCourse {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl?: string;
  price?: number;
  level?: string;
  avgRating?: number;
  totalReviews?: number;
}

interface PagePayload<T> {
  content?: T[];
}

interface WishlistApiResponse {
  data?: TolerantWishlistPayload;
  content?: WishlistCourse[];
}

type TolerantWishlistPayload = WishlistCourse[] | PagePayload<WishlistCourse>;

function unwrapWishlist(body: WishlistApiResponse): WishlistCourse[] {
  const payload = body.data ?? body.content ?? [];
  return Array.isArray(payload) ? payload : payload.content ?? [];
}

function formatPrice(price?: number) {
  if (!price) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

export default function StudentWishlistPage() {
  const { token } = useAuth();
  const toast = useToast();
  const wishlistKey = token
    ? [`${API_BASE_URL}/api/wishlists?page=0&size=24`, token] as const
    : null;

  const {
    data: courses = [],
    error,
    isLoading,
    mutate,
  } = useSWR<WishlistCourse[]>(
    wishlistKey,
    async ([url, currentToken]) => {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null) as { message?: string } | null;
        throw new Error(body?.message ?? "Không tải được wishlist");
      }

      const body = await res.json() as WishlistApiResponse;
      return unwrapWishlist(body);
    },
    { revalidateOnFocus: false }
  );

  const handleRemove = async (courseId: string) => {
    const confirmed = window.confirm("Xóa khóa học này khỏi wishlist?");
    if (!confirmed) return;

    try {
      await apiFetch(`/api/wishlists/courses/${courseId}`, {
        method: "DELETE",
      });

      await mutate((current) => current?.filter((course) => course.id !== courseId) ?? [], {
        revalidate: false,
      });
      await globalMutate(`${API_BASE_URL}/api/wishlists`);
      toast.success("Đã xóa khỏi wishlist");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Xóa wishlist thất bại";
      toast.error("Xóa wishlist thất bại", message);
    }
  };

  return (
    <RoleGuard allow={["STUDENT", "ADMIN"]}>
      <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
        <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 rounded-3xl border border-gray-100 bg-white p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Link
                href="/student"
                className="inline-flex items-center gap-2 text-xs font-extrabold text-gray-400 transition-colors hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
              <div className="space-y-1">
                <h1 className="text-2xl font-black text-gray-900">Wishlist của tôi</h1>
                <p className="max-w-2xl text-sm leading-relaxed text-gray-500">
                  Lưu lại các khóa học bạn quan tâm để quay lại đăng ký khi sẵn sàng.
                </p>
              </div>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-pink-100 bg-pink-50 text-primary">
              <Heart className="h-7 w-7 fill-current" />
            </div>
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <CourseCardSkeleton key={index} />
              ))}
            </div>
          )}

          {!isLoading && error && (
            <EmptyState
              icon={<AlertCircle className="h-8 w-8" />}
              title="Không tải được wishlist"
              description={error instanceof Error ? error.message : "Vui lòng thử lại sau."}
              action={
                <button
                  onClick={() => mutate()}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-pink-100 transition-opacity hover:opacity-95"
                >
                  <Loader2 className="h-4 w-4" />
                  Tải lại
                </button>
              }
            />
          )}

          {!isLoading && !error && courses.length === 0 && (
            <EmptyState
              icon={<BookOpen className="h-8 w-8" />}
              title="Wishlist đang trống"
              description="Bạn có thể thêm khóa học vào wishlist từ trang chi tiết khóa học."
              action={
                <Link
                  href="/courses"
                  className="inline-flex items-center rounded-xl bg-primary px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-pink-100 transition-opacity hover:opacity-95"
                >
                  Khám phá khóa học
                </Link>
              }
            />
          )}

          {!isLoading && !error && courses.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <article
                  key={course.id}
                  className="flex overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-hover"
                >
                  <div className="flex w-full flex-col">
                    <Link href={`/courses/${course.slug}`} className="group relative aspect-video overflow-hidden bg-gray-100">
                      <img
                        src={course.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600"}
                        alt={course.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      {course.level && (
                        <span className="absolute left-3 top-3 rounded-lg bg-primary px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
                          {course.level}
                        </span>
                      )}
                    </Link>

                    <div className="flex flex-1 flex-col justify-between gap-5 p-5">
                      <div className="space-y-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                          Khóa học đã lưu
                        </span>
                        <Link href={`/courses/${course.slug}`}>
                          <h2 className="line-clamp-2 text-lg font-extrabold text-gray-900 transition-colors hover:text-primary">
                            {course.title}
                          </h2>
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Star className="h-4 w-4 fill-amber-400 stroke-amber-400" />
                          <span className="font-bold text-gray-800">{course.avgRating ?? 0}</span>
                          <span>({course.totalReviews ?? 0} đánh giá)</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 border-t border-gray-50 pt-4">
                        <span className="text-base font-black text-primary">
                          {formatPrice(course.price)}
                        </span>
                        <button
                          onClick={() => handleRemove(course.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition-colors hover:bg-red-100"
                          title="Xóa khỏi wishlist"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </RoleGuard>
  );
}
