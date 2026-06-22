"use client";

import Link from "next/link";
import { Star, Users } from "lucide-react";

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
  categories?: Array<{ name: string }>;
}

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft hover:shadow-hover border border-gray-100 overflow-hidden flex flex-col justify-between group transition-all duration-300 transform hover:-translate-y-1">
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
              <span className="line-clamp-1">{course.instructorName || "Giảng viên St3pLearn"}</span>
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
  );
}
