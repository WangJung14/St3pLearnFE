# Design.md - Thiết kế triển khai Frontend St3p-Learn

## 1. Mục tiêu tài liệu

Tài liệu này mô tả thiết kế tổng thể cho phần Frontend của hệ thống **St3p-Learn** dựa trên tài liệu API Backend hiện có.

Frontend cần phục vụ 4 nhóm người dùng chính:

- **Student**: tìm khóa học, xem chi tiết, ghi danh, học bài, theo dõi tiến độ, đánh giá, wishlist.
- **Teacher**: tạo khóa học, quản lý chapter/lesson, upload nội dung, gửi duyệt, publish khóa học.
- **Admin**: quản lý danh mục/tag, duyệt khóa học, xử lý nội dung, xem các luồng quản trị.
- **Mentor**: theo dõi học viên, gửi feedback, hỗ trợ học tập. Phần này có thể làm sau vì API hiện tại chưa đầy đủ.

Mục tiêu ưu tiên của FE là làm được luồng end-to-end cốt lõi:

1. Đăng ký / đăng nhập / logout.
2. Trang chủ hiển thị danh sách khóa học public.
3. Trang chi tiết khóa học bằng slug.
4. Student enroll khóa học và xem nội dung học.
5. Teacher tạo khóa học, chapter, lesson, upload video qua Cloudinary signature.
6. Teacher submit khóa học cho Admin duyệt.
7. Admin duyệt hoặc từ chối khóa học.
8. Teacher publish khóa học.
9. Wishlist, review, reply review.
10. Dashboard tối thiểu cho từng role.

---

## 2. Stack FE thực tế

```txt
Next.js 14 (App Router)
TypeScript
Tailwind CSS v4
SWR (server state / data fetching)
React Context API (client state: auth/session)
Native fetch (HTTP client)
shadcn/ui + Lucide React (UI components)
```

> **Ghi chú stack:**
> - Dùng **Next.js App Router** thay vì Vite + React Router DOM.
> - Dùng **SWR** thay vì TanStack Query.
> - Dùng **React Context** (`AuthContext`) thay vì Zustand.
> - Dùng **native fetch** thay vì Axios. Auth header được gắn thủ công trong mỗi request cần auth.
> - Form dùng **native React state**, chưa tích hợp React Hook Form + Zod.

---

## 3. Kiến trúc thư mục FE (Next.js App Router)

```txt
FE/
├── app/                               # Next.js App Router — Pages & Routes
│   ├── layout.tsx                     # Root layout (AuthProvider wrap ở đây)
│   ├── page.tsx                       # Trang chủ (Landing page)
│   ├── globals.css
│   │
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   ├── pricing/
│   │   └── page.tsx
│   │
│   ├── courses/
│   │   ├── page.tsx                   # Danh sách + tìm kiếm khóa học
│   │   └── [slug]/
│   │       └── page.tsx               # Chi tiết khóa học
│   │
│   ├── chat/
│   │   └── page.tsx
│   ├── forum/
│   │   └── page.tsx
│   │
│   ├── dashboard/
│   │   ├── page.tsx                   # Entry point — redirect theo role
│   │   │
│   │   ├── student/
│   │   │   ├── certificates/
│   │   │   │   └── page.tsx
│   │   │   ├── vocabulary/
│   │   │   │   └── page.tsx
│   │   │   ├── quiz/
│   │   │   │   └── [lessonId]/
│   │   │   │       └── page.tsx
│   │   │   └── player/
│   │   │       └── [slug]/
│   │   │           └── page.tsx       # Video player / Lesson viewer
│   │   │
│   │   └── teacher/
│   │       └── courses/
│   │           ├── new/
│   │           │   └── page.tsx       # Tạo khóa học mới
│   │           └── [courseId]/
│   │               └── curriculum/
│   │                   └── page.tsx   # Quản lý chapter/lesson
│   │
│   └── api/                           # Next.js Route Handlers
│       └── stats/
│
├── components/                        # React components dùng chung
│   ├── header.tsx                     # Navbar public
│   ├── footer.tsx
│   ├── hero.tsx
│   ├── stats.tsx
│   │
│   ├── courses/                       # Course-specific components
│   │   ├── CourseCard.tsx
│   │   ├── CourseCheckoutCard.tsx
│   │   ├── ChapterAccordion.tsx
│   │   ├── FilterBar.tsx
│   │   └── VideoModal.tsx
│   │
│   ├── dashboard/                     # Dashboard components theo role
│   │   ├── AdminDashboard.tsx
│   │   ├── TeacherDashboard.tsx
│   │   ├── StudentDashboard.tsx
│   │   ├── MentorDashboard.tsx
│   │   ├── OverviewTab.tsx
│   │   ├── ProfileHeader.tsx
│   │   └── EditProfileTab.tsx
│   │
│   └── ui/                            # Primitive UI components
│       ├── button.tsx
│       ├── Avatar.tsx
│       ├── Badge.tsx
│       ├── Card.tsx
│       ├── DataGrid.tsx
│       ├── Drawer.tsx
│       ├── EmptyState.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Select.tsx
│       ├── Skeleton.tsx
│       ├── Table.tsx
│       └── Tooltip.tsx
│
├── context/
│   └── AuthContext.tsx                # Auth state: token, user, login, logout
│
├── lib/
│   ├── apiConfig.ts                   # API_BASE_URL từ env
│   ├── fetcher.ts                     # SWR fetcher mặc định
│   └── utils.ts                       # cn(), helpers
│
├── public/
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Cấu hình môi trường

Tạo file `.env.local` (copy từ `.env.example`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Trong code:

```ts
// lib/apiConfig.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
```

Không hard-code `http://localhost:8080` trong component.

---

## 5. API Client Design

Dự án dùng **native fetch** thay vì Axios. Mọi API call phải đi qua helper tập trung, không gọi `fetch()` trực tiếp inline trong component.

### 5.1 SWR Fetcher (GET requests)

```ts
// lib/fetcher.ts
export const fetcher = async (url: string, token?: string): Promise<unknown> => {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("An error occurred while fetching data.") as any;
    error.info = await res.json().catch(() => null);
    error.status = res.status;
    throw error;
  }
  return res.json();
};
```

### 5.2 Authenticated mutation helper (POST/DELETE/PUT)

```ts
// lib/apiFetch.ts
export async function apiFetch<T>(
  url: string,
  options: RequestInit & { token?: string }
): Promise<T> {
  const { token, ...init } = options;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers || {}),
  };

  const res = await fetch(`${API_BASE_URL}${url}`, { ...init, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}
```

---

## 6. Auth & Session Design

### 6.1 Token strategy

Dự án dùng **localStorage** để lưu token (phương án demo):

- `st3p_token` — access token
- `st3p_user` — object user đã parse

```ts
// Lưu khi login thành công
localStorage.setItem("st3p_token", accessToken);
localStorage.setItem("st3p_user", JSON.stringify(userData));

// Xóa khi logout
localStorage.removeItem("st3p_token");
localStorage.removeItem("st3p_user");
```

### 6.2 AuthContext

```ts
// context/AuthContext.tsx
interface User {
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  username?: string;
  role?: string; // "STUDENT" | "TEACHER" | "ADMIN" | "MENTOR" | "MODERATOR"
}

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}
```

### 6.3 Auth flow

```txt
Login
  ↓
POST /api/auth/login  { email, password }
  ↓
Nhận accessToken
  ↓
Decode JWT lấy role
  ↓
Lưu token + user vào localStorage
  ↓
Điều hướng theo role:
  ADMIN     → /dashboard/admin
  TEACHER   → /dashboard/teacher
  STUDENT   → /dashboard/student
  MENTOR    → /dashboard/mentor
  MODERATOR → /dashboard/moderator
```

### 6.4 Logout flow

```txt
User click Logout
  ↓
Xóa localStorage (st3p_token, st3p_user)
  ↓
Clear SWR cache: mutate(() => true, undefined, { revalidate: false })
  ↓
Redirect /login
```

### 6.5 Route guard pattern (Next.js)

Vì dùng App Router, guard được thực hiện bằng `useEffect` trong page/component:

```tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function TeacherPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!isLoading && user?.role !== "TEACHER" && user?.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, user, router]);

  // ...
}
```

---

## 7. RBAC Frontend

Role enum:

```ts
export type UserRole = "STUDENT" | "TEACHER" | "ADMIN" | "MENTOR" | "MODERATOR";
```

Mapping route → role:

| Route | Role yêu cầu |
|---|---|
| `/dashboard` | Authenticated, redirect theo role |
| `/dashboard/student/**` | STUDENT, ADMIN |
| `/dashboard/teacher/**` | TEACHER, ADMIN |
| `/dashboard/admin/**` | ADMIN |
| `/dashboard/mentor/**` | MENTOR, ADMIN |
| `/dashboard/moderator/**` | MODERATOR, ADMIN |
| `/courses`, `/courses/:slug` | Public |
| `/login`, `/register` | Guest (chưa login) |

---

## 8. Route Map (Next.js App Router)

```txt
app/
├── page.tsx                               → /  (Landing)
├── login/page.tsx                         → /login
├── register/page.tsx                      → /register
├── pricing/page.tsx                       → /pricing
├── courses/page.tsx                       → /courses
├── courses/[slug]/page.tsx                → /courses/:slug
├── chat/page.tsx                          → /chat
├── forum/page.tsx                         → /forum
├── forum/post/[postId]/page.tsx            → /forum/post/:postId
│
└── dashboard/
    ├── page.tsx                           → /dashboard (role-based entry)
    ├── student/
    │   ├── player/[slug]/page.tsx         → /dashboard/student/player/:slug
    │   ├── quiz/[lessonId]/page.tsx       → /dashboard/student/quiz/:lessonId
    │   ├── certificates/page.tsx          → /dashboard/student/certificates
    │   └── vocabulary/page.tsx            → /dashboard/student/vocabulary
    └── teacher/
        └── courses/
            ├── new/page.tsx               → /dashboard/teacher/courses/new
            └── [courseId]/curriculum/     → /dashboard/teacher/courses/:courseId/curriculum
                └── page.tsx
```

---

## 9. Page Design theo nghiệp vụ

### 9.1 Public Home Page (`app/page.tsx`)

- Hero section, features, course showcase (mock), testimonials, pricing, FAQ.
- API dùng: `GET /api/categories`, `GET /api/courses/p/search`
- Có fallback mock data nếu backend offline.

### 9.2 Course Search Page (`app/courses/page.tsx`)

- Search keyword, filter category/level, sort.
- Dùng SWR fetch `GET /api/courses/p/search?keyword=...&categoryId=...&level=...`
- Có offline fallback với `MOCK_COURSES`.

### 9.3 Course Detail Page (`app/courses/[slug]/page.tsx`)

- API: `GET /api/courses/p/{slug}`, `GET /api/courses/{courseId}/chapters`

### 9.4 Student Player (`app/dashboard/student/player/[slug]/page.tsx`)

- Video/audio player, curriculum sidebar.
- API: `GET /api/courses/{courseId}/chapters/{chapterId}/lessons`

### 9.5 Teacher Curriculum Editor (`app/dashboard/teacher/courses/[courseId]/curriculum/page.tsx`)

- CRUD chapter và lesson.
- API: `/api/courses/{courseId}/chapters`, `/api/courses/{courseId}/chapters/{chapterId}/lessons`

### 9.6 Teacher Create Course (`app/dashboard/teacher/courses/new/page.tsx`)

- Form tạo khóa học: title, shortDescription, description, price, level, categoryId.
- API: `POST /api/courses`

---

## 10. UI Component Design

### 10.1 Component nền tảng (`components/ui/`)

```txt
button.tsx
Avatar.tsx
Badge.tsx
Card.tsx
DataGrid.tsx
Drawer.tsx
EmptyState.tsx
Input.tsx
Modal.tsx
Select.tsx
Skeleton.tsx
Table.tsx
Tooltip.tsx
```

### 10.2 Component domain

```txt
components/courses/
├── CourseCard.tsx
├── CourseCheckoutCard.tsx
├── ChapterAccordion.tsx
├── FilterBar.tsx
└── VideoModal.tsx

components/dashboard/
├── AdminDashboard.tsx
├── TeacherDashboard.tsx
├── StudentDashboard.tsx
├── MentorDashboard.tsx
├── OverviewTab.tsx
├── ProfileHeader.tsx
└── EditProfileTab.tsx
```

---

## 11. Data Fetching Strategy

Dùng **SWR** cho GET requests:

```ts
import useSWR from "swr";
import { API_BASE_URL } from "@/lib/apiConfig";

// Không cần auth
const { data, error, isLoading } = useSWR(
  `${API_BASE_URL}/api/courses/p/search?keyword=${keyword}`,
  fetcher
);

// Cần auth — truyền token vào key để SWR re-fetch khi token thay đổi
const { data } = useSWR(
  token ? [`${API_BASE_URL}/api/courses/my-courses`, token] : null,
  ([url, token]) => fetcher(url, token)
);
```

Mutation (POST/DELETE) dùng native fetch trực tiếp trong handler:

```ts
const handleSubmit = async () => {
  const res = await fetch(`${API_BASE_URL}/api/courses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  // handle response...
};
```

Sau mutation thành công: gọi `mutate()` để revalidate SWR cache liên quan.

---

## 12. Error Handling

- **Loading state**: spinner hoặc Skeleton component.
- **Error state**: EmptyState hoặc inline message.
- **Empty state**: EmptyState component.
- **Mutation feedback**: dùng toast toàn hệ thống cho thành công/thất bại.
- **Offline fallback**: nhiều trang có `MOCK_*` data để chạy khi BE offline.

Mapping HTTP status:

| Status | Xử lý |
|---|---|
| `400` | Hiển thị lỗi form inline |
| `401` | Redirect `/login` |
| `403` | Redirect `/dashboard` |
| `404` | Empty/Not found state |
| `500` | Thông báo lỗi hệ thống |

---

## 13. Upload video/audio/pdf cho Lesson

Flow upload qua Cloudinary signature:

```txt
Teacher chọn file
  ↓
FE validate file type/size
  ↓
GET /api/courses/{courseId}/chapters/{chapterId}/lessons/upload-signature
  ↓
Upload trực tiếp file lên Cloudinary bằng signature
  ↓
Nhận secure_url, public_id, duration, format...
  ↓
POST /api/courses/{courseId}/chapters/{chapterId}/lessons/{lessonId}/content
  ↓
Lưu content URL vào lesson
```

FE validate:

- Video: `mp4`, `webm`, `mov`
- Audio: `mp3`, `wav`, `m4a`
- PDF: `application/pdf`

---

## 14. Quy tắc bảo mật FE

- Không log token ra console.
- Không commit `.env` thật.
- Không hard-code secret Cloudinary.
- Không tin role từ localStorage nếu chưa verify `/api/users/me`.
- Sau logout phải clear token + clear SWR cache.
- Upload file phải validate client-side trước, BE vẫn phải validate lại.

---

## 15. Quy tắc code

- Component không quá 200 dòng nếu có thể tách nhỏ.
- Không gọi `fetch()` inline trong JSX/render — chỉ trong handler hoặc SWR key.
- Không dùng `any` nếu có thể viết type.
- Không duplicate business logic giữa page và component.
- Loading/error/empty state phải có đủ trên các page lấy data.

---

## 16. Roadmap triển khai FE

Xem chi tiết tại `docs/07-implementation-roadmap.md`.

### Phase 1 - Setup nền ✅
- Next.js 14 + TypeScript + Tailwind
- AuthContext + localStorage
- API_BASE_URL từ env
- Layout public (Header/Footer)

### Phase 2 - Auth ✅ (gần xong)
- Login/Register page
- AuthContext: login, logout, updateUser
- JWT decode lấy role
- Thiếu: AuthGuard component, refresh token

### Phase 3 - Public Course ✅ (gần xong)
- Home page, Course search, Course detail
- CourseCard, FilterBar, ChapterAccordion
- Enroll mutation đúng endpoint, review list read-only, wishlist button riêng
- ReviewForm cho student gửi đánh giá

### Phase 4 - Student ⚠️ (partial)
- StudentDashboard, Player, Quiz, Certificates, Vocabulary pages
- WishlistPage riêng, Notes/discussion offline, đánh dấu hoàn thành, XP local, fallback enrolled courses
- Thiếu: progress tracking thực và discussion API thật do Backend chưa có endpoint tương ứng

### Phase 5 - Teacher ⚠️ (partial)
- TeacherDashboard, New course form, Curriculum editor
- Taxonomy form, Cloudinary signature upload, submit/publish flow
- Lưu ý: Upload Cloudinary cần `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` trong FE env

### Phase 6 - Admin ✅
- AdminDashboard kết nối API, Category/Tag CRUD
- Approval list/detail, approve/reject form, confirm trước process, invalidate pending approvals

### Phase 7 - Polish ⚠️ (partial)
- Skeleton, EmptyState đã có
- Thiếu: toast system, Zod validation, responsive đồng bộ
