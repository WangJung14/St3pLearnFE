# Agents.md - Quy tắc làm việc cho AI Agent khi triển khai Frontend St3p-Learn

## 1. Vai trò của Agent

Agent đóng vai trò trợ lý kỹ thuật hỗ trợ triển khai Frontend cho hệ thống **St3p-Learn**.

Agent có thể:

- Tạo cấu trúc thư mục FE theo Next.js App Router.
- Sinh component React/TypeScript.
- Viết API service dùng native fetch.
- Viết SWR hook cho data fetching.
- Viết form với native React state.
- Tạo page theo route Next.js App Router.
- Tạo layout dashboard.
- Refactor code.
- Viết checklist test thủ công.
- Viết tài liệu trong `docs/`.

Agent không được tự ý:

- Đổi API endpoint nếu tài liệu Backend đã định nghĩa.
- Thêm nghiệp vụ ngoài phạm vi.
- Hard-code dữ liệu nếu API đã có endpoint.
- Bỏ qua auth/RBAC ở màn hình cần quyền.
- Gộp toàn bộ logic vào một file lớn.
- Commit secret/token/env thật.
- Viết code dùng `any` tràn lan.
- Tự chuyển sang Vite, Zustand, Axios, TanStack Query nếu user chưa yêu cầu.

---

## 2. Context dự án

Tên hệ thống: **St3p-Learn**

Loại hệ thống: E-learning học tiếng Anh.

Backend Base URL mặc định:

```txt
http://localhost:8080
```

Lấy từ biến môi trường:

```txt
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Header xác thực:

```txt
Authorization: Bearer <Token>
```

Các nhóm người dùng:

```txt
STUDENT
TEACHER
ADMIN
MENTOR
MODERATOR
```

Các domain FE chính:

- Auth & User Profile
- Course Catalog & Discovery
- Teacher Course Authoring
- Admin Course Approval
- Enrollment & Learning
- Review & Wishlist
- Category & Tag Management
- Upload Lesson Content

---

## 3. Stack mặc định

Khi user không chỉ định stack khác, Agent dùng:

```txt
Next.js 14 (App Router)
TypeScript
Tailwind CSS v4
SWR (data fetching / server state)
React Context API (auth/session client state)
Native fetch (HTTP client)
shadcn/ui components + Lucide React (icons)
```

Không tự chuyển sang Vite, Vue, Angular, TanStack Query, Zustand, Axios nếu user chưa yêu cầu.

---

## 4. Cấu trúc thư mục bắt buộc

Agent phải ưu tiên cấu trúc sau (Next.js App Router):

```txt
FE/
├── app/                         # Pages & Routes (Next.js App Router)
│   ├── layout.tsx               # Root layout — bọc AuthProvider ở đây
│   ├── page.tsx                 # /  Landing page
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── courses/
│   │   ├── page.tsx             # /courses
│   │   └── [slug]/page.tsx     # /courses/:slug
│   └── dashboard/
│       ├── page.tsx             # /dashboard — entry, redirect theo role
│       ├── student/             # /dashboard/student/**
│       └── teacher/             # /dashboard/teacher/**
│
├── components/
│   ├── header.tsx
│   ├── footer.tsx
│   ├── courses/                 # Course-specific components
│   ├── dashboard/               # Role-specific dashboard components
│   └── ui/                      # Primitive UI components
│
├── context/
│   └── AuthContext.tsx          # Auth state provider
│
└── lib/
    ├── apiConfig.ts             # API_BASE_URL
    ├── fetcher.ts               # SWR fetcher
    └── utils.ts
```

---

## 5. Quy tắc API

Tất cả request phải dùng `API_BASE_URL` từ `@/lib/apiConfig`.

Không viết:

```ts
fetch("http://localhost:8080/api/courses/p/search")
```

Phải viết:

```ts
import { API_BASE_URL } from "@/lib/apiConfig";

fetch(`${API_BASE_URL}/api/courses/p/search`)
```

### 5.1 GET request — dùng SWR

```ts
import useSWR from "swr";
import { API_BASE_URL } from "@/lib/apiConfig";
import { fetcher } from "@/lib/fetcher";

// Public (không cần auth)
const { data, error, isLoading } = useSWR(
  `${API_BASE_URL}/api/courses/p/search?keyword=${keyword}`,
  fetcher
);

// Cần auth — đưa token vào key
const { data } = useSWR(
  token ? `${API_BASE_URL}/api/courses/my-courses` : null,
  (url) => fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
);
```

### 5.2 Mutation (POST/PUT/DELETE) — dùng native fetch trong handler

```ts
const handleCreate = async () => {
  const res = await fetch(`${API_BASE_URL}/api/courses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(body?.message || "Request failed");
  }

  // Revalidate SWR cache sau mutation
  mutate(`${API_BASE_URL}/api/courses/my-courses`);
};
```

Endpoint chính theo tài liệu Backend:

```txt
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout

GET    /api/users/me
POST   /api/users/me
DELETE /api/users/me
GET    /api/users/p/{publicId}
GET    /api/users/me/login-history

GET    /api/categories
POST   /api/categories
PUT    /api/categories/{id}
DELETE /api/categories/{id}

GET    /api/tags
POST   /api/tags
PUT    /api/tags/{id}
DELETE /api/tags/{id}

POST   /api/courses
POST   /api/courses/{courseId}
GET    /api/courses/p/search
GET    /api/courses/p/{slug}
GET    /api/courses/my-courses
POST   /api/courses/{courseId}/taxonomy
DELETE /api/courses/{courseId}/archive

POST   /api/courses/{courseId}/submit
POST   /api/courses/{courseId}/cancel-submit
GET    /api/courses/approvals/pending
GET    /api/courses/approvals/{requestId}
POST   /api/courses/approvals/{requestId}/process
POST   /api/courses/{courseId}/publish

GET    /api/courses/{courseId}/chapters
POST   /api/courses/{courseId}/chapters
GET    /api/courses/{courseId}/chapters/{chapterId}/lessons
POST   /api/courses/{courseId}/chapters/{chapterId}/lessons
POST   /api/courses/{courseId}/chapters/{chapterId}/lessons/{lessonId}
DELETE /api/courses/{courseId}/chapters/{chapterId}/lessons/{lessonId}
GET    /api/courses/{courseId}/chapters/{chapterId}/lessons/upload-signature
POST   /api/courses/{courseId}/chapters/{chapterId}/lessons/{lessonId}/content

GET    /api/courses/p/{courseId}/reviews
POST   /api/courses/{courseId}/reviews
POST   /api/courses/{courseId}/reviews/{reviewId}
DELETE /api/courses/{courseId}/reviews/{reviewId}
POST   /api/courses/{courseId}/reviews/{reviewId}/reply

GET    /api/wishlists
POST   /api/wishlists/course/{courseId}
DELETE /api/wishlists/courses/{courseId}

POST   /api/enrollments
```

Nếu API response chưa rõ, Agent phải tạo type mềm nhưng có comment `// TODO: sync with backend response`.

---

## 6. Quy tắc Auth

Agent phải sử dụng `AuthContext` từ `@/context/AuthContext`:

```ts
import { useAuth } from "@/context/AuthContext";

const { token, isAuthenticated, isLoading, user, login, logout } = useAuth();
```

Auth flow bắt buộc:

```txt
Login
-> POST /api/auth/login
-> nhận accessToken
-> decode JWT lấy role
-> lưu token + user vào localStorage
-> redirect theo role
```

Logout flow bắt buộc:

```txt
logout()
-> xóa localStorage (st3p_token, st3p_user)
-> clear SWR cache
-> redirect /login
```

---

## 7. Quy tắc RBAC (Next.js App Router)

Vì dùng App Router, không có React Router DOM `<Navigate>`. Guard được thực hiện bằng `useEffect`:

```tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function TeacherPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (user?.role !== "TEACHER" && user?.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading || !isAuthenticated) return null;

  return <div>Teacher content...</div>;
}
```

Mapping route → role:

```txt
/dashboard/teacher/**  → TEACHER hoặc ADMIN
/dashboard/student/**  → STUDENT hoặc ADMIN
/dashboard/admin/**    → ADMIN
/dashboard             → bất kỳ role đã login
```

Không chỉ ẩn button bằng CSS. Phải kiểm tra role trước khi render nội dung nhạy cảm.

---

## 8. Quy tắc UI/UX

Mỗi page gọi API phải có:

- Loading state (spinner hoặc Skeleton).
- Error state.
- Empty state nếu dữ liệu rỗng.
- Responsive layout.
- Feedback cho mutation thành công/thất bại (alert hoặc toast).
- Confirm trước hành động nguy hiểm như delete.

Form phải có:

- Label rõ ràng.
- Validation message.
- Disable submit khi đang loading.
- Không submit 2 lần liên tục (dùng state `isSaving`).
- Reset hoặc redirect sau khi thành công.

---

## 9. Quy tắc TypeScript

Không dùng `any` nếu chưa thật sự cần.

Ưu tiên:

```ts
unknown
Record<string, unknown>
Generic type
Union type
```

Ví dụ role:

```ts
export type UserRole = "STUDENT" | "TEACHER" | "ADMIN" | "MENTOR" | "MODERATOR";
```

Ví dụ course status:

```ts
export type CourseStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "PUBLISHED"
  | "ARCHIVED";
```

---

## 10. Quy tắc SWR

Agent phải dùng SWR cho tất cả GET request:

```ts
// Key convention: full URL string
const { data, error, isLoading } = useSWR(
  `${API_BASE_URL}/api/courses/p/search?keyword=${keyword}`,
  fetcher,
  { revalidateOnFocus: false }
);
```

Sau mutation thành công phải gọi `mutate()` để revalidate:

```ts
import { mutate } from "swr";

// Revalidate sau khi tạo/sửa
await mutate(`${API_BASE_URL}/api/courses/my-courses`);

// Global revalidate sau login
mutate(() => true, undefined, { revalidate: true });
```

---

## 11. Quy tắc upload lesson content

Agent phải triển khai đúng flow:

```txt
1. Teacher chọn file.
2. FE validate file type/size.
3. FE gọi upload signature endpoint.
4. FE upload trực tiếp lên Cloudinary.
5. FE lấy secure_url/public_id.
6. FE gọi API cập nhật lesson content.
```

Không upload file qua Backend nếu tài liệu đã quy định upload trực tiếp lên Cloudinary bằng signature.

---

## 12. Quy tắc không bịa dữ liệu

Nếu thiếu thông tin response shape, Agent tạo type tạm:

```ts
export type ApiResponse<T> = {
  data: T;
  message?: string;
  success?: boolean;
};
```

Và comment:

```ts
// TODO: Đồng bộ lại với response thật từ Backend.
```

Không tự khẳng định Backend trả field chắc chắn nếu tài liệu chưa có.

---

## 13. Quy tắc khi tạo page mới (Next.js App Router)

Mỗi page nên theo thứ tự:

1. Tạo file `app/path/page.tsx` với `"use client"` directive.
2. Khai báo type cho data.
3. Dùng `useAuth()` để lấy token nếu cần auth.
4. Dùng `useSWR()` để fetch data.
5. Thêm `useEffect` guard nếu route cần role.
6. Render loading/error/empty state.
7. Render nội dung chính.

Không tạo page bằng dữ liệu mock nếu API đã có endpoint. Mock chỉ dùng làm fallback khi BE offline.

---

## 14. Prompt mẫu cho Agent

### 14.1 Tạo page mới

```txt
Dựa trên Agents.md và Design.md, tạo page /dashboard/student/wishlist.
Dùng Next.js App Router (app/dashboard/student/wishlist/page.tsx).
Lấy data từ GET /api/wishlists với token từ useAuth().
Có loading state, error state, empty state.
Mutation remove wishlist dùng DELETE /api/wishlists/courses/{courseId}.
Sau mutation gọi mutate() revalidate wishlist.
```

### 14.2 Tạo Teacher Curriculum

```txt
Dựa trên Agents.md và Design.md, cải thiện trang curriculum/page.tsx.
Thêm form taxonomy: gắn category và tags qua POST /api/courses/{courseId}/taxonomy.
Thêm nút Submit course: POST /api/courses/{courseId}/submit.
Thêm nút Publish course: POST /api/courses/{courseId}/publish.
Có confirm dialog trước submit/publish.
```

### 14.3 Tạo Admin Approval

```txt
Dựa trên Agents.md và Design.md, tạo trang admin approval.
File: app/dashboard/admin/approvals/page.tsx và [requestId]/page.tsx.
Fetch GET /api/courses/approvals/pending.
Process: POST /api/courses/approvals/{requestId}/process với { action, reviewNote }.
Có confirm dialog trước approve/reject.
Chỉ ADMIN mới được vào.
```

---

## 15. Definition of Done cho Agent

Agent chỉ coi task hoàn thành khi:

- Code compile TypeScript không lỗi.
- Không còn import sai path.
- Page có route đúng trong `app/` directory.
- API dùng `API_BASE_URL` từ `@/lib/apiConfig`.
- Có loading/error/empty state.
- Có guard role nếu route cần login/role (dùng useEffect).
- Có responsive tối thiểu.
- Có type request/response (không dùng `any` bừa bãi).
- Sau mutation có gọi `mutate()` revalidate cache.
- Không hard-code secret hay URL.
- Có ghi chú `// TODO` ở chỗ Backend response chưa chắc chắn.
