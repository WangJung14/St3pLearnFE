"use client";

import Link from "next/link";
import { Star, Users, Heart } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import PublicUserProfileModal from "@/components/ui/PublicUserProfileModal";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/apiFetch";
import { buildAuthHeaders } from "@/lib/authHeaders";
import { API_BASE_URL } from "@/lib/apiConfig";

export interface Course {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  thumbnailUrl: string;
  price: number;
  level: string;
  avgRating: number;
  totalStudents: number;
  instructorName?: string;
  instructorPublicId?: string;
  categories?: Array<{ name: string }>;
}

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { token } = useAuth();
  const toast = useToast();

  // Tải danh sách wishlist hiện tại của học viên
  const { data: wishlistData, mutate: mutateWishlist } = useSWR<any>(
    token ? [`${API_BASE_URL}/api/wishlists?page=0&size=100`, token] as const : null,
    async ([url, currentToken]: readonly [string, string]) => {
      const res = await fetch(url, { headers: buildAuthHeaders(currentToken) });
      if (!res.ok) return null;
      return res.json();
    },
    { revalidateOnFocus: false }
  );

  const wishlistItems = wishlistData?.data?.content || wishlistData?.content || wishlistData?.data || [];
  const isWishlisted = Array.isArray(wishlistItems) && wishlistItems.some((item: any) => item.id === course.id || item.courseId === course.id);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      toast.error("Vui lòng đăng nhập để thêm vào danh sách yêu thích.");
      return;
    }

    try {
      if (isWishlisted) {
        await apiFetch(`/api/wishlists/courses/${course.id}`, { method: "DELETE" });
        toast.success("Đã xóa khỏi danh sách yêu thích.");
      } else {
        await apiFetch(`/api/wishlists/course/${course.id}`, { method: "POST" });
        toast.success("Đã thêm vào danh sách yêu thích.");
      }
      await mutateWishlist();
    } catch (err: any) {
      toast.error("Thao tác thất bại", err?.message || "Đã có lỗi xảy ra");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-soft hover:shadow-hover border border-gray-100 overflow-hidden flex flex-col justify-between group transition-all duration-300 transform hover:-translate-y-1 relative">
        {/* Wishlist Heart Icon Button at Top-Right */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-3 right-3 z-10 w-9 h-9 bg-white/95 hover:bg-white backdrop-blur-sm rounded-full flex items-center justify-center shadow-md border border-gray-100/50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title={isWishlisted ? "Xóa khỏi danh sách yêu thích" : "Thêm vào danh sách yêu thích"}
        >
          <Heart
            className={`w-4.5 h-4.5 transition-colors ${
              isWishlisted ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-500"
            }`}
          />
        </button>

        {/* Thumbnail image */}
        <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
          <img
            src={course.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600"}
            alt={course.title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {course.level && (
            <span className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">
              {course.level}
            </span>
          )}
        </div>

        {/* Course Info */}
        <div className="p-6 flex-grow space-y-4 flex flex-col justify-between">
          <div>
            {/* Category Label */}
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">
              {course.categories && course.categories.length > 0
                ? course.categories[0].name
                : "Khóa học"}
            </span>
            <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mt-1 hover:text-primary transition-colors">
              <Link href={`/courses/${course.slug}`}>{course.title}</Link>
            </h3>
            <p className="text-sm text-gray-500 line-clamp-2 mt-2 leading-relaxed">
              {course.shortDescription}
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-50">
            {/* Rating & Enrolled count */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                <span className="font-bold text-gray-800">
                  {course.avgRating || 4.7}
                </span>
                <span>({course.totalStudents || 120} học viên)</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    if (course.instructorPublicId) {
                      setIsProfileModalOpen(true);
                    }
                  }}
                  className={`line-clamp-1 ${course.instructorPublicId ? "hover:text-primary hover:underline transition-colors" : ""}`}
                >
                  {course.instructorName || "Giảng viên St3pLearn"}
                </button>
              </div>
            </div>

            {/* Price and Details button */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-lg font-extrabold text-primary">
                {course.price > 0 ? formatPrice(course.price) : "Miễn Phí"}
              </span>
              <Link
                href={`/courses/${course.slug}`}
                className="text-xs font-bold text-primary group-hover:text-primary-container flex items-center gap-1 group-hover:translate-x-1 transition-all cursor-pointer"
              >
                Chi tiết <span className="text-sm">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <PublicUserProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        publicId={course.instructorPublicId}
      />
    </>
  );
}
