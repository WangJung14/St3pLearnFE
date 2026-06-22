"use client";

import { useRouter } from "next/navigation";
import { BookOpen, Clock, Award } from "lucide-react";

interface EnrolledCourse {
  title: string;
  slug: string;
  thumbnail: string;
  progress: number;
  lastActive: string;
}

interface OverviewTabProps {
  enrolledCourses: EnrolledCourse[];
}

export default function OverviewTab({ enrolledCourses }: OverviewTabProps) {
  const router = useRouter();

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6 flex items-center gap-4 hover:shadow-hover transition-shadow duration-300">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-2xl font-extrabold text-gray-900">
              {enrolledCourses.length}
            </span>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Khóa học đăng ký
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6 flex items-center gap-4 hover:shadow-hover transition-shadow duration-300">
          <div className="p-3 bg-secondary/10 text-secondary rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-2xl font-extrabold text-gray-900">
              32.5 giờ
            </span>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Thời gian tích lũy
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6 flex items-center gap-4 hover:shadow-hover transition-shadow duration-300">
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-2xl font-extrabold text-gray-900">
              1
            </span>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Chứng chỉ đạt được
            </span>
          </div>
        </div>
      </div>

      {/* Enrolled Courses Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-gray-900">
          Tiến trình học tập
        </h2>
        {enrolledCourses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-8 text-center text-gray-500">
            <p>Bạn chưa tham gia khóa học nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {enrolledCourses.map((course, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5 flex flex-col justify-between gap-4 group hover:shadow-hover transition-all duration-300"
              >
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-100 shadow-inner">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-gray-900 line-clamp-2 text-sm group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <span className="text-xs text-gray-400 block">
                      Hoạt động: {course.lastActive}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-medium">Tiến trình</span>
                    <span className="font-bold text-primary">
                      {course.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => router.push(`/courses/${course.slug}`)}
                    className="bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                  >
                    Học tiếp
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
