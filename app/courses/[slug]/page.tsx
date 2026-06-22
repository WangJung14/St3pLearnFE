"use client";

import { use, useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { ArrowLeft, Star, Users } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import ChapterAccordion, { Chapter } from "@/components/courses/ChapterAccordion";
import CourseCheckoutCard, { CourseDetail } from "@/components/courses/CourseCheckoutCard";
import VideoModal from "@/components/courses/VideoModal";

// Complete Mock Detailed Data for Courses
const MOCK_DETAILS: Record<string, CourseDetail> = {
  "ielts-masterclass-step-by-step-7-5": {
    id: "ielts-1",
    title: "IELTS Masterclass: Step-by-Step 7.5+",
    slug: "ielts-masterclass-step-by-step-7-5",
    shortDescription: "Làm chủ cả 4 kỹ năng Nghe, Nói, Đọc, Viết chuẩn cấu trúc đề thi IELTS mới nhất cùng các chuyên gia hàng đầu.",
    description: "Khóa học IELTS Masterclass được thiết kế toàn diện nhằm trang bị cho bạn kiến thức học thuật cốt lõi và chiến thuật làm bài thực tế. Bạn sẽ được học sâu vào cách viết bài Task 1 và Task 2 mạch lạc, cách trả lời nói trôi chảy tự nhiên, sửa lỗi phát âm thường gặp và tối ưu hóa thời gian trong bài đọc/nghe.",
    thumbnailUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1200",
    price: 1200000,
    level: "IELTS",
    instructorName: "Teacher Tommy",
    avgRating: 4.8,
    totalStudents: 3450,
    curriculum: [
      {
        id: "ielts-ch-1",
        title: "Chương 1: Giới thiệu và Cấu trúc đề thi IELTS mới nhất",
        orderIndex: 1,
        lessons: [
          {
            id: "ielts-les-1",
            title: "Tổng quan cấu trúc bài thi IELTS Academic & General Training",
            orderIndex: 1,
            duration: 12,
            isPreview: true,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          },
          {
            id: "ielts-les-2",
            title: "Tiêu chí chấm điểm 4 kỹ năng và Chiến lược đặt mục tiêu",
            orderIndex: 2,
            duration: 15,
            isPreview: false,
          },
        ],
      },
      {
        id: "ielts-ch-2",
        title: "Chương 2: IELTS Listening & Reading Mastery",
        orderIndex: 2,
        lessons: [
          {
            id: "ielts-les-3",
            title: "Chiến thuật Skimming & Scanning siêu tốc trong Reading",
            orderIndex: 1,
            duration: 20,
            isPreview: true,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
          },
          {
            id: "ielts-les-4",
            title: "Mẹo giải quyết dạng bài Matching Headings & Multiple Choice",
            orderIndex: 2,
            duration: 25,
            isPreview: false,
          },
          {
            id: "ielts-les-5",
            title: "Nghe hiểu từ đồng nghĩa (Synonyms) & Bẫy trong Listening",
            orderIndex: 3,
            duration: 18,
            isPreview: false,
          },
        ],
      },
      {
        id: "ielts-ch-3",
        title: "Chương 3: IELTS Speaking & Writing 7.5+ Focus",
        orderIndex: 3,
        lessons: [
          {
            id: "ielts-les-6",
            title: "Triển khai ý tưởng lưu loát trong Speaking Part 2 & 3",
            orderIndex: 1,
            duration: 30,
            isPreview: true,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
          },
          {
            id: "ielts-les-7",
            title: "Bố cục mạch lạc đạt điểm 7.0+ Coherence & Cohesion trong Writing Task 2",
            orderIndex: 2,
            duration: 45,
            isPreview: false,
          },
        ],
      },
    ],
  },
  "english-grammar-for-beginners-intermediate": {
    id: "grammar-1",
    title: "English Grammar for Beginners & Intermediate",
    slug: "english-grammar-for-beginners-intermediate",
    shortDescription: "Hệ thống hóa toàn bộ các chủ điểm ngữ pháp tiếng Anh cốt lõi từ cơ bản đến trung cấp cực kỳ dễ hiểu trong 30 ngày.",
    description: "Ngữ pháp luôn là nền tảng quan trọng nhất để phát triển mọi kỹ năng khác. Khóa học này hệ thống hóa 12 thì tiếng Anh quan trọng nhất, các cấu trúc câu phức, mệnh đề quan hệ và cách dùng giới từ chính xác. Bài học ngắn gọn, dễ tiếp thu và kèm bài tập áp dụng thực hành ngay.",
    thumbnailUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1200",
    price: 500000,
    level: "B1",
    instructorName: "Teacher Sarah",
    avgRating: 4.6,
    totalStudents: 8900,
    curriculum: [
      {
        id: "gram-ch-1",
        title: "Chương 1: Các Thì Tiếng Anh Cơ Bản (Tenses)",
        orderIndex: 1,
        lessons: [
          {
            id: "gram-les-1",
            title: "Phân biệt Thì Hiện Tại Đơn & Hiện Tại Tiếp Diễn",
            orderIndex: 1,
            duration: 15,
            isPreview: true,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          },
          {
            id: "gram-les-2",
            title: "Thì Quá Khứ Đơn & Quá Khứ Tiếp Diễn - Cách dùng phối hợp",
            orderIndex: 2,
            duration: 18,
            isPreview: false,
          },
        ],
      },
      {
        id: "gram-ch-2",
        title: "Chương 2: Cấu Trúc Câu Phức & Câu Ghép",
        orderIndex: 2,
        lessons: [
          {
            id: "gram-les-3",
            title: "Mệnh đề quan hệ xác định và không xác định (Relative Clauses)",
            orderIndex: 1,
            duration: 22,
            isPreview: true,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
          },
          {
            id: "gram-les-4",
            title: "Câu điều kiện Loại 1, 2, 3 và dạng hỗn hợp",
            orderIndex: 2,
            duration: 25,
            isPreview: false,
          },
        ],
      },
    ],
  },
  "listening-pronunciation-secrets": {
    id: "listening-1",
    title: "Listening & Pronunciation Secrets",
    slug: "listening-pronunciation-secrets",
    shortDescription: "Bí quyết nghe hiểu người bản xứ dễ dàng, sửa giọng nói chuẩn Mỹ và làm chủ ngữ điệu nói tự nhiên.",
    description: "Tại sao bạn học nhiều năm nhưng vẫn không nghe hiểu được người bản xứ nói gì? Khóa học này sẽ vén bức màn bí mật về hiện tượng nối âm, nuốt âm, biến âm và ngữ điệu lên xuống của tiếng Anh đời thường. Học xong bạn sẽ nghe tiếng Anh dễ chịu và nói tự tin hơn.",
    thumbnailUrl: "https://images.unsplash.com/photo-1522881197277-c6cf5246ca88?q=80&w=1200",
    price: 750000,
    level: "A2",
    instructorName: "Teacher Alex",
    avgRating: 4.7,
    totalStudents: 1820,
    curriculum: [
      {
        id: "list-ch-1",
        title: "Chương 1: Phát Âm Chuẩn Bảng Phiên Âm Quốc Tế IPA",
        orderIndex: 1,
        lessons: [
          {
            id: "list-les-1",
            title: "Cách phát âm các nguyên âm đơn và nguyên âm đôi cốt lõi",
            orderIndex: 1,
            duration: 25,
            isPreview: true,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          },
          {
            id: "list-les-2",
            title: "Cặp phụ âm rung và phụ âm vô thanh thường nhầm lẫn",
            orderIndex: 2,
            duration: 20,
            isPreview: false,
          },
        ],
      },
      {
        id: "list-ch-2",
        title: "Chương 2: Hiện Tượng Âm Thanh Trong Giao Tiếp (Phát âm nâng cao)",
        orderIndex: 2,
        lessons: [
          {
            id: "list-les-3",
            title: "Quy tắc Nối âm (Liaison) & Nuốt âm (Elision) chuẩn Mỹ",
            orderIndex: 1,
            duration: 18,
            isPreview: true,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
          },
          {
            id: "list-les-4",
            title: "Trọng âm từ và trọng âm câu giúp nói tiếng Anh có nhạc điệu",
            orderIndex: 2,
            duration: 22,
            isPreview: false,
          },
        ],
      },
    ],
  },
  "vocabulary-boost-3000-academic-words": {
    id: "vocabulary-1",
    title: "Vocabulary Boost: 3000 Academic Words",
    slug: "vocabulary-boost-3000-academic-words",
    shortDescription: "Tăng tốc nâng cấp vốn từ vựng học thuật theo ngữ cảnh giúp bạn viết và nói tiếng Anh học thuật trôi chảy.",
    description: "Khóa học xây dựng vốn từ vựng của bạn theo 15 chủ đề xã hội phổ biến trong môi trường học thuật và công việc. Bạn sẽ không học vẹt từ đơn lẻ mà học qua ngữ cảnh, collocation, từ đồng nghĩa và từ trái nghĩa giúp nhớ lâu sâu sắc.",
    thumbnailUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1200",
    price: 600000,
    level: "B2",
    instructorName: "Teacher Jane",
    avgRating: 4.9,
    totalStudents: 4230,
    curriculum: [
      {
        id: "voc-ch-1",
        title: "Chương 1: Từ Vựng Chủ Điểm Education & Technology",
        orderIndex: 1,
        lessons: [
          {
            id: "voc-les-1",
            title: "Collocations đắt giá cho chủ đề Giáo dục",
            orderIndex: 1,
            duration: 18,
            isPreview: true,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          },
          {
            id: "voc-les-2",
            title: "Từ vựng thảo luận về Trí Tuệ Nhân Tạo & Đổi mới Công nghệ",
            orderIndex: 2,
            duration: 20,
            isPreview: false,
          },
        ],
      },
    ],
  },
  "toeic-800-target-prep": {
    id: "toeic-1",
    title: "TOEIC 800+ Target Comprehensive Prep",
    slug: "toeic-800-target-prep",
    shortDescription: "Lộ trình ôn luyện giải đề thi TOEIC tối ưu nhất, ôn trọng tâm mẹo làm bài đọc hiểu và nghe hiểu.",
    description: "Khóa học bám sát cấu trúc đề thi TOEIC format mới nhất. Chúng tôi phân tích cấu trúc 7 phần thi, tập trung bổ sung 600 từ vựng TOEIC cốt lõi, nâng cao ngữ pháp chọn lọc và cung cấp bộ đề thi thử độc quyền kèm đáp án giải thích chi tiết.",
    thumbnailUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1200",
    price: 950000,
    level: "TOEIC",
    instructorName: "Teacher Mark",
    avgRating: 4.5,
    totalStudents: 2900,
    curriculum: [
      {
        id: "toeic-ch-1",
        title: "Chương 1: Chinh Phục TOEIC Listening (Part 1 - 4)",
        orderIndex: 1,
        lessons: [
          {
            id: "toeic-les-1",
            title: "Part 1 & 2: Tránh bẫy đồng âm và câu hỏi thông tin gián tiếp",
            orderIndex: 1,
            duration: 20,
            isPreview: true,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          },
          {
            id: "toeic-les-2",
            title: "Part 3 & 4: Kỹ thuật phân tích trước câu hỏi & biểu đồ hình ảnh",
            orderIndex: 2,
            duration: 25,
            isPreview: false,
          },
        ],
      },
    ],
  },
  "academic-writing-excellence": {
    id: "writing-1",
    title: "Academic Writing Excellence for Essays",
    slug: "academic-writing-excellence",
    shortDescription: "Rèn luyện tư duy viết luận mạch lạc, sử dụng các liên từ nối và cấu trúc học thuật nâng cao đạt điểm cao.",
    description: "Academic Writing là rào cản lớn nhất của nhiều người học tiếng Anh. Khóa học này hướng dẫn chi tiết cách viết đoạn mở bài ấn tượng, phát triển luận điểm thuyết phục trong thân bài và đúc kết ngắn gọn ở kết bài. Phù hợp cho ôn thi đại học và chứng chỉ quốc tế.",
    thumbnailUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1200",
    price: 1100000,
    level: "C1",
    instructorName: "Teacher Emma",
    avgRating: 4.7,
    totalStudents: 1250,
    curriculum: [
      {
        id: "writ-ch-1",
        title: "Chương 1: Xây Dựng Câu Và Đoạn Văn Học Thuật",
        orderIndex: 1,
        lessons: [
          {
            id: "writ-les-1",
            title: "Cấu trúc một câu học thuật chuẩn chỉnh & Tránh lỗi run-on",
            orderIndex: 1,
            duration: 22,
            isPreview: true,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          },
          {
            id: "writ-les-2",
            title: "Cách tổ chức một đoạn văn theo mô hình T.E.E.L",
            orderIndex: 2,
            duration: 25,
            isPreview: false,
          },
        ],
      },
    ],
  },
};

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [activePreviewVideo, setActivePreviewVideo] = useState<string | null>(null);
  const { token, isAuthenticated } = useAuth();
  const router = useRouter();

  // lay chi tiet khoa hoc tu api nha
  const { data: course, error, isLoading } = useSWR<CourseDetail>(
    `http://localhost:8080/api/courses/p/${slug}`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Course not found in backend");
      const body = await res.json();
      return body.data;
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  // lay danh sach wishlist cua ong hoc vien tu be
  const { data: wishlistResponse, mutate: mutateWishlist } = useSWR(
    token ? ["http://localhost:8080/api/wishlists", token] : null,
    async ([url, t]) => {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${t}`,
        },
      });
      if (!res.ok) throw new Error("Fetch wishlist failed");
      const body = await res.json();
      return body.data;
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  // backup dang ky offline phong ho BE loi
  const [localEnrolled, setLocalEnrolled] = useState<string[]>([]);
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem("st3p_enrolled_local");
      if (saved) {
        setLocalEnrolled(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Loi doc localstorage", e);
    }
  }, []);

  // check xem ong nay dang ky khoa nay chua
  let courseData = course;
  let isFallback = false;

  if (error || !course) {
    courseData = MOCK_DETAILS[slug] || MOCK_DETAILS["ielts-masterclass-step-by-step-7-5"];
    isFallback = true;
  }

  const isEnrolledInWishlist = wishlistResponse?.content?.some(
    (item: any) => item.slug === slug || (courseData?.id && item.id === courseData.id)
  ) || false;

  const isEnrolledInLocal = courseData?.id ? localEnrolled.includes(courseData.id) : false;
  const enrolled = isEnrolledInWishlist || isEnrolledInLocal;

  // xu ly click dang ky hoc
  const handleEnroll = async () => {
    if (!isAuthenticated) {
      // chua login thi bay sang trang login lien
      router.push(`/login?redirect=/courses/${slug}`);
      return;
    }

    if (enrolled) {
      // neu dang ky roi thi cuon xuong chuong trinh hoc de xem luon
      const el = document.getElementById("curriculum-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }

    if (!courseData?.id) return;

    try {
      const res = await fetch(`http://localhost:8080/api/wishlists/course/${courseData.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(body?.message || "Loi goi API dang ky");
      }

      alert("Đăng ký khóa học thành công!");

      // dong bo local luon cho chac
      const updatedLocal = [...localEnrolled, courseData.id];
      setLocalEnrolled(updatedLocal);
      localStorage.setItem("st3p_enrolled_local", JSON.stringify(updatedLocal));

      mutateWishlist();
      router.push("/dashboard");
    } catch (err: any) {
      console.warn("API error, saving to local instead: ", err.message);
      // fallback luu local cho nguoi dung test muot ma
      const updatedLocal = [...localEnrolled, courseData.id];
      setLocalEnrolled(updatedLocal);
      localStorage.setItem("st3p_enrolled_local", JSON.stringify(updatedLocal));

      alert("Đăng ký khóa học thành công (Offline Mode)!");
      router.push("/dashboard");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <div className="flex-grow flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  // dem so luong chuong, bai hoc va thoi gian
  const totalChapters = courseData?.curriculum?.length || 0;
  const totalLessons = courseData?.curriculum?.reduce((sum, ch) => sum + ch.lessons.length, 0) || 0;
  const totalDuration = courseData?.curriculum?.reduce((sum, ch) => {
    return sum + ch.lessons.reduce((sub, les) => sub + (les.duration || 0), 0);
  }, 0) || 0;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <Header />

      <main className="flex-grow pb-16">
        {/* banner khoa hoc */}
        <div className="bg-primary text-white py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-4 text-white/80 text-sm">
              <Link href="/courses" className="hover:text-white flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Khóa học
              </Link>
              <span>/</span>
              <span className="text-white font-medium line-clamp-1">{courseData?.title}</span>
            </div>

            {isFallback && (
              <div className="inline-block bg-white/10 text-white border border-white/20 text-xs px-3 py-1 rounded-full mb-4">
                💡 Bản xem thử - Offline Fallback Data
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <span className="bg-white/20 text-white font-bold text-xs uppercase px-2.5 py-1 rounded-lg">
                  Trình độ {courseData?.level}
                </span>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                  {courseData?.title}
                </h1>
                <p className="text-lg text-white/80 leading-relaxed max-w-4xl">
                  {courseData?.shortDescription}
                </p>

                {/* Rating & Stats */}
                <div className="flex flex-wrap items-center gap-6 pt-2 text-sm">
                  <div className="flex items-center gap-1 text-amber-300">
                    <Star className="w-5 h-5 fill-current" />
                    <span className="font-bold text-white text-base">
                      {courseData?.avgRating || 4.7}
                    </span>
                    <span className="text-white/70">
                      ({courseData?.totalStudents || 350} học viên học tập)
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-5 h-5 text-white/70" />
                    <span>Giảng viên: <strong>{courseData?.instructorName || "St3pLearn Team"}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* thong tin chi tiet khoa hoc */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* phan ben trai: mo ta va chuong hoc */}
            <div className="lg:col-span-2 space-y-10">
              {/* mo ta khoa hoc */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-soft">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Giới thiệu khóa học</h2>
                <div className="prose text-gray-600 leading-relaxed max-w-none">
                  {courseData?.description}
                </div>
              </div>

              {/* danh sach chuong/bai hoc */}
              <div id="curriculum-section" className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-soft">
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Nội dung chương trình học</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {totalChapters} chương • {totalLessons} bài học • Tổng thời lượng {totalDuration} phút
                    </p>
                  </div>
                </div>

                {/* accordion cac chuong hoc */}
                {courseData && (
                  <ChapterAccordion
                    curriculum={courseData.curriculum}
                    expandedChapters={expandedChapters}
                    toggleChapter={toggleChapter}
                    setActivePreviewVideo={setActivePreviewVideo}
                  />
                )}
              </div>
            </div>

            {/* cot ben phai: dang ky hoc */}
            <div className="lg:col-span-1">
              {courseData && (
                <CourseCheckoutCard
                  courseData={courseData}
                  totalDuration={totalDuration}
                  totalLessons={totalLessons}
                  handleEnroll={handleEnroll}
                  setActivePreviewVideo={setActivePreviewVideo}
                  enrolled={enrolled}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* modal phat video xem thu */}
      <VideoModal
        activePreviewVideo={activePreviewVideo}
        onClose={() => setActivePreviewVideo(null)}
      />

      <Footer />
    </div>
  );
}
