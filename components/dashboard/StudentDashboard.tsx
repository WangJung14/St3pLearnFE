"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { BookOpen, Flame, Award, Zap, ArrowRight, Play, BookOpenCheck, Brain, Compass } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/apiConfig";

interface EnrolledCourse {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  progress: number;
  lastActive: string;
}

interface WishlistCourseItem {
  id: string;
  title?: string;
  slug?: string;
  thumbnailUrl?: string;
  course?: {
    id?: string;
    title?: string;
    slug?: string;
    thumbnailUrl?: string;
  };
}

interface WishlistResponsePayload {
  content?: WishlistCourseItem[];
}

interface WishlistApiResponse {
  data?: WishlistCourseItem[] | WishlistResponsePayload;
  content?: WishlistCourseItem[];
}

const MOCK_RECOMMENDATIONS = [
  {
    id: "listening-1",
    title: "Listening & Pronunciation Secrets",
    slug: "listening-pronunciation-secrets",
    level: "A2",
    rating: 4.7,
    students: 1820,
    thumbnail: "https://images.unsplash.com/photo-1522881197277-c6cf5246ca88?q=80&w=400",
  },
  {
    id: "vocabulary-1",
    title: "Vocabulary Boost: 3000 Academic Words",
    slug: "vocabulary-boost-3000-academic-words",
    level: "B2",
    rating: 4.9,
    students: 4230,
    thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=400",
  }
];

export default function StudentDashboard() {
  const { token } = useAuth();
  const router = useRouter();

  const [localEnrolledIds, setLocalEnrolledIds] = useState<string[]>([]);
  const [streak, setStreak] = useState(5);
  const [xp, setXp] = useState(340);

  // Load enrolled courses from local storage as offline backup
  useEffect(() => {
    try {
      const saved = localStorage.getItem("st3p_enrolled_local");
      if (saved) setLocalEnrolledIds(JSON.parse(saved));
      
      const savedStreak = localStorage.getItem("edu_streak");
      if (savedStreak) setStreak(parseInt(savedStreak));
      else localStorage.setItem("edu_streak", "5");

      const savedXp = localStorage.getItem("edu_xp");
      if (savedXp) setXp(parseInt(savedXp));
      else localStorage.setItem("edu_xp", "340");
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch wishlist (enrolled courses) from backend Gateway
  const { data: wishlistCourses = [] } = useSWR<WishlistCourseItem[]>(
    token ? [`${API_BASE_URL}/api/wishlists`, token] : null,
    async ([url, t]: readonly [string, string]) => {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${t}`,
        },
      });
      if (!res.ok) throw new Error("Fetch wishlist failed");
      const body = (await res.json()) as WishlistApiResponse;
      const payload = body.data ?? body.content ?? [];
      return Array.isArray(payload) ? payload : payload.content ?? [];
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  // Map backend courses
  const apiEnrolled: EnrolledCourse[] = wishlistCourses.map((item) => ({
    id: item.course?.id ?? item.id,
    title: item.course?.title ?? item.title ?? "Khóa học chưa đặt tên",
    slug: item.course?.slug ?? item.slug ?? item.id,
    thumbnail: item.course?.thumbnailUrl ?? item.thumbnailUrl ?? "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=400",
    progress: 35, // Demo progress
    lastActive: "Vừa xong",
  }));

  // Map local storage offline courses if not present in API list
  const localEnrolled: EnrolledCourse[] = [];
  const MOCK_COURSES_DATA = [
    { id: "ielts-1", title: "IELTS Masterclass: Step-by-Step 7.5+", slug: "ielts-masterclass-step-by-step-7-5", thumbnail: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=400" },
    { id: "grammar-1", title: "English Grammar for Beginners & Intermediate", slug: "english-grammar-for-beginners-intermediate", thumbnail: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=400" },
  ];

  localEnrolledIds.forEach((id) => {
    const exists = wishlistCourses.some((item) => (item.course?.id ?? item.id) === id);
    if (!exists) {
      const matched = MOCK_COURSES_DATA.find((c) => c.id === id);
      if (matched) {
        localEnrolled.push({
          id: matched.id,
          title: matched.title,
          slug: matched.slug,
          thumbnail: matched.thumbnail,
          progress: 60,
          lastActive: "Chế độ Offline",
        });
      }
    }
  });

  const enrolledCourses = [...apiEnrolled, ...localEnrolled];

  // Mock data for weekly chart
  const weeklyData = [
    { day: "T2", minutes: 30 },
    { day: "T3", minutes: 45 },
    { day: "T4", minutes: 15 },
    { day: "T5", minutes: 60 },
    { day: "T6", minutes: 40 },
    { day: "T7", minutes: 20 },
    { day: "CN", minutes: 50 },
  ];

  const maxMinutes = 60;

  return (
    <div className="grid grid-cols-1 gap-8 animate-fade-in xl:grid-cols-[minmax(0,1fr)_400px]">
      {/* Cot ben trai: Thong tin khoa hoc, bieu do */}
      <div className="min-w-0 space-y-8">
        {/* Welcome Banner */}
        <div className="relative flex min-w-0 flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl border border-pink-100 bg-gradient-to-r from-primary/10 via-secondary/10 to-transparent p-6 sm:p-8 min-[2400px]:flex-row min-[2400px]:items-center">
          <div className="min-w-[min(100%,18rem)] max-w-2xl flex-1 space-y-2">
            <h2 className="text-2xl font-extrabold text-gray-900">Chào mừng trở lại, bạn học! 👋</h2>
            <p className="max-w-[62ch] text-sm leading-6 text-gray-500">
              Hôm nay là một ngày tuyệt vời để luyện tập kỹ năng nói và nâng cao vốn từ vựng học thuật. Hãy tiếp tục chuỗi học tập nhé!
            </p>
          </div>
          <div className="flex w-full flex-wrap gap-4 sm:w-auto sm:flex-nowrap lg:justify-end">
            <div className="w-[150px] shrink-0 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-center shadow-soft">
              <span className="text-2xs font-extrabold text-gray-400 uppercase block tracking-wider">Daily Streak</span>
              <div className="flex items-center justify-center gap-1 mt-1 text-primary">
                <Flame className="w-5 h-5 fill-current animate-pulse text-primary" />
                <span className="text-xl font-black">{streak} ngày</span>
              </div>
            </div>
            <div className="w-[150px] shrink-0 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-center shadow-soft">
              <span className="text-2xs font-extrabold text-gray-400 uppercase block tracking-wider">Kinh nghiệm XP</span>
              <div className="flex items-center justify-center gap-1 mt-1 text-secondary">
                <Zap className="w-5 h-5 fill-current text-secondary" />
                <span className="text-xl font-black">{xp} XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Courses progress */}
        <div className="space-y-4">
          <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <BookOpenCheck className="w-5 h-5 text-primary" />
            Khóa học đang học ({enrolledCourses.length})
          </h3>

          {enrolledCourses.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-12 text-center space-y-4">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto" />
              <h4 className="font-bold text-gray-700">Chưa đăng ký khóa học nào</h4>
              <p className="text-sm text-gray-400 max-w-sm mx-auto">
                Hãy khám phá thư viện khóa học phong phú của chúng tôi để tìm lộ trình học tập phù hợp nhất với bạn.
              </p>
              <button
                onClick={() => router.push("/courses")}
                className="bg-primary hover:opacity-95 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-md shadow-pink-200 transition-all cursor-pointer"
              >
                Khám phá khóa học
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enrolledCourses.map((course, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-3xl border border-gray-100 shadow-soft hover:shadow-hover p-5 flex flex-col justify-between gap-4 group transition-all duration-300"
                >
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-gray-50 shadow-inner">
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-gray-900 line-clamp-2 text-sm group-hover:text-primary transition-colors">
                        {course.title}
                      </h4>
                      <span className="text-2xs text-gray-400 block font-medium">Hoạt động: {course.lastActive}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-bold">Tiến trình</span>
                      <span className="font-extrabold text-primary">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-50 rounded-full h-2 overflow-hidden shadow-inner border border-gray-100">
                      <div
                        className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => router.push(`/dashboard/student/player/${course.slug}`)}
                      className="bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 text-primary text-xs font-black py-2.5 px-4 rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Vào học</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly chart analytics */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <h4 className="font-extrabold text-gray-900 text-base">Thống kê học tập</h4>
              <p className="text-2xs font-semibold text-gray-400 uppercase tracking-wider">Thời gian học tuần này</p>
            </div>
            <span className="text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-xl border border-gray-100">Tổng: 270 phút</span>
          </div>

          {/* Render Weekly SVG Chart */}
          <div className="flex items-end justify-between h-40 pt-4 px-2">
            {weeklyData.map((data, idx) => {
              const barHeightPercent = (data.minutes / maxMinutes) * 100;
              return (
                <div key={idx} className="flex flex-col items-center gap-2 group flex-1">
                  <div className="relative w-full flex justify-center h-28 items-end">
                    {/* Tooltip on hover */}
                    <span className="absolute -top-6 bg-gray-800 text-white text-3xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none font-bold">
                      {data.minutes} phút
                    </span>
                    <div
                      className="w-8 rounded-t-xl bg-gradient-to-t from-secondary to-primary hover:opacity-90 transition-all duration-500 shadow-sm"
                      style={{ height: `${barHeightPercent}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-bold text-gray-500">{data.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cot ben phai: Gamification Badges, Vocabulary Quick Card, Recommendations */}
      <div className="min-w-0 space-y-8 xl:w-[400px]">
        {/* Achievements Badge Widget */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-6 space-y-4">
          <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400 fill-amber-50" />
            Huy hiệu đạt được
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center text-center p-2 rounded-2xl bg-pink-50/50 border border-pink-100/50">
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-lg shadow-sm">🌱</div>
              <span className="text-3xs font-extrabold text-gray-800 mt-2 block leading-snug">Khởi Đầu</span>
            </div>
            <div className="flex flex-col items-center text-center p-2 rounded-2xl bg-blue-50/50 border border-blue-100/50">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg shadow-sm">🔥</div>
              <span className="text-3xs font-extrabold text-gray-800 mt-2 block leading-snug">Chăm Chỉ</span>
            </div>
            <div className="flex flex-col items-center text-center p-2 rounded-2xl bg-amber-50/50 border border-amber-100/50">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-lg shadow-sm">📚</div>
              <span className="text-3xs font-extrabold text-gray-800 mt-2 block leading-snug">Thông Thái</span>
            </div>
          </div>
        </div>

        {/* Vocabulary Flashcard Widget */}
        <div className="bg-gradient-to-br from-primary to-primary-container text-white rounded-3xl p-6 shadow-lg shadow-pink-200 relative overflow-hidden space-y-4">
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
            <Brain className="w-36 h-36" />
          </div>
          <div className="space-y-1">
            <span className="text-3xs font-extrabold uppercase tracking-widest text-white/75">Học Từ Vựng Hàng Ngày</span>
            <h4 className="text-lg font-black leading-snug">Luyện 3000 từ vựng cốt lõi thông minh</h4>
          </div>
          <p className="text-xs text-white/80 leading-relaxed">
            Sử dụng thẻ ghi nhớ (Flashcards) lặp lại ngắt quãng để ghi nhớ từ vựng học thuật sâu sắc.
          </p>
          <button
            onClick={() => router.push("/dashboard/student/vocabulary")}
            className="bg-white hover:bg-gray-50 text-primary text-xs font-black py-2.5 w-full rounded-2xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Bắt đầu ôn tập</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Course recommendations */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
            <Compass className="w-5 h-5 text-secondary" />
            Gợi ý dành cho bạn
          </h3>

          <div className="space-y-4">
            {MOCK_RECOMMENDATIONS.map((course) => (
              <div
                key={course.id}
                onClick={() => router.push(`/courses/${course.slug}`)}
                className="bg-white rounded-2xl border border-gray-100 shadow-soft hover:shadow-hover p-3 flex gap-3 cursor-pointer group transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-50">
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="space-y-1 min-w-0">
                  <span className="bg-blue-50 text-secondary text-4xs font-black uppercase px-2 py-0.5 rounded">Trình độ {course.level}</span>
                  <h4 className="font-extrabold text-gray-800 text-xs truncate group-hover:text-primary transition-colors">
                    {course.title}
                  </h4>
                  <p className="text-4xs text-gray-400 font-bold">{course.students} học viên học tập</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
