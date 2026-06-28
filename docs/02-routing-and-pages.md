# 02 - Routing and Page URLs

Dự án dùng **Next.js App Router**. Mỗi URL frontend được suy ra từ cấu trúc file trong `FE/app`.

Base URL local:

```txt
http://localhost:3000
```

API backend mặc định:

```txt
http://localhost:8080
```

## 1. Tóm Tắt Route Hiện Tại

| Nhóm | Số route |
|---|---:|
| Public page | 9 |
| Authenticated dashboard entry | 1 |
| Student page | 6 |
| Teacher page | 3 |
| Admin page | 5 |
| Mentor page | 1 |
| Moderator page | 1 |
| Next.js API route handler | 1 |

Tổng page route frontend: **26**.

## 2. Public Pages

| File | Path | Local URL | Ghi chú |
|---|---|---|---|
| `app/page.tsx` | `/` | `http://localhost:3000/` | Landing/Home |
| `app/login/page.tsx` | `/login` | `http://localhost:3000/login` | Guest only, login xong redirect theo role |
| `app/register/page.tsx` | `/register` | `http://localhost:3000/register` | Guest only, register xong về `/login` |
| `app/pricing/page.tsx` | `/pricing` | `http://localhost:3000/pricing` | Pricing/demo payment |
| `app/courses/page.tsx` | `/courses` | `http://localhost:3000/courses` | Tìm kiếm/danh sách khóa học |
| `app/courses/[slug]/page.tsx` | `/courses/:slug` | `http://localhost:3000/courses/ielts-foundation` | Chi tiết khóa học, enroll/wishlist/review |
| `app/chat/page.tsx` | `/chat` | `http://localhost:3000/chat` | Chat page |
| `app/forum/page.tsx` | `/forum` | `http://localhost:3000/forum` | Forum page |
| `app/forum/post/[postId]/page.tsx` | `/forum/post/:postId` | `http://localhost:3000/forum/post/post-3` | Forum post detail mock/local |

## 3. Dashboard Entry

| File | Path | Local URL | Quyền |
|---|---|---|---|
| `app/dashboard/page.tsx` | `/dashboard` | `http://localhost:3000/dashboard` | Cần đăng nhập |

`/dashboard` chỉ là entry point. Page đọc auth state/JWT và redirect về dashboard đúng role:

```txt
STUDENT   -> /dashboard/student
TEACHER   -> /dashboard/teacher
ADMIN     -> /dashboard/admin
MENTOR    -> /dashboard/mentor
MODERATOR -> /dashboard/moderator
```

Nếu chưa đăng nhập, redirect về `/login`.

## 4. Student Pages

Các route trong nhóm này dùng `app/dashboard/student/layout.tsx`, bọc `RoleGuard allow={["STUDENT", "ADMIN"]}` và `RoleDashboardShell role="STUDENT"`.

| File | Path | Local URL | Quyền |
|---|---|---|---|
| `app/dashboard/student/page.tsx` | `/dashboard/student` | `http://localhost:3000/dashboard/student` | STUDENT, ADMIN |
| `app/dashboard/student/wishlist/page.tsx` | `/dashboard/student/wishlist` | `http://localhost:3000/dashboard/student/wishlist` | STUDENT, ADMIN |
| `app/dashboard/student/player/[slug]/page.tsx` | `/dashboard/student/player/:slug` | `http://localhost:3000/dashboard/student/player/ielts-foundation` | STUDENT, ADMIN |
| `app/dashboard/student/quiz/[lessonId]/page.tsx` | `/dashboard/student/quiz/:lessonId` | `http://localhost:3000/dashboard/student/quiz/1` | STUDENT, ADMIN |
| `app/dashboard/student/certificates/page.tsx` | `/dashboard/student/certificates` | `http://localhost:3000/dashboard/student/certificates` | STUDENT, ADMIN |
| `app/dashboard/student/vocabulary/page.tsx` | `/dashboard/student/vocabulary` | `http://localhost:3000/dashboard/student/vocabulary` | STUDENT, ADMIN |

## 5. Teacher Pages

Các route trong nhóm này dùng `app/dashboard/teacher/layout.tsx`, bọc `RoleGuard allow={["TEACHER", "ADMIN"]}` và `RoleDashboardShell role="TEACHER"`.

| File | Path | Local URL | Quyền |
|---|---|---|---|
| `app/dashboard/teacher/page.tsx` | `/dashboard/teacher` | `http://localhost:3000/dashboard/teacher` | TEACHER, ADMIN |
| `app/dashboard/teacher/courses/new/page.tsx` | `/dashboard/teacher/courses/new` | `http://localhost:3000/dashboard/teacher/courses/new` | TEACHER, ADMIN |
| `app/dashboard/teacher/courses/[courseId]/curriculum/page.tsx` | `/dashboard/teacher/courses/:courseId/curriculum` | `http://localhost:3000/dashboard/teacher/courses/1/curriculum` | TEACHER, ADMIN |

## 6. Admin Pages

Các route trong nhóm này dùng `app/dashboard/admin/layout.tsx`, bọc `RoleGuard allow={["ADMIN"]}` và `RoleDashboardShell role="ADMIN"`.

| File | Path | Local URL | Quyền |
|---|---|---|---|
| `app/dashboard/admin/page.tsx` | `/dashboard/admin` | `http://localhost:3000/dashboard/admin` | ADMIN |
| `app/dashboard/admin/categories/page.tsx` | `/dashboard/admin/categories` | `http://localhost:3000/dashboard/admin/categories` | ADMIN |
| `app/dashboard/admin/tags/page.tsx` | `/dashboard/admin/tags` | `http://localhost:3000/dashboard/admin/tags` | ADMIN |
| `app/dashboard/admin/approvals/page.tsx` | `/dashboard/admin/approvals` | `http://localhost:3000/dashboard/admin/approvals` | ADMIN |
| `app/dashboard/admin/approvals/[requestId]/page.tsx` | `/dashboard/admin/approvals/:requestId` | `http://localhost:3000/dashboard/admin/approvals/1` | ADMIN |

## 7. Mentor And Moderator Pages

| File | Path | Local URL | Quyền |
|---|---|---|---|
| `app/dashboard/mentor/page.tsx` | `/dashboard/mentor` | `http://localhost:3000/dashboard/mentor` | MENTOR, ADMIN |
| `app/dashboard/moderator/page.tsx` | `/dashboard/moderator` | `http://localhost:3000/dashboard/moderator` | MODERATOR, ADMIN |

## 8. Next.js API Route Handler

| File | Method/Path | Local URL | Ghi chú |
|---|---|---|---|
| `app/api/stats/route.ts` | `/api/stats` | `http://localhost:3000/api/stats` | API route nội bộ của frontend |

## 9. Guard Hiện Tại

```txt
Chưa login      -> redirect /login
Login sai role  -> redirect về dashboard đúng role của user hiện tại
Đúng role       -> render page
```

Role mapping:

| Route group | Role |
|---|---|
| `/dashboard` | Authenticated, redirect theo role |
| `/dashboard/student/**` | STUDENT, ADMIN |
| `/dashboard/teacher/**` | TEACHER, ADMIN |
| `/dashboard/admin/**` | ADMIN |
| `/dashboard/mentor/**` | MENTOR, ADMIN |
| `/dashboard/moderator/**` | MODERATOR, ADMIN |
| Public pages | Không cần login |

Guard ưu tiên role đọc từ JWT (`getRoleFromToken`) rồi mới fallback sang `user.role` trong localStorage.

## 10. Checklist URL Để Test Nhanh

```txt
http://localhost:3000/
http://localhost:3000/login
http://localhost:3000/register
http://localhost:3000/pricing
http://localhost:3000/courses
http://localhost:3000/courses/ielts-foundation
http://localhost:3000/chat
http://localhost:3000/forum
http://localhost:3000/forum/post/post-3
http://localhost:3000/dashboard
http://localhost:3000/dashboard/student
http://localhost:3000/dashboard/student/wishlist
http://localhost:3000/dashboard/student/player/ielts-foundation
http://localhost:3000/dashboard/student/quiz/1
http://localhost:3000/dashboard/student/certificates
http://localhost:3000/dashboard/student/vocabulary
http://localhost:3000/dashboard/teacher
http://localhost:3000/dashboard/teacher/courses/new
http://localhost:3000/dashboard/teacher/courses/1/curriculum
http://localhost:3000/dashboard/admin
http://localhost:3000/dashboard/admin/categories
http://localhost:3000/dashboard/admin/tags
http://localhost:3000/dashboard/admin/approvals
http://localhost:3000/dashboard/admin/approvals/1
http://localhost:3000/dashboard/mentor
http://localhost:3000/dashboard/moderator
http://localhost:3000/api/stats
```
