"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { BookOpen, Play, Loader2, Compass, Search, Award, CheckCircle2, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/apiConfig";

interface EnrollmentResponseItem {
  id: string;
  studentId: string;
  courseId: string;
  status: string;
  progressPercent: number;
  enrolledAt: string;
}

interface EnrollmentApiResponse {
  data?: {
    content?: EnrollmentResponseItem[];
  } | EnrollmentResponseItem[];
  content?: EnrollmentResponseItem[];
}

interface CourseSummary {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl: string;
}

export default function StudentEnrolledCoursesPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [localEnrolledIds, setLocalEnrolledIds] = useState<string[]>([]);

  // Tải các ID khóa học đã lưu ở local (dự phòng)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("st3p_enrolled_local");
      if (saved) setLocalEnrolledIds(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Tải danh sách khóa học ghi danh từ backend API Gateway
  const { data: enrolledApiData = [], isLoading } = useSWR<EnrollmentResponseItem[]>(
    token ? [`${API_BASE_URL}/api/enrollments/my-courses?page=0&size=100`, token] as const : null,
    async ([url, t]: readonly [string, string]) => {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) return [];
      const body = (await res.json()) as EnrollmentApiResponse;
      const payload = body.data ?? body.content ?? [];
      return Array.isArray(payload) ? payload : (payload.content ?? []);
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const courseIdsToFetch = Array.from(
    new Set([...enrolledApiData.map((e) => e.courseId), ...localEnrolledIds])
  ).filter((id) => uuidRegex.test(id));

  // Tải thông tin vắn tắt các khóa học từ bulk API
  const { data: courseSummaries = [] } = useSWR<CourseSummary[]>(
    courseIdsToFetch.length > 0 ? [`${API_BASE_URL}/api/courses/bulk-summaries`, courseIdsToFetch] as const : null,
    async ([url, ids]: readonly [string, string[]]) => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseIds: ids }),
      });
      if (!res.ok) return [];
      const body = (await res.json()) as { data?: CourseSummary[] };
      return body.data || [];
    }
  );

  // Ghép dữ liệu tiến độ và thông tin khóa học
  const enrolledCourses = courseIdsToFetch.map((id) => {
    const summary = courseSummaries.find((s) => s.id === id);
    const enrollment = enrolledApiData.find((e) => e.courseId === id);
    return {
      id,
      title: summary?.title || "Khóa học đã ghi danh",
      slug: summary?.slug || id,
      thumbnailUrl: summary?.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400",
      progressPercent: enrollment?.progressPercent || 0,
      enrolledAt: enrollment?.enrolledAt || "",
    };
  });

  const filteredCourses = enrolledCourses.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-[600px] max-w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-soft">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" /> Khóa học của tôi
          </h1>
          <p className="text-xs font-bold text-gray-400 mt-1">
            Danh sách tất cả các khóa học bạn đã tham gia đăng ký và ghi danh
          </p>
        </div>
        <button
          onClick={() => router.push("/courses")}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-black text-xs rounded-xl transition-all cursor-pointer shrink-0"
        >
          <Compass className="w-4 h-4" /> Khám phá thêm
        </button>
      </div>

      {/* Tìm kiếm */}
      <div className="relative bg-white p-3 rounded-2xl border border-gray-100 shadow-soft">
        <Search className="w-4 h-4 text-gray-400 absolute left-6 top-5" />
        <input
          type="text"
          placeholder="Tìm kiếm trong danh sách khóa học của bạn..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
        />
      </div>

      {/* Đang tải */}
      {isLoading && (
        <div className="text-center py-12">
          <Loader2 className="w-7 h-7 text-primary animate-spin mx-auto" />
          <p className="text-xs font-bold text-gray-400 mt-2">Đang tải danh sách khóa học...</p>
        </div>
      )}

      {/* Danh sách khóa học */}
      {!isLoading && (
        <div className="space-y-4">
          {filteredCourses.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center space-y-3">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="text-sm font-extrabold text-gray-700">Bạn chưa ghi danh khóa học nào</h3>
              <p className="text-xs font-bold text-gray-400 max-w-xs mx-auto">
                Hãy khám phá các khóa học chất lượng trên St3pLearn và đăng ký ngay để bắt đầu lộ trình học!
              </p>
              <button
                onClick={() => router.push("/courses")}
                className="mt-2 px-6 py-2.5 bg-primary text-white font-black text-xs rounded-xl shadow-md shadow-primary/20 hover:opacity-90 transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                Khám phá khóa học ngay <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white p-5 rounded-3xl border border-gray-100 shadow-soft hover:border-primary/30 transition-all flex flex-col sm:flex-row gap-5 items-center"
              >
                {/* Thumbnail */}
                <div className="relative w-full sm:w-44 h-28 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/10" />
                </div>

                {/* Info */}
                <div className="flex-1 space-y-2.5 w-full">
                  <h3 className="text-base font-black text-gray-900 line-clamp-1">{course.title}</h3>

                  {/* Tiến độ học tập */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-3xs font-extrabold text-gray-500">
                      <span>Tiến độ học</span>
                      <span className="text-primary font-black">{course.progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(course.progressPercent, 5)}%` }}
                      />
                    </div>
                  </div>

                  {/* Nút hành động */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                    <button
                      onClick={() => router.push(`/courses/${course.slug}`)}
                      className="text-xs font-bold text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                      Chi tiết khóa học
                    </button>

                    <button
                      onClick={() => router.push(`/student/player/${course.slug}`)}
                      className="px-5 py-2 bg-primary hover:bg-primary/90 text-white font-black text-xs rounded-xl shadow-md shadow-primary/20 flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Tiếp tục học
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
