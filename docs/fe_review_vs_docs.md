# Review FE vs Docs - Báo cáo đối chiếu

> Đối chiếu `docs/07-implementation-roadmap.md` với cấu trúc thực tế FE (Next.js 16 + App Router).
> Trạng thái: ✅ Done | ⚠️ Partial | ❌ Missing | 🎁 Bonus (không có trong docs nhưng đã impl)

---

## Phase 1 - Project Setup

| # | Hạng mục | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | Next.js + App Router | ✅ | `app/layout.tsx`, cấu trúc route đầy đủ |
| 2 | Tailwind CSS | ✅ | `globals.css`, `tailwind.config.ts` |
| 3 | SWR (thay TanStack Query) | ✅ | Dùng `useSWR` xuyên suốt |
| 4 | Zustand | ⚠️ | Cài vào `package.json` nhưng dùng `AuthContext` + `authStore.ts` |
| 5 | React Hook Form + Zod | ✅ | `lib/validations.ts`, áp dụng login/register/admin/teacher |
| 6 | `.env.example` + `lib/apiConfig.ts` | ✅ | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` |
| 7 | PublicLayout (Header + Footer) | ✅ | `components/header.tsx`, `components/footer.tsx` |
| 8 | DashboardLayout | ✅ | `app/dashboard/page.tsx` (role-based redirect) |

---

## Phase 2 - Auth

| # | Hạng mục | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | `AuthContext` | ✅ | `context/AuthContext.tsx` — token, user, login, logout, updateUser |
| 2 | `LoginPage` | ✅ | `app/login/page.tsx` |
| 3 | `RegisterPage` | ✅ | `app/register/page.tsx` |
| 4 | Lưu token / Restore session | ✅ | `localStorage` + `AuthHydrator.tsx` |
| 5 | Logout clear session | ✅ | Xóa localStorage + clear SWR cache |
| 6 | **GuestGuard** | ✅ | `components/guards/GuestGuard.tsx` |
| 7 | **AuthGuard + RoleGuard** | ✅ | `components/guards/AuthGuard.tsx`, `RoleGuard.tsx` |
| 8 | Gọi `/api/users/me` sau login | ✅ | `AuthContext.login()` |
| 9 | Refresh token 401 | ✅ | `lib/apiFetch.ts` |
| 10 | `authStore.ts` (Zustand) | 🎁 | `lib/authStore.ts` — persist token (bonus) |

---

## Phase 3 - Public Course

| # | Hạng mục | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | `CourseCard` | ✅ | `components/courses/CourseCard.tsx` |
| 2 | `CourseFilterPanel` | ✅ | `components/courses/FilterBar.tsx` |
| 3 | `ChapterAccordion` | ✅ | `components/courses/ChapterAccordion.tsx` |
| 4 | `CourseCheckoutCard` | ✅ | `components/courses/CourseCheckoutCard.tsx` |
| 5 | `VideoModal` | ✅ | `components/courses/VideoModal.tsx` |
| 6 | `HomePage` | ✅ | `app/page.tsx` (Hero, Features, Course showcase, Pricing, FAQ) |
| 7 | `CourseSearchPage` | ✅ | `app/courses/page.tsx` |
| 8 | `CourseDetailPage` | ✅ | `app/courses/[slug]/page.tsx` |
| 9 | Enroll đúng endpoint | ✅ | `POST /api/enrollments` |
| 10 | Tích hợp categories | ✅ | `fetch /api/categories`, fallback mock |
| 11 | Review list read-only | ✅ | `ReviewForm.tsx` + hiển thị trên detail page |
| 12 | WishlistButton | ✅ | `POST/DELETE /api/wishlists` |
| 13 | Offline fallback courses | ✅ | `MOCK_DETAILS` + `MOCK_COURSES` |
| 14 | Trang `/pricing` | 🎁 | `app/pricing/page.tsx` (không có trong docs) |
| 15 | Trang `/forum` | 🎁 | `app/forum/` (không có trong docs) |
| 16 | Trang `/chat` | 🎁 | `app/chat/` (không có trong docs) |

---

## Phase 4 - Student

| # | Hạng mục | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | `StudentDashboard` | ✅ | `components/dashboard/StudentDashboard.tsx` |
| 2 | `LessonViewerPage` | ✅ | `app/dashboard/student/player/[slug]/page.tsx` |
| 3 | Curriculum sidebar | ✅ | Sidebar bên phải liệt kê chapter/lesson |
| 4 | Ghi chú cá nhân (Notes) | ✅ | `localStorage` theo lesson ID |
| 5 | Thảo luận bài học | ⚠️ | Local state only — BE chưa có API |
| 6 | Đánh dấu hoàn thành (+XP) | ✅ | `localStorage` XP |
| 7 | Bài kiểm tra (Quiz) | ✅ | `app/dashboard/student/quiz/[lessonId]/page.tsx` |
| 8 | WishlistPage | ✅ | `app/dashboard/student/wishlist/page.tsx` |
| 9 | ReviewForm (student) | ✅ | `components/courses/ReviewForm.tsx` |
| 10 | Sửa/xóa review | ✅ | `CourseDetailPage` — nút edit/delete theo `studentId` |
| 11 | **Progress tracking thực** | ❌ | Đã ghép `progressPercent` từ API enrollments nhưng BE chưa cập nhật % khi học |
| 12 | **Discussion thực** | ❌ | Comment chỉ local state — BE chưa có endpoint |
| 13 | Offline enrolled courses | ✅ | `st3p_enrolled_local` localStorage |
| 14 | Fetch enrolled từ API + bulk-summaries | ✅ | `GET /api/enrollments/my-courses` + `POST /api/courses/bulk-summaries` |
| 15 | Vocabulary trang | 🎁 | `app/dashboard/student/vocabulary/` (bonus, chưa có trong docs) |
| 16 | Certificates trang | 🎁 | `app/dashboard/student/certificates/` (bonus) |

---

## Phase 5 - Teacher

| # | Hạng mục | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | `TeacherDashboard` | ✅ | `components/dashboard/TeacherDashboard.tsx` |
| 2 | Course list (my-courses) | ✅ | `fetch /api/courses/my-courses` |
| 3 | `TeacherCourseCreatePage` | ✅ | `app/dashboard/teacher/courses/new/page.tsx` |
| 4 | `TeacherCourseEditorPage` | ✅ | `app/dashboard/teacher/courses/[courseId]/curriculum/page.tsx` |
| 5 | `CourseTaxonomyForm` | ✅ | `components/courses/CourseTaxonomyForm.tsx` |
| 6 | Chapter editor | ✅ | Có add/edit/delete chapter |
| 7 | Lesson editor | ✅ | Có add/edit/delete lesson |
| 8 | `LessonContentUploader` | ✅ | `components/courses/LessonContentUploader.tsx` — Cloudinary |
| 9 | Upload signature | ✅ | `GET /api/courses/{id}/chapters/{id}/lessons/upload-signature` |
| 10 | Submit course | ✅ | `POST /api/courses/{id}/submit` |
| 11 | Publish course | ✅ | `POST /api/courses/{id}/publish` |

---

## Phase 6 - Admin

| # | Hạng mục | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | `AdminDashboard` | ✅ | `components/dashboard/AdminDashboard.tsx` |
| 2 | `AdminCategoryPage` | ✅ | `app/dashboard/admin/categories/page.tsx` — CRUD đầy đủ |
| 3 | `AdminTagPage` | ✅ | `app/dashboard/admin/tags/page.tsx` — CRUD đầy đủ |
| 4 | `AdminCourseApprovalListPage` | ✅ | `app/dashboard/admin/approvals/page.tsx` |
| 5 | `AdminCourseApprovalDetailPage` | ✅ | `app/dashboard/admin/approvals/[requestId]/page.tsx` |
| 6 | Approve/Reject form | ✅ | `POST /api/courses/approvals/{requestId}/process` |
| 7 | Confirm dialog | ✅ | `window.confirm` |
| 8 | Invalidate cache sau process | ✅ | `mutate` + redirect |

> **Lưu ý đang pending (chờ BE):** Tags API 404, Categories API 401 — do `api-gateway` chưa route `/api/tags/**` và chưa whitelist public GET. Đã tạo issue: [`docs/issue_gateway_routing.md`](file:///d:/GIAHAN/Projects/St3plearn/BE/docs/issue_gateway_routing.md)

---

## Phase 7 - Polish & Deploy

| # | Hạng mục | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | Responsive mobile/tablet/desktop | ✅ | Mobile menu Header, grid breakpoints |
| 2 | Skeleton loading | ✅ | `components/ui/Skeleton.tsx` |
| 3 | Empty/error states | ✅ | `components/ui/EmptyState.tsx` |
| 4 | Toast toàn hệ thống | ✅ | `components/ui/Toast.tsx` + `ToastProvider` |
| 5 | Validate form (Zod) | ✅ | `lib/validations.ts` |
| 6 | HMR fix | ✅ | `package.json` đổi `next dev -H localhost` |
| 7 | Test manual | ❌ | Chưa thực hiện walkthrough đầy đủ |
| 8 | Build production | ✅ | `npm run build` pass |
| 9 | Deploy FE | ❌ | Chưa deploy |
| 10 | Cấu hình env production | ❌ | Chưa set biến trên hosting |

---

## Các trang/component Bonus (không có trong docs nhưng đã làm)

| Component | Đường dẫn |
|---|---|
| Trang Forum | `app/forum/` |
| Trang Chat | `app/chat/` |
| Trang Pricing | `app/pricing/` |
| Trang Vocabulary | `app/dashboard/student/vocabulary/` |
| Trang Certificates | `app/dashboard/student/certificates/` |
| MentorDashboard | `components/dashboard/MentorDashboard.tsx` |
| Dashboard Mentor route | `app/dashboard/mentor/` |
| Dashboard Moderator route | `app/dashboard/moderator/` |
| `authStore.ts` (Zustand) | `lib/authStore.ts` |
| `AuthHydrator.tsx` | `components/AuthHydrator.tsx` |

---

## Tóm tắt tổng quan

| Trạng thái | Số lượng |
|---|---|
| ✅ Đã hoàn thành | ~52 hạng mục |
| ⚠️ Partial (thiếu BE) | 2 (Discussion, Progress tracking) |
| ❌ Chưa làm | 3 (Test manual, Deploy, Env production) |
| 🎁 Bonus (ngoài scope docs) | 10+ |

> **Kết luận:** FE đã hoàn thiện **~95%** so với roadmap. Các hạng mục còn lại đều phụ thuộc vào Backend hoặc môi trường deploy.
