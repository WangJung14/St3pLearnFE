# 🚀 St3pLearn - Frontend Application

> **Nền tảng Học tiếng Anh & Ôn luyện Chứng chỉ Trực tuyến (Next.js 15 + TypeScript + TailwindCSS)**

---

## 📖 Giới thiệu (Overview)

**St3pLearn Frontend** là ứng dụng giao diện người dùng hiện đại, tốc độ cao được xây dựng trên nền tảng **Next.js (App Router)** và **TypeScript**. Ứng dụng cung cấp trải nghiệm mượt mà, tối ưu trên cả máy tính và thiết bị di động với phân hệ giao diện chuyên biệt cho 3 nhóm người dùng: **Học viên (Student)**, **Giảng viên (Teacher)** và **Quản trị viên (Admin)**.

---

## 🛠 Công nghệ Sử dụng (Tech Stack)

* **Core Framework:** [Next.js 15+](https://nextjs.org/) (App Router, Server & Client Components)
* **UI Library & Styling:** [React 19](https://react.dev/), [TailwindCSS v4](https://tailwindcss.com/), [Lucide React Icons](https://lucide.dev/)
* **State Management & Data Fetching:** [SWR](https://swr.vercel.app/) (Stale-While-Revalidate)
* **Xác thực & Bảo mật:** JWT Token, Role Guards (`STUDENT`, `TEACHER`, `ADMIN`)
* **Utilities:** `clsx`, `tailwind-merge`

---

## ✨ Tính năng Nổi bật (Key Features)

### 👤 1. Phân hệ Học viên (Student Workspace)
* 📚 **Chợ khóa học (`/courses`):** Tìm kiếm, lọc khóa học theo trình độ (A1, A2, B1, B2, C1) và danh mục.
* 🎓 **Khóa học của tôi (`/student/courses`):** Danh sách khóa học đã đăng ký kèm thanh tiến độ hoàn thành `%`.
* 🎥 **Trình phát bài học Đa phương tiện (`/student/player/[slug]`):** Xem Video, Audio, và trình chiếu tài liệu PDF trực tiếp từ Server không qua trung gian.
* 🧠 **Học từ vựng Spaced Repetition (`/student/vocabulary`):** Luyện tập Flashcard ghi nhớ ngắt quãng, tạo bộ từ cá nhân và lưu bộ từ vựng công khai.
* 📝 **Thực hành Bài thi Trắc nghiệm (`/student/exams`):** Làm bài kiểm tra tính giờ của khóa học đã ghi danh, tự động chấm điểm và xem đáp án.
* 💳 **Lịch sử Thanh toán & Hoàn tiền (`/student/payments`):** Xem giao dịch an toàn và gửi yêu cầu hoàn tiền khóa học.

### 👨‍🏫 2. Phân hệ Giảng viên (Teacher Studio)
* 📊 **Tổng quan Studio (`/teacher`):** Thống kê doanh thu, số lượng học viên và các khóa học đang quản lý.
* 📖 **Biên soạn Chương trình học (`/teacher/courses/[courseId]/curriculum`):** Tạo chương, tạo bài học và tải file PDF/Video trực tiếp lên Server.
* 💡 **Ngân hàng câu hỏi & Đề thi (`/teacher/question-banks`, `/teacher/exams`):** Biên soạn câu hỏi trắc nghiệm, tạo đề thi và thiết lập điểm đạt.
* 🏷 **Mã giảm giá (`/teacher/payments`):** Tạo và quản lý các mã giảm giá Coupon cho khóa học.

### 🛡 3. Phân hệ Quản trị (Admin Console)
* 👥 **Quản lý Người dùng (`/admin/users` & `/admin/users/[userId]`):** Xem danh sách tài khoản, chi tiết tiến độ học tập và khóa/mở khóa người dùng.
* 📋 **Duyệt xuất bản Khóa học (`/admin/approvals`):** Kiểm duyệt nội dung khóa học do giảng viên gửi lên trước khi công khai.
* 🏷 **Quản lý Danh mục & Thẻ (`/admin/categories`, `/admin/tags`):** Thêm mới và cấu hình chủ đề học tập.

---

## 📁 Cấu trúc Thư mục (Directory Structure)

```text
FE/
├── app/                        # Next.js App Router (Pages & Routes)
│   ├── (auth)/                 # Đăng ký, Đăng nhập, Quên mật khẩu
│   ├── admin/                  # Quản trị viên (Users, Approvals, Categories, Tags)
│   ├── courses/                # Danh mục & Chi tiết khóa học công khai
│   ├── student/                # Học viên (Courses, Player, Vocabulary, Exams, Payments)
│   ├── teacher/                # Giảng viên (Courses, Curriculum, Question Banks, Exams)
│   ├── layout.tsx              # Root Layout
│   └── page.tsx                # Landing Page
├── components/                 # React Components dùng chung
│   ├── courses/                # Component Khóa học, Lesson Uploader, Player
│   ├── dashboard/              # Sidebar & Header theo Role (RoleDashboardShell)
│   ├── ui/                     # Modal, Toast, Button, Input UI components
│   └── AuthHydrator.tsx        # Đồng bộ trạng thái đăng nhập
├── context/                    # React Context (AuthContext)
├── lib/                        # Endpoints, API Fetcher, Helpers & Types
└── public/                     # Static assets (Images, Icons)
```

---

## ⚡ Hướng dẫn Cài đặt & Khởi chạy (Setup & Installation)

### 1. Yêu cầu hệ thống
* **Node.js:** `>= 18.0.0`
* **npm:** `>= 9.0.0` hoặc **pnpm / yarn**

### 2. Cài đặt Dependencies
```bash
cd FE
npm install
```

### 3. Cấu hình Biến môi trường (`.env.local`)
Tạo file `.env.local` ở thư mục gốc `FE`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

### 4. Chạy Môi trường Phát triển (Dev Mode)
```bash
npm run dev
```
Truy cập giao diện tại: `http://localhost:3000`

---

## 📜 Giấy phép (License)
Dự án thuộc bản quyền của **St3pLearn Team**.
