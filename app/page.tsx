"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Flame,
  Award,
  Zap,
  ChevronDown,
  ChevronUp,
  Star,
  Check,
  X,
  ArrowRight,
  ShieldCheck,
  Video,
  MessageCircle,
  Sparkles,
  Brain,
  Globe,
  ShieldAlert,
} from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/Avatar";

const SHOWCASE_COURSES = [
  {
    id: "ielts-1",
    title: "IELTS Masterclass: Step-by-Step 7.5+",
    slug: "ielts-masterclass-step-by-step-7-5",
    level: "IELTS",
    rating: 4.8,
    students: 3450,
    price: "1,200,000 đ",
    thumbnail:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=400",
    tags: ["Speaking", "Writing", "IELTS"],
  },
  {
    id: "grammar-1",
    title: "English Grammar for Beginners & Intermediate",
    slug: "english-grammar-for-beginners-intermediate",
    level: "B1",
    rating: 4.6,
    students: 8900,
    price: "500,000 đ",
    thumbnail:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=400",
    tags: ["Grammar", "Foundation"],
  },
  {
    id: "listening-1",
    title: "Listening & Pronunciation Secrets",
    slug: "listening-pronunciation-secrets",
    level: "A2",
    rating: 4.7,
    students: 1820,
    price: "750,000 đ",
    thumbnail:
      "https://images.unsplash.com/photo-1522881197277-c6cf5246ca88?q=80&w=400",
    tags: ["Listening", "Pronunciation"],
  },
];

const TESTIMONIALS = [
  {
    name: "Nguyễn Minh Thư",
    role: "Học viên IELTS 7.5",
    avatar: "M",
    text: "St3pLearn hoàn toàn thay đổi cách mình học tiếng Anh. Lộ trình học thông minh cùng tính năng flashcard lặp lại ngắt quãng giúp mình nhớ từ vựng cực kỳ lâu và sâu sắc.",
  },
  {
    name: "Lê Quốc Anh",
    role: "Kỹ sư phần mềm tại VinGroup",
    avatar: "Q",
    text: "Giao diện distraction-free cực kỳ tập trung, các bài học giao tiếp nói chuẩn Mỹ rất thực tế. Đặc biệt tính năng giả lập luyện phát âm qua mic giúp mình tự tin nói tiếng Anh trôi chảy.",
  },
  {
    name: "Phạm Hồng Vân",
    role: "Học viên khóa Grammar",
    avatar: "H",
    text: "Mình cực kỳ thích tính năng Gamification của hệ thống. Chuỗi Streak giữ lửa học tập hàng ngày kết hợp tích lũy điểm kinh nghiệm XP làm mình cảm thấy học tập vui vẻ như đang chơi game.",
  },
];

const FAQS = [
  {
    q: "Hệ thống St3pLearn hoạt động như thế nào?",
    a: "St3pLearn kết hợp lộ trình học tập chuẩn học thuật quốc tế cùng các tính năng Gamification (chuỗi streaks, XP, huy hiệu) và phương pháp Spaced Repetition giúp học viên tối ưu hóa 200% hiệu suất ghi nhớ từ vựng và luyện tập phát âm trôi chảy.",
  },
  {
    q: "Tính năng Giả lập nói AI có nhận xét chi tiết phát âm không?",
    a: "Có! Ứng dụng tích hợp công nghệ Speech Recognition ghi âm giọng nói của bạn trực tiếp, chuyển đổi thành văn bản, tự động so sánh và chấm điểm độ chính xác phát âm theo phần trăm ngay lập tức để bạn sửa lỗi sai ngữ điệu.",
  },
  {
    q: "Chứng chỉ hoàn thành có thể tải về được không?",
    a: "Tất nhiên! Khi bạn hoàn thành 100% giáo trình khóa học, hệ thống sẽ tự động cấp một chứng nhận số hóa. Bạn có thể in trực tiếp hoặc lưu dưới dạng tệp PDF sắc nét để đính kèm vào hồ sơ CV chuyên nghiệp.",
  },
  {
    q: "Chính sách học thử và hoàn tiền như thế nào?",
    a: "Chúng tôi cung cấp các bài giảng xem thử (Preview lessons) miễn phí ở mọi khóa học để bạn trải nghiệm trực quan trước khi đưa ra quyết định mua. St3pLearn hỗ trợ chính sách hoàn trả học phí trong vòng 7 ngày nếu bạn không hài lòng.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 overflow-x-hidden">
      <Header />

      {/* 1. HERO SECTION (Duolingo + Stripe Style) */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 bg-linear-to-tr from-pink-50/20 via-blue-50/10 to-transparent">
        {/* Glow dots background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-150 h-75 bg-linear-to-r from-primary/10 to-secondary/10 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

        <div className="home-container grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6 text-center lg:text-left">
            <Badge
              variant="default"
              className="px-3 py-1 text-2xs font-extrabold shadow-sm"
            >
              🚀 St3pLearn 2.0 - Kỷ Nguyên Học Tiếng Anh Mới
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-gray-950">
              Làm chủ tiếng Anh học thuật{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                thông minh hơn.
              </span>
            </h1>
            <p className="text-sm md:text-base text-gray-500 home-copy mx-auto lg:mx-0 leading-relaxed font-medium">
              Phương pháp học tập gamification đột phá kết hợp cùng hệ thống
              Spaced Repetition flashcards giúp bạn nhớ lâu 3000 từ vựng và tự
              tin nói chuẩn bản xứ trong 30 ngày.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Button
                onClick={() => router.push("/courses")}
                className="shadow-lg shadow-pink-200 px-8 py-6 text-xs font-black rounded-2xl transition-all transform hover:-translate-y-0.5"
              >
                Bắt đầu học thử ngay
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
              <Button
                onClick={() => router.push("/pricing")}
                variant="outline"
                className="px-8 py-6 text-xs font-black rounded-2xl"
              >
                Xem bảng giá Pro
              </Button>
            </div>
          </div>

          {/* Glowing Mockup Dashboard Area */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full home-mockup aspect-video bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-3xl p-1.5 shadow-2xl border border-pink-100/30">
              <div className="w-full h-full bg-white rounded-[1.25rem] overflow-hidden shadow-inner relative flex flex-col p-4 space-y-3 border border-gray-50">
                {/* Mock header */}
                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                  </div>
                  <div className="flex gap-2 text-3xs font-black text-primary bg-pink-50 px-2.5 py-0.5 rounded-full">
                    <span>🔥 5 Ngày Streak</span>
                  </div>
                </div>
                {/* Mock body */}
                <div className="flex-1 grid grid-cols-3 gap-3 pt-1">
                  <div className="col-span-2 bg-gray-50 rounded-2xl p-3 border border-gray-100/40 space-y-2 flex flex-col justify-between">
                    <span className="text-4xs font-black text-gray-400 uppercase">
                      Khóa đang học
                    </span>
                    <h5 className="font-extrabold text-gray-900 text-3xs leading-snug">
                      IELTS Masterclass 7.5+
                    </h5>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div className="bg-primary w-2/3 h-1 rounded-full"></div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-primary to-primary-container rounded-2xl p-3 text-white flex flex-col justify-between">
                    <span className="text-4xs font-extrabold text-white/70 uppercase">
                      Điểm kinh nghiệm
                    </span>
                    <span className="text-sm font-black block">340 XP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURES SECTION (Linear Style Grid) */}
      <section className="py-20 home-container space-y-12">
        <div className="text-center space-y-3 home-section-copy mx-auto">
          <Badge variant="secondary">Tính năng nổi bật</Badge>
          <h2 className="text-3xl md:text-4xl font-black text-gray-950 tracking-tight">
            Học hiệu quả hơn với công nghệ hỗ trợ tối ưu
          </h2>
          <p className="text-xs md:text-sm text-gray-400 leading-relaxed font-medium">
            Thiết kế bài giảng tập trung cao độ, kết hợp các thuật toán ghi nhớ
            thông minh giúp biến việc học trở thành thói quen say mê hàng ngày.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="hover:shadow-hover duration-300">
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-50 text-primary flex items-center justify-center shadow-inner">
                <Brain className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-gray-900 text-sm">
                Spaced Repetition Flashcards
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Thẻ từ vựng thông minh tự động lặp lại ngắt quãng dựa trên độ
                ghi nhớ của bạn, giúp khắc sâu 3000 từ vựng cốt lõi vào trí nhớ
                dài hạn.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-hover duration-300">
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-secondary flex items-center justify-center shadow-inner">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-gray-900 text-sm">
                Giả lập luyện phát âm AI
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Thu âm và phân tích giọng nói của bạn trực quan thông qua công
                nghệ Speech-to-Text để chấm điểm độ chính xác phát âm từ và câu
                ngay tức khắc.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-hover duration-300">
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center shadow-inner">
                <Video className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-gray-900 text-sm">
                Distraction-Free Player
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Giao diện học tập tối giản chia hai màn hình riêng biệt: Trình
                phát đa phương tiện (Video/Audio/PDF) và khung thảo luận, ghi
                chép ghi nhớ.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 3. LEARNING EXPERIENCE (Duolingo Gamification Style) */}
      <section className="py-16 bg-gray-50/50 border-y border-gray-100">
        <div className="home-container grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left illustration widget */}
          <div className="flex justify-center lg:justify-start">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-6 w-full home-widget space-y-6">
              <h4 className="font-black text-gray-950 text-xs flex items-center gap-1">
                <Flame className="w-4 h-4 text-primary animate-pulse" />
                Duy trì chuỗi học tập hàng ngày
              </h4>
              <div className="grid grid-cols-7 gap-2 text-center text-3xs font-extrabold text-gray-400">
                <div>
                  <span>T2</span>
                  <span className="w-6 h-6 rounded-full bg-pink-50 text-primary flex items-center justify-center mx-auto mt-1">
                    🔥
                  </span>
                </div>
                <div>
                  <span>T3</span>
                  <span className="w-6 h-6 rounded-full bg-pink-50 text-primary flex items-center justify-center mx-auto mt-1">
                    🔥
                  </span>
                </div>
                <div>
                  <span>T4</span>
                  <span className="w-6 h-6 rounded-full bg-pink-50 text-primary flex items-center justify-center mx-auto mt-1">
                    🔥
                  </span>
                </div>
                <div>
                  <span>T5</span>
                  <span className="w-6 h-6 rounded-full bg-pink-50 text-primary flex items-center justify-center mx-auto mt-1">
                    🔥
                  </span>
                </div>
                <div>
                  <span>T6</span>
                  <span className="w-6 h-6 rounded-full bg-pink-50 text-primary flex items-center justify-center mx-auto mt-1">
                    🔥
                  </span>
                </div>
                <div>
                  <span>T7</span>
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-300 flex items-center justify-center mx-auto mt-1">
                    ?
                  </span>
                </div>
                <div>
                  <span>CN</span>
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-300 flex items-center justify-center mx-auto mt-1">
                    ?
                  </span>
                </div>
              </div>
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-4 text-center border border-pink-100/50">
                <p className="text-3xs font-extrabold text-primary uppercase tracking-wider">
                  Huy hiệu mở khóa
                </p>
                <p className="text-xs font-black text-gray-800 mt-1">
                  Đạt danh hiệu "Chăm Chỉ" 🔥
                </p>
              </div>
            </div>
          </div>

          {/* Right Text */}
          <div className="space-y-6">
            <Badge variant="default">Gamification học tập</Badge>
            <h2 className="text-3xl md:text-4xl font-black text-gray-950 tracking-tight leading-tight">
              Biến việc học ngoại ngữ trở thành thói quen say mê hàng ngày
            </h2>
            <p className="text-xs md:text-sm text-gray-500 leading-relaxed font-medium">
              Không còn cảm giác nhàm chán khi học từ vựng và ngữ pháp. Hệ thống
              streaks giữ lửa, điểm kinh nghiệm XP thăng hạng và bộ sưu tập huy
              hiệu danh giá thúc đẩy bạn mở rộng giới hạn học tập của bản thân
              mỗi ngày.
            </p>
            <div className="flex gap-4">
              <div className="flex items-start gap-2.5 home-mini-copy">
                <span className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
                <p className="text-2xs text-gray-500 leading-relaxed font-medium">
                  Tự đặt mục tiêu học tập hàng ngày linh hoạt theo thời gian
                  biểu của bạn.
                </p>
              </div>
              <div className="flex items-start gap-2.5 home-mini-copy">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary mt-1.5 shrink-0"></span>
                <p className="text-2xs text-gray-500 leading-relaxed font-medium">
                  Theo dõi tiến độ thăng tiến XP và nhận báo cáo tiến trình học
                  tập hàng tuần.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. COURSE SHOWCASE (Udemy/Coursera Style) */}
      <section className="py-20 home-container space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-3">
            <Badge variant="secondary">Thư viện giáo trình</Badge>
            <h2 className="text-3xl md:text-4xl font-black text-gray-950 tracking-tight">
              Lựa chọn khóa học hoàn hảo cho bạn
            </h2>
            <p className="text-xs text-gray-400 home-section-copy leading-relaxed font-medium">
              Tất cả các khóa học được thiết kế tinh gọn bởi đội ngũ giảng viên
              chuyên nghiệp đạt chứng chỉ giảng dạy quốc tế CELTA, TESOL.
            </p>
          </div>
          <Button
            onClick={() => router.push("/courses")}
            variant="outline"
            className="px-6 shrink-0 font-black text-xs rounded-xl"
          >
            Xem tất cả khóa học
          </Button>
        </div>

        {/* Courses grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SHOWCASE_COURSES.map((course) => (
            <Card
              key={course.id}
              onClick={() => router.push(`/courses/${course.slug}`)}
              className="hover:shadow-hover cursor-pointer duration-300 overflow-hidden flex flex-col justify-between h-full"
            >
              <div>
                <div className="w-full aspect-[16/10] overflow-hidden bg-gray-50 relative">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur-sm text-secondary text-4xs font-black uppercase px-2.5 py-1 rounded-lg border border-blue-100 shadow-sm">
                      Level {course.level}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <h4 className="font-extrabold text-gray-900 text-sm leading-snug line-clamp-2">
                    {course.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{course.rating}</span>
                    <span className="text-gray-400 text-3xs font-semibold">
                      ({course.students} học tập)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {course.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-50 text-gray-400 text-4xs font-bold px-2 py-0.5 rounded"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 pt-3 border-t border-gray-50 flex justify-between items-center shrink-0">
                <span className="text-sm font-black text-primary">
                  {course.price}
                </span>
                <span className="text-3xs text-secondary font-black hover:underline flex items-center gap-0.5">
                  Xem chi tiết <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 5. TESTIMONIALS SECTION (Stripe Style Grid) */}
      <section className="py-20 bg-gray-50/50 border-t border-gray-100">
        <div className="home-container space-y-12">
          <div className="text-center space-y-3 home-section-copy mx-auto">
            <Badge variant="default">Cảm nhận học viên</Badge>
            <h2 className="text-3xl md:text-4xl font-black text-gray-950 tracking-tight">
              Nhận xét từ hàng ngàn học viên tốt nghiệp thành công
            </h2>
            <p className="text-xs md:text-sm text-gray-400 leading-relaxed font-medium">
              Khám phá trải nghiệm thực tế từ các học viên đã đạt mục tiêu IELTS
              điểm cao và nâng tầm kỹ năng giao tiếp công việc cùng St3pLearn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, idx) => (
              <Card key={idx} className="hover:shadow-hover duration-300">
                <CardContent className="p-6 space-y-4 flex flex-col justify-between h-full">
                  <p className="text-xs text-gray-600 leading-relaxed italic">
                    "{t.text}"
                  </p>
                  <div className="flex items-center gap-3 pt-3 border-t border-gray-100/60">
                    <Avatar fallback={t.avatar} size="sm" />
                    <div className="min-w-0">
                      <h5 className="font-extrabold text-gray-900 text-xs truncate">
                        {t.name}
                      </h5>
                      <p className="text-4xs text-gray-400 font-bold truncate uppercase tracking-wider">
                        {t.role}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 6. PRICING SECTION (Premium SaaS Tiers) */}
      <section
        id="pricing-section"
        className="py-20 home-container space-y-12"
      >
        <div className="text-center space-y-3 home-section-copy mx-auto">
          <Badge variant="secondary">Bảng giá Pro</Badge>
          <h2 className="text-3xl md:text-4xl font-black text-gray-950 tracking-tight">
            Lựa chọn gói học tập tối ưu cho bạn
          </h2>
          <p className="text-xs md:text-sm text-gray-400 leading-relaxed font-medium">
            Chúng tôi cung cấp các gói tài khoản học tập linh hoạt cho cá nhân
            và tổ chức, hỗ trợ hoàn phí trong vòng 7 ngày.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 home-pricing-grid mx-auto">
          {/* Free Tier */}
          <Card className="hover:shadow-hover duration-300 flex flex-col justify-between h-full">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-1">
                <h4 className="font-extrabold text-gray-900 text-sm">
                  Gói Học Thử (Free)
                </h4>
                <p className="text-4xs text-gray-400 font-bold uppercase tracking-wider">
                  Học thử cơ bản
                </p>
              </div>
              <div className="flex items-baseline text-gray-900">
                <span className="text-3xl font-black tracking-tight">0 đ</span>
                <span className="ml-1 text-xs font-semibold text-gray-400">
                  / vĩnh viễn
                </span>
              </div>
              <div className="w-full h-px bg-gray-50"></div>
              <ul className="space-y-3 text-xs text-gray-500 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Truy cập bài giảng xem thử</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Thẻ từ vựng flashcards cơ bản</span>
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <X className="w-4 h-4 text-gray-300 shrink-0" />
                  <span>Chấm điểm phát âm nói AI</span>
                </li>
              </ul>
            </CardContent>
            <div className="p-6 pt-0 shrink-0">
              <Button
                onClick={() => router.push("/register")}
                variant="outline"
                className="w-full text-xs font-black py-2.5 rounded-xl"
              >
                Đăng ký học thử
              </Button>
            </div>
          </Card>

          {/* Pro Monthly Tier */}
          <Card className="hover:shadow-hover border-primary border-2 duration-300 flex flex-col justify-between h-full relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge
                variant="default"
                className="px-3 py-1 text-2xs font-extrabold shadow-md shadow-pink-100"
              >
                Phổ biến nhất
              </Badge>
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-1">
                <h4 className="font-extrabold text-gray-900 text-sm">
                  Gói Pro Tháng
                </h4>
                <p className="text-4xs text-primary font-black uppercase tracking-wider">
                  Học tập toàn diện
                </p>
              </div>
              <div className="flex items-baseline text-gray-900">
                <span className="text-3xl font-black tracking-tight text-primary">
                  199,000 đ
                </span>
                <span className="ml-1 text-xs font-semibold text-gray-400">
                  / tháng
                </span>
              </div>
              <div className="w-full h-px bg-gray-50"></div>
              <ul className="space-y-3 text-xs text-gray-500 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Học không giới hạn toàn bộ khóa học</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Giả lập luyện phát âm nói AI qua mic</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Xác nhận chứng chỉ số hóa tốt nghiệp</span>
                </li>
              </ul>
            </CardContent>
            <div className="p-6 pt-0 shrink-0">
              <Button
                onClick={() => router.push("/register")}
                className="w-full text-xs font-black py-2.5 rounded-xl shadow-md shadow-pink-200"
              >
                Đăng ký gói Pro Tháng
              </Button>
            </div>
          </Card>

          {/* Pro Yearly Tier */}
          <Card className="hover:shadow-hover duration-300 flex flex-col justify-between h-full">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-1">
                <h4 className="font-extrabold text-gray-900 text-sm">
                  Gói Pro Năm
                </h4>
                <p className="text-4xs text-gray-400 font-bold uppercase tracking-wider">
                  Tiết kiệm 30%
                </p>
              </div>
              <div className="flex items-baseline text-gray-900">
                <span className="text-3xl font-black tracking-tight text-secondary">
                  1,490,000 đ
                </span>
                <span className="ml-1 text-xs font-semibold text-gray-400">
                  / năm
                </span>
              </div>
              <div className="w-full h-px bg-gray-50"></div>
              <ul className="space-y-3 text-xs text-gray-500 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Học trọn đời toàn bộ giáo trình</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Chấm điểm phát âm nói AI không giới hạn</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Cố vấn Mentor nhận xét học tập riêng</span>
                </li>
              </ul>
            </CardContent>
            <div className="p-6 pt-0 shrink-0">
              <Button
                onClick={() => router.push("/register")}
                variant="outline"
                className="w-full text-xs font-black py-2.5 rounded-xl"
              >
                Đăng ký gói Pro Năm
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* 7. FAQ SECTION (Notion Accordion Style) */}
      <section className="py-20 bg-gray-50/50 border-t border-gray-100">
        <div className="home-faq-container space-y-10">
          <div className="text-center space-y-3">
            <Badge variant="default">Giải đáp thắc mắc</Badge>
            <h2 className="text-3xl font-black text-gray-950 tracking-tight">
              Câu hỏi thường gặp
            </h2>
            <p className="text-xs text-gray-400">
              Mọi giải đáp nhanh về khóa học, lộ trình và chính sách thanh toán
              tiện ích.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-gray-200/60 shadow-soft overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left px-6 py-4 flex justify-between items-center font-bold text-xs text-gray-800 hover:text-primary transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-primary" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-2xs text-gray-500 leading-relaxed font-medium">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
