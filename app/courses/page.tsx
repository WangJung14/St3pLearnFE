"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { BookOpen, RefreshCw } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import CourseCard, { Course } from "@/components/courses/CourseCard";
import FilterBar from "@/components/courses/FilterBar";

interface Category {
  id: string;
  name: string;
  slug: string;
}

// Premium Mock Data Fallbacks
const MOCK_COURSES: Course[] = [
  {
    id: "ielts-1",
    title: "IELTS Masterclass: Step-by-Step 7.5+",
    slug: "ielts-masterclass-step-by-step-7-5",
    shortDescription: "Làm chủ cả 4 kỹ năng Nghe, Nói, Đọc, Viết chuẩn cấu trúc đề thi IELTS mới nhất cùng các chuyên gia hàng đầu.",
    thumbnailUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=600&auto=format&fit=crop",
    price: 1200000,
    level: "IELTS",
    avgRating: 4.8,
    totalStudents: 3450,
    instructorName: "Teacher Tommy",
    categories: [{ name: "Speaking" }]
  },
  {
    id: "grammar-1",
    title: "English Grammar for Beginners & Intermediate",
    slug: "english-grammar-for-beginners-intermediate",
    shortDescription: "Hệ thống hóa toàn bộ các chủ điểm ngữ pháp tiếng Anh cốt lõi từ cơ bản đến trung cấp cực kỳ dễ hiểu trong 30 ngày.",
    thumbnailUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=600&auto=format&fit=crop",
    price: 500000,
    level: "B1",
    avgRating: 4.6,
    totalStudents: 8900,
    instructorName: "Teacher Sarah",
    categories: [{ name: "Grammar" }]
  },
  {
    id: "listening-1",
    title: "Listening & Pronunciation Secrets",
    slug: "listening-pronunciation-secrets",
    shortDescription: "Bí quyết nghe hiểu người bản xứ dễ dàng, sửa giọng nói chuẩn Mỹ và làm chủ ngữ điệu nói tự nhiên.",
    thumbnailUrl: "https://images.unsplash.com/photo-1522881197277-c6cf5246ca88?q=80&w=600&auto=format&fit=crop",
    price: 750000,
    level: "A2",
    avgRating: 4.7,
    totalStudents: 1820,
    instructorName: "Teacher Alex",
    categories: [{ name: "Listening" }]
  },
  {
    id: "vocabulary-1",
    title: "Vocabulary Boost: 3000 Academic Words",
    slug: "vocabulary-boost-3000-academic-words",
    shortDescription: "Tăng tốc nâng cấp vốn từ vựng học thuật theo ngữ cảnh giúp bạn viết và nói tiếng Anh học thuật trôi chảy.",
    thumbnailUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=600&auto=format&fit=crop",
    price: 600000,
    level: "B2",
    avgRating: 4.9,
    totalStudents: 4230,
    instructorName: "Teacher Jane",
    categories: [{ name: "Vocabulary" }]
  },
  {
    id: "toeic-1",
    title: "TOEIC 800+ Target Comprehensive Prep",
    slug: "toeic-800-target-prep",
    shortDescription: "Lộ trình ôn luyện giải đề thi TOEIC tối ưu nhất, ôn trọng tâm mẹo làm bài đọc hiểu và nghe hiểu.",
    thumbnailUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=600&auto=format&fit=crop",
    price: 950000,
    level: "TOEIC",
    avgRating: 4.5,
    totalStudents: 2900,
    instructorName: "Teacher Mark",
    categories: [{ name: "Grammar" }]
  },
  {
    id: "writing-1",
    title: "Academic Writing Excellence for Essays",
    slug: "academic-writing-excellence",
    shortDescription: "Rèn luyện tư duy viết luận mạch lạc, sử dụng các liên từ nối và cấu trúc học thuật nâng cao đạt điểm cao.",
    thumbnailUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=600&auto=format&fit=crop",
    price: 1100000,
    level: "C1",
    avgRating: 4.7,
    totalStudents: 1250,
    instructorName: "Teacher Emma",
    categories: [{ name: "Writing" }]
  }
];

const MOCK_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Speaking", slug: "speaking" },
  { id: "cat-2", name: "Listening", slug: "listening" },
  { id: "cat-3", name: "Grammar", slug: "grammar" },
  { id: "cat-4", name: "Vocabulary", slug: "vocabulary" },
  { id: "cat-5", name: "Writing", slug: "writing" }
];

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedLevel, setSelectedLevel] = useState<string>("All");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("DESC");

  // tri hoan tim kiem xiu
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // lay list category tu backend nha
  const { data: catResponse } = useSWR("http://localhost:8080/api/categories", async (url) => {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const body = await res.json();
        return body.data as Category[];
      }
    } catch (e) {
      console.log("Using mock categories (Backend offline)");
    }
    return MOCK_CATEGORIES;
  });

  const categories = catResponse || MOCK_CATEGORIES;

  // build query gui len backend
  const queryParams = new URLSearchParams();
  if (debouncedSearch) queryParams.append("keyword", debouncedSearch);
  if (selectedLevel !== "All") queryParams.append("level", selectedLevel);
  if (selectedCategory !== "All") {
    const matchedCat = categories.find(c => c.name === selectedCategory || c.slug === selectedCategory.toLowerCase());
    if (matchedCat) queryParams.append("categoryId", matchedCat.id);
  }
  queryParams.append("sortBy", sortField);
  queryParams.append("sortDir", sortDirection);

  // lay danh sach course tu backend qua gateway 8080
  const { data: coursesResponse, error: coursesError, isLoading: coursesLoading } = useSWR(
    `http://localhost:8080/api/courses/p/search?${queryParams.toString()}`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("API call failed");
      const body = await res.json();
      return body.data;
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  // neu loi hoac khong co data thi xai mock data nha
  let courses: Course[] = [];
  let isUsingFallback = false;

  if (coursesError || !coursesResponse) {
    isUsingFallback = true;
    courses = MOCK_COURSES.filter((course) => {
      const matchesSearch =
        debouncedSearch === "" ||
        course.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        course.shortDescription.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const matchesCategory =
        selectedCategory === "All" ||
        course.categories?.some(
          (c) => c.name.toLowerCase() === selectedCategory.toLowerCase()
        );

      const matchesLevel =
        selectedLevel === "All" ||
        course.level.toLowerCase() === selectedLevel.toLowerCase();

      return matchesSearch && matchesCategory && matchesLevel;
    });
  } else {
    const content = coursesResponse.content || coursesResponse;
    courses = Array.isArray(content) ? content : [];
  }

  const levelsList = ["All", "A1", "A2", "B1", "B2", "C1", "C2", "IELTS", "TOEIC", "TOEFL"];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <Header />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* tieu de trang */}
        <div className="space-y-4 text-center md:text-left mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Khóa học tiếng Anh của bạn
          </h1>
          <p className="text-lg text-gray-500 max-w-3xl">
            Tìm kiếm những khóa học chuyên nghiệp, lộ trình tinh gọn, giúp bạn nâng tầm trình độ học thuật và thực hành giao tiếp.
          </p>
        </div>

        {/* thanh loc */}
        <FilterBar
          search={search}
          setSearch={setSearch}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedLevel={selectedLevel}
          setSelectedLevel={setSelectedLevel}
          sortField={sortField}
          sortDirection={sortDirection}
          setSortField={setSortField}
          setSortDirection={setSortDirection}
          categories={categories}
          levelsList={levelsList}
        />

        {/* thong bao offline */}
        {isUsingFallback && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center justify-between text-yellow-800 text-sm shadow-sm animate-pulse">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-yellow-600" />
              <span>
                <strong>Offline Mode:</strong> Đang hiển thị dữ liệu khóa học mẫu tuyệt đẹp do máy chủ đang trong trạng thái khởi chạy.
              </span>
            </div>
          </div>
        )}

        {/* danh sach khoa hoc */}
        {coursesLoading ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-soft py-20 px-4 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800">Không tìm thấy khóa học nào</h3>
            <p className="text-gray-500 mt-2">Hãy thử đổi từ khóa tìm kiếm hoặc các bộ lọc của bạn.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
