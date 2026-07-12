"use client";

import { use, useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { ArrowLeft, Star, Users, Heart, BookOpen, Loader2, Pencil, Save, Trash2, X } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import ChapterAccordion, { Chapter } from "@/components/courses/ChapterAccordion";
import CourseCheckoutCard, { CourseDetail } from "@/components/courses/CourseCheckoutCard";
import VideoModal from "@/components/courses/VideoModal";
import ReviewForm from "@/components/courses/ReviewForm";
import { API_BASE_URL } from "@/lib/apiConfig";
import { apiFetch } from "@/lib/apiFetch";
import { useToast } from "@/components/ui/Toast";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WishlistItem {
  id: string;
  slug?: string;
  title?: string;
  course?: {
    id?: string;
    slug?: string;
    title?: string;
  };
}

interface Review {
  id: string;
  studentId?: string;
  rating: number;
  reviewText?: string;
  comment?: string;
  authorName?: string;
  authorAvatarUrl?: string;
  createdAt?: string;
}

interface PagePayload<T> {
  content?: T[];
}

interface ApiListResponse<T> {
  data?: T[] | PagePayload<T>;
  content?: T[];
}

function unwrapList<T>(body: ApiListResponse<T>): T[] {
  const payload = body.data ?? body.content ?? [];
  return Array.isArray(payload) ? payload : payload.content ?? [];
}

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
  const [isSaving, setIsSaving] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingReviewText, setEditingReviewText] = useState("");
  const [editingReviewRating, setEditingReviewRating] = useState(5);
  const [reviewActionId, setReviewActionId] = useState<string | null>(null);
  const { token, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const toast = useToast();

  // Fetch course detail from API
  const { data: course, error, isLoading } = useSWR<CourseDetail>(
    `${API_BASE_URL}/api/courses/p/${slug}`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Course not found");
      const body = await res.json() as { data?: CourseDetail };
      return body.data ?? (body as unknown as CourseDetail);
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  // Offline fallback
  let courseData: CourseDetail | undefined = course;
  let isFallback = false;
  if (error || !course) {
    courseData = MOCK_DETAILS[slug] ?? MOCK_DETAILS["ielts-masterclass-step-by-step-7-5"];
    isFallback = true;
  }

  // courseId dùng cho API calls — chỉ dùng UUID thật từ server, không dùng mock id
  // (mock id như "ielts-1" không phải UUID hợp lệ, sẽ gây 500 ở backend)
  const courseId = course?.id;

  // Wishlist
  const { data: wishlistData, mutate: mutateWishlist } = useSWR<WishlistItem[]>(
    token ? `${API_BASE_URL}/api/wishlists` : null,
    (url) =>
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((body: ApiListResponse<WishlistItem>) => unwrapList(body)),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  // Reviews — GET /api/courses/p/{courseId}/reviews
  const {
    data: reviews = [],
    isLoading: reviewsLoading,
    mutate: mutateReviews,
  } = useSWR<Review[]>(
    courseId ? `${API_BASE_URL}/api/courses/p/${courseId}/reviews?page=0&size=10` : null,
    (url) =>
      fetch(url)
        .then((r) => r.json())
        .then((body: ApiListResponse<Review>) => unwrapList(body)),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  // Local enrollment state (backup khi chưa có GET /api/enrollments)
  const [localEnrolled, setLocalEnrolled] = useState<string[]>([]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("st3p_enrolled_local");
      if (saved) setLocalEnrolled(JSON.parse(saved) as string[]);
    } catch {
      // ignore
    }
  }, []);

  const isEnrolled = courseData?.id ? localEnrolled.includes(courseData.id) : false;
  const isInWishlist =
    wishlistData?.some(
      (item: WishlistItem) =>
        item.slug === slug ||
        item.course?.slug === slug ||
        (courseData?.id && (item.id === courseData.id || item.course?.id === courseData.id))
    ) ?? false;

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  // Enroll — POST /api/enrollments (đúng endpoint)
  const handleEnroll = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/courses/${slug}`);
      return;
    }

    if (isEnrolled) {
      document.getElementById("curriculum-section")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (!courseData?.id) return;
    setIsSaving(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/enrollments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseId: courseData.id }),
      });

      const body = await res.json().catch(() => null) as { message?: string } | null;

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Phiên đăng nhập hết hạn", "Vui lòng đăng nhập lại để đăng ký khóa học.");
          router.push(`/login?redirect=/courses/${slug}`);
          return;
        }

        if (res.status === 403) {
          toast.error(
            "Không thể đăng ký khóa học",
            "Chỉ tài khoản học viên mới được đăng ký khóa học."
          );
          return;
        }

        throw new Error(body?.message ?? "Lỗi đăng ký khóa học");
      }

      const updatedLocal = [...localEnrolled, courseData.id];
      setLocalEnrolled(updatedLocal);
      localStorage.setItem("st3p_enrolled_local", JSON.stringify(updatedLocal));

      toast.success("Đăng ký khóa học thành công", "Đang chuyển bạn về dashboard học viên.");
      router.push("/student");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi kết nối server";
      console.warn("Enroll API failed, saving locally:", message);

      // Offline fallback
      const updatedLocal = [...localEnrolled, courseData.id];
      setLocalEnrolled(updatedLocal);
      localStorage.setItem("st3p_enrolled_local", JSON.stringify(updatedLocal));

      toast.warning("Đã lưu đăng ký ở chế độ offline", "Backend chưa phản hồi, dashboard vẫn có dữ liệu demo.");
      router.push("/student");
    } finally {
      setIsSaving(false);
    }
  };

  // Wishlist toggle — POST /api/wishlists/course/{id} hoặc DELETE /api/wishlists/courses/{id}
  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/courses/${slug}`);
      return;
    }

    if (!courseData?.id) return;

    const method = isInWishlist ? "DELETE" : "POST";
    const url = isInWishlist
      ? `${API_BASE_URL}/api/wishlists/courses/${courseData.id}`
      : `${API_BASE_URL}/api/wishlists/course/${courseData.id}`;

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null) as { message?: string } | null;
        throw new Error(body?.message ?? "Lỗi wishlist");
      }

      mutateWishlist();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi kết nối";
      toast.error("Không thể cập nhật wishlist", message);
    }
  };

  const startEditReview = (review: Review) => {
    setEditingReviewId(review.id);
    setEditingReviewText(review.reviewText ?? review.comment ?? "");
    setEditingReviewRating(review.rating);
  };

  const cancelEditReview = () => {
    setEditingReviewId(null);
    setEditingReviewText("");
    setEditingReviewRating(5);
  };

  const handleUpdateReview = async (reviewId: string) => {
    if (!courseId) return;

    const trimmedReview = editingReviewText.trim();
    if (trimmedReview.length < 10) {
      toast.warning("Đánh giá quá ngắn", "Vui lòng viết ít nhất 10 ký tự.");
      return;
    }

    setReviewActionId(reviewId);
    try {
      await apiFetch(`/api/courses/${courseId}/reviews/${reviewId}`, {
        method: "POST",
        body: JSON.stringify({
          rating: editingReviewRating,
          reviewText: trimmedReview,
        }),
      });
      toast.success("Đã cập nhật đánh giá");
      cancelEditReview();
      await mutateReviews();
    } catch (err: unknown) {
      toast.error("Không thể cập nhật đánh giá", err instanceof Error ? err.message : undefined);
    } finally {
      setReviewActionId(null);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!courseId) return;
    const confirmed = window.confirm("Xóa đánh giá này?");
    if (!confirmed) return;

    setReviewActionId(reviewId);
    try {
      await apiFetch(`/api/courses/${courseId}/reviews/${reviewId}`, {
        method: "DELETE",
      });
      toast.success("Đã xóa đánh giá");
      if (editingReviewId === reviewId) cancelEditReview();
      await mutateReviews();
    } catch (err: unknown) {
      toast.error("Không thể xóa đánh giá", err instanceof Error ? err.message : undefined);
    } finally {
      setReviewActionId(null);
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

  const totalChapters = courseData?.curriculum?.length ?? 0;
  const totalLessons =
    courseData?.curriculum?.reduce((sum, ch) => sum + ch.lessons.length, 0) ?? 0;
  const totalDuration =
    courseData?.curriculum?.reduce((sum, ch) => {
      return sum + ch.lessons.reduce((sub, les) => sub + (les.duration ?? 0), 0);
    }, 0) ?? 0;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <Header />

      <main className="flex-grow pb-16">
        {/* Hero banner */}
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

                <div className="flex flex-wrap items-center gap-6 pt-2 text-sm">
                  <div className="flex items-center gap-1 text-amber-300">
                    <Star className="w-5 h-5 fill-current" />
                    <span className="font-bold text-white text-base">
                      {courseData?.avgRating ?? 4.7}
                    </span>
                    <span className="text-white/70">
                      ({courseData?.totalStudents ?? 350} học viên học tập)
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-5 h-5 text-white/70" />
                    <span>
                      Giảng viên: <strong>{courseData?.instructorName ?? "St3pLearn Team"}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left: description, curriculum, reviews */}
            <div className="lg:col-span-2 space-y-10">
              {/* Course description */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-soft">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Giới thiệu khóa học</h2>
                <div className="prose text-gray-600 leading-relaxed max-w-none">
                  {courseData?.description}
                </div>
              </div>

              {/* Curriculum */}
              <div
                id="curriculum-section"
                className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-soft"
              >
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Nội dung chương trình học</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {totalChapters} chương • {totalLessons} bài học • Tổng thời lượng {totalDuration} phút
                    </p>
                  </div>
                </div>

                {courseData && (
                  <ChapterAccordion
                    curriculum={courseData.curriculum}
                    expandedChapters={expandedChapters}
                    toggleChapter={toggleChapter}
                    setActivePreviewVideo={setActivePreviewVideo}
                  />
                )}
              </div>

              {/* Reviews - GET /api/courses/p/{courseId}/reviews */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-soft">
                <div className="mb-6 space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900">Đánh giá từ học viên</h2>
                  {course?.id ? (
                    <ReviewForm
                      courseId={course.id}
                      courseSlug={slug}
                      onSubmitted={() => mutateReviews()}
                    />
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm font-semibold text-gray-500">
                      Form đánh giá chỉ bật khi khóa học được tải từ backend.
                    </div>
                  )}
                </div>

                {reviewsLoading && (
                  <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                    <span>Đang tải đánh giá...</span>
                  </div>
                )}

                {!reviewsLoading && reviews.length === 0 && (
                  <div className="text-center py-10">
                    <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm font-medium">
                      Chưa có đánh giá nào cho khóa học này.
                    </p>
                    <p className="text-gray-300 text-xs mt-1">
                      Hãy là người đầu tiên chia sẻ trải nghiệm!
                    </p>
                  </div>
                )}

                {reviews.length > 0 && (
                  <div className="space-y-5">
                    {reviews.map((review: Review) => {
                      const reviewBody = review.reviewText ?? review.comment;
                      const reviewerName =
                        review.authorName ??
                        (review.studentId ? `Học viên ${review.studentId.slice(0, 8)}` : "Ẩn danh");
                      const isOwnReview = Boolean(user?.id && review.studentId === user.id);
                      const isEditing = editingReviewId === review.id;
                      const isReviewBusy = reviewActionId === review.id;

                      return (
                        <div
                          key={review.id}
                          className="flex gap-4 pb-5 border-b border-gray-50 last:border-0"
                        >
                          <div className="flex-shrink-0">
                            {review.authorAvatarUrl ? (
                              <img
                                src={review.authorAvatarUrl}
                                alt={reviewerName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary font-bold text-sm">
                                {reviewerName[0].toUpperCase()}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900 text-sm">
                                {reviewerName}
                              </span>
                              <div className="flex items-center gap-2">
                                {isOwnReview && !isEditing && (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => startEditReview(review)}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-gray-500 transition hover:text-primary"
                                      title="Sửa đánh giá"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteReview(review.id)}
                                      disabled={isReviewBusy}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                                      title="Xóa đánh giá"
                                    >
                                      {isReviewBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </button>
                                  </div>
                                )}
                                <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3.5 h-3.5 ${
                                      i < review.rating
                                        ? "fill-amber-400 stroke-amber-400"
                                        : "fill-gray-200 stroke-gray-200"
                                    }`}
                                  />
                                ))}
                                </div>
                              </div>
                            </div>
                            {isEditing ? (
                              <div className="mt-3 space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: 5 }).map((_, index) => {
                                    const value = index + 1;
                                    const active = value <= editingReviewRating;
                                    return (
                                      <button
                                        key={value}
                                        type="button"
                                        onClick={() => setEditingReviewRating(value)}
                                        className="rounded-lg p-1 transition hover:bg-white"
                                        title={`${value} sao`}
                                      >
                                        <Star
                                          className={`h-5 w-5 ${
                                            active ? "fill-amber-400 stroke-amber-400" : "fill-gray-200 stroke-gray-200"
                                          }`}
                                        />
                                      </button>
                                    );
                                  })}
                                </div>
                                <textarea
                                  value={editingReviewText}
                                  onChange={(event) => setEditingReviewText(event.target.value)}
                                  rows={3}
                                  disabled={isReviewBusy}
                                  className="w-full resize-none rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={cancelEditReview}
                                    disabled={isReviewBusy}
                                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-xs font-extrabold text-gray-500 hover:bg-white disabled:opacity-60"
                                  >
                                    <X className="h-4 w-4" />
                                    Hủy
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateReview(review.id)}
                                    disabled={isReviewBusy || editingReviewText.trim().length < 10}
                                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-pink-100 disabled:opacity-60"
                                  >
                                    {isReviewBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Lưu
                                  </button>
                                </div>
                              </div>
                            ) : reviewBody && (
                              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                {reviewBody}
                              </p>
                            )}
                            {review.createdAt && (
                              <span className="text-xs text-gray-400 mt-1 block">
                                {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: checkout + wishlist */}
            <div className="lg:col-span-1 space-y-4">
              {courseData && (
                <CourseCheckoutCard
                  courseData={courseData}
                  totalDuration={totalDuration}
                  totalLessons={totalLessons}
                  handleEnroll={handleEnroll}
                  setActivePreviewVideo={setActivePreviewVideo}
                  enrolled={isEnrolled}
                />
              )}

              {/* Wishlist toggle button */}
              <button
                id="wishlist-toggle-btn"
                onClick={handleWishlistToggle}
                disabled={isSaving}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 ${
                  isInWishlist
                    ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                    : "border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary"
                }`}
              >
                <Heart
                  className={`w-4 h-4 transition-all ${
                    isInWishlist ? "fill-red-500 stroke-red-500" : ""
                  }`}
                />
                {isInWishlist ? "Đã thêm vào Wishlist" : "Thêm vào Wishlist"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Video preview modal */}
      <VideoModal
        activePreviewVideo={activePreviewVideo}
        onClose={() => setActivePreviewVideo(null)}
      />

      <Footer />
    </div>
  );
}
