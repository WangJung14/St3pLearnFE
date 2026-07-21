"use client";

import { PlayCircle, Clock, BookOpen, Award, Globe } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/components/ui/Toast";

import { Chapter } from "./ChapterAccordion";

export interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  thumbnailUrl: string;
  price: number;
  level: string;
  instructorId?: string;
  instructorName?: string;
  instructorPublicId?: string;
  avgRating: number;
  totalStudents: number;
  curriculum: Chapter[];
}

interface CourseCheckoutCardProps {
  courseData: CourseDetail;
  totalDuration: number;
  totalLessons: number;
  handleEnroll: () => void;
  setActivePreviewVideo: (url: string) => void;
  enrolled?: boolean;
}

export default function CourseCheckoutCard({
  courseData,
  totalDuration,
  totalLessons,
  handleEnroll,
  setActivePreviewVideo,
  enrolled = false,
}: CourseCheckoutCardProps) {
  const toast = useToast();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden sticky top-24">
      {/* Media Card Preview */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
        {courseData.thumbnailUrl ? <Image
          src={courseData.thumbnailUrl}
          alt={courseData.title}
          fill
          unoptimized
          className="object-cover"
        /> : <div className="flex h-full w-full items-center justify-center bg-gray-200 text-sm font-bold text-gray-500">Chưa có ảnh khóa học</div>}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <button
            onClick={() => {
              const firstPreview = courseData?.curriculum
                ?.flatMap((c) => c.lessons)
                .find((l) => l.isPreview && l.videoUrl);
              if (firstPreview?.videoUrl) {
                setActivePreviewVideo(firstPreview.videoUrl);
              } else {
                toast.info("Chưa có video xem thử", "Giáo viên chưa bật preview cho khóa học này.");
              }
            }}
            className="bg-white text-primary hover:scale-105 p-4 rounded-full shadow-lg transition-transform cursor-pointer"
          >
            <PlayCircle className="w-8 h-8 fill-current text-primary" />
          </button>
        </div>
      </div>

      {/* Form Info and CTA */}
      <div className="p-6 space-y-6">
        <div>
          <span className="text-sm text-gray-400">Học phí trọn gói</span>
          <div className="text-3xl font-extrabold text-primary mt-1">
            {courseData && courseData.price > 0 ? formatPrice(courseData.price) : "Miễn Phí"}
          </div>
        </div>

        <button
          onClick={handleEnroll}
          className={`w-full font-bold py-3.5 px-4 rounded-xl shadow-md transition-all cursor-pointer text-center ${
            enrolled
              ? "bg-green-600 hover:bg-green-700 text-white shadow-green-600/20"
              : "bg-primary hover:bg-primary/95 text-white shadow-primary/20"
          }`}
        >
          {enrolled ? "Vào Học Ngay" : "Đăng Ký Học Ngay"}
        </button>

        <div className="space-y-4 pt-6 border-t border-gray-100">
          <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Khóa học bao gồm:
          </span>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-500" />
              <span>Tổng thời lượng: <strong>{totalDuration} phút</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-green-500" />
              <span><strong>{totalLessons}</strong> bài giảng chất lượng cao</span>
            </li>
            <li className="flex items-center gap-2">
              <Award className="w-4 h-4 text-green-500" />
              <span>Chứng chỉ hoàn thành từ St3pLearn</span>
            </li>
            <li className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-green-500" />
              <span>Học trực tuyến trên mọi thiết bị</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
