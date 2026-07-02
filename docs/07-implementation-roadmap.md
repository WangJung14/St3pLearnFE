# 07 - Implementation Roadmap

> **Ghi chú:** Project đang dùng **Next.js 14 + App Router** thay vì Vite. Các checklist được map tương đương sang stack thực tế.

## Phase 1 - Project Setup

Checklist:

- [x] Tạo Vite React TypeScript project. _(dùng Next.js 14 + App Router)_
- [x] Cài Tailwind CSS.
- [x] Cài React Router DOM. _(dùng Next.js routing)_
- [x] Cài TanStack Query. _(dùng SWR thay thế)_
- [ ] Cài Zustand. _(chưa cài, dùng React Context thay thế)_
- [x] Cài Axios. _(dùng native fetch thay thế)_
- [ ] Cài React Hook Form + Zod. _(form dùng native state, chưa tích hợp)_
- [x] Tạo `.env.example`. _(có `NEXT_PUBLIC_API_URL` và `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`)_
- [x] Tạo `src/app/config.ts`. _(có `lib/apiConfig.ts`)_
- [x] Tạo `src/lib/api-client.ts`. _(có `lib/fetcher.ts`)_
- [x] Tạo `PublicLayout`. _(Header + Footer component)_
- [x] Tạo `DashboardLayout`. _(dashboard/page.tsx role-based)_

## Phase 2 - Auth

Checklist:

- [x] Tạo `AuthContext` (tương đương `features/auth/store.ts`). _(context/AuthContext.tsx — token, user, login, logout, updateUser)_
- [x] Tạo `LoginPage`. _(app/login/page.tsx — form email/password, gọi login() từ AuthContext, redirect ?redirect param)_
- [x] Tạo `RegisterPage`. _(app/register/page.tsx — dùng register() từ AuthContext, inline error message thay alert())_
- [x] Login gọi API Backend. _(POST /api/auth/login qua AuthContext.login())_
- [x] Lưu token sau login. _(localStorage: st3p_token + st3p_user + st3p_refresh_token)_
- [x] Restore session khi reload. _(useEffect đọc localStorage khi AuthProvider mount)_
- [x] Logout clear session. _(xóa localStorage + clear toàn bộ SWR cache)_
- [x] Disable submit khi đang loading. _(isSaving state, button disabled)_
- [x] **GuestGuard** — redirect /dashboard nếu đã login. _(components/guards/GuestGuard.tsx — áp dụng cho LoginPage + RegisterPage)_
- [x] **RegisterPage dùng AuthContext.register()**. _(không còn gọi fetch() trực tiếp)_
- [x] **Gọi `/api/users/me` sau login.** _(AuthContext.login() gọi GET /api/users/me lấy user data chính xác từ server, fallback decode JWT nếu /me lỗi)_
- [x] **Refresh token khi gặp 401.** _(lib/apiFetch.ts — tự động refresh + retry, redirect /login nếu thất bại)_
- [x] **AuthGuard / RoleGuard** component tái sử dụng. _(components/guards/AuthGuard.tsx + RoleGuard.tsx)_

## Phase 3 - Public Course

Checklist:

- [x] Tạo `Course` type. _(CourseCard.tsx export interface Course — đủ field: id, title, slug, shortDescription, thumbnailUrl, price, level, avgRating, totalStudents, instructorName, categories)_
- [x] Tạo `CourseDetail` type. _(CourseCheckoutCard.tsx export interface CourseDetail)_
- [x] Tạo HomePage. _(app/page.tsx — Hero, Features, Course showcase, Pricing, FAQ section)_
- [x] Tạo CourseSearchPage. _(app/courses/page.tsx — search, filter category/level, sort, SWR + offline fallback)_
- [x] Tạo CourseDetailPage. _(app/courses/[slug]/page.tsx — SWR fetch /api/courses/p/{slug}, fallback MOCK_DETAILS, curriculum accordion, checkout card, video preview modal)_
- [x] Tạo CourseCard. _(components/courses/CourseCard.tsx — thumbnail, rating, price, instructor, link)_
- [x] Tạo CourseFilterPanel. _(components/courses/FilterBar.tsx — search, sort, category buttons, level buttons)_
- [x] Tạo ChapterAccordion. _(components/courses/ChapterAccordion.tsx — expand/collapse chapter, preview lesson badge, click to open video)_
- [x] Tạo CourseCheckoutCard. _(components/courses/CourseCheckoutCard.tsx — giá, enroll button, lesson count, duration)_
- [x] Tạo VideoModal. _(components/courses/VideoModal.tsx — modal xem video preview)_
- [x] Tích hợp categories. _(fetch /api/categories, fallback mock)_
- [x] Enroll có gọi API. _(Đã sửa: sử dụng POST /api/enrollments thay vì nhầm sang wishlist)_
- [x] Offline fallback. _(MOCK_DETAILS đầy đủ 6 khóa học mẫu cho CourseDetailPage, MOCK_COURSES cho SearchPage)_
- [x] **Enroll mutation đúng endpoint.** _(POST /api/enrollments với body {courseId}, tách khỏi wishlist — có offline fallback)_
- [x] **Review list read-only.** _(Section "Đánh giá từ học viên" — SWR fetch GET /api/courses/p/{courseId}/reviews, có loading/empty state, star rating, author avatar)_
- [x] **Fix `any` types.** _(WishlistItem + Review interfaces, err: unknown thay err: any, typed body responses)_
- [x] **WishlistButton riêng.** _(Nút toggle Thêm/Xóa Wishlist tách biệt khỏi enroll — POST /api/wishlists/course/{id} hoặc DELETE /api/wishlists/courses/{id})_


## Phase 4 - Student

Checklist:

- [x] Tạo `StudentDashboard`. _(components/dashboard/StudentDashboard.tsx — welcome banner, streak/XP widget, enrolled course list, weekly chart, badge widget, recommendations)_
- [x] Tạo `LessonViewerPage`. _(app/dashboard/student/player/[slug]/page.tsx — split-pane: video/audio/pdf player + sidebar curriculum navigator, tabs discussion/notes)_
- [x] Tạo Curriculum sidebar trong player. _(sidebar phải liệt kê chapter/lesson, icon video/audio/pdf, active lesson highlight, click để chuyển bài)_
- [x] Ghi chú cá nhân (Notes). _(tự động lưu localStorage theo lesson ID)_
- [x] Thảo luận bài học. _(form comment offline — lưu state local, mock comments)_
- [x] Đánh dấu hoàn thành. _(handleCompleteLesson → +5 XP lưu localStorage)_
- [x] Bài kiểm tra. _(nút "Làm bài kiểm tra" redirect /dashboard/student/quiz/{lessonId}; route đã sửa đúng `app/dashboard/student/quiz/[lessonId]/page.tsx`)_
- [x] Offline fallback enrolled courses. _(st3p_enrolled_local localStorage, merge với API wishlist)_
- [x] Add/Remove Wishlist. _(CourseDetailPage đã có WishlistButton toggle — POST/DELETE /api/wishlists)_
- [x] Enroll mutation đúng endpoint. _(CourseDetailPage: POST /api/enrollments — done ở Phase 3)_
- [x] **WishlistPage riêng.** _(app/dashboard/student/wishlist/page.tsx — fetch GET `/api/wishlists`, hiển thị danh sách, remove bằng DELETE `/api/wishlists/courses/{courseId}`, có loading/error/empty state và RoleGuard)_
- [x] **ReviewForm.** _(components/courses/ReviewForm.tsx — POST `/api/courses/{courseId}/reviews` với `{ rating, reviewText }`, revalidate review list sau khi gửi)_
- [x] **Sửa/xóa review của chính học viên.** _(CourseDetailPage hiển thị nút sửa/xóa khi `review.studentId === user.id`; update dùng `POST /api/courses/{courseId}/reviews/{reviewId}`, delete dùng `DELETE /api/courses/{courseId}/reviews/{reviewId}`)_
- [x] **`any` trong StudentDashboard.** _(đã thay bằng `WishlistCourseItem`/`WishlistApiResponse`, đồng thời type Web Speech API trong quiz page để không còn `any` thuộc Phase 4)_
- [ ] **Progress tracking thực.** 
- [ ] **Discussion thực.** _(comment chỉ lưu state local; BE chưa có endpoint GET/POST discussion theo lesson)_


## Phase 5 - Teacher

Checklist:

- [x] Tạo TeacherDashboardPage. _(components/dashboard/TeacherDashboard.tsx)_
- [x] Tạo TeacherCourseListPage. _(trong TeacherDashboard, fetch /api/courses/my-courses)_
- [x] Tạo TeacherCourseCreatePage. _(app/dashboard/teacher/courses/new/page.tsx)_
- [x] Tạo TeacherCourseEditorPage. _(app/dashboard/teacher/courses/[courseId]/curriculum/page.tsx)_
- [x] Tạo CourseBasicInfoForm. _(inline trong new/page.tsx)_
- [x] Tạo CourseTaxonomyForm. _(components/courses/CourseTaxonomyForm.tsx — tab "Phân loại" trong curriculum editor, POST `/api/courses/{courseId}/taxonomy` với `{ categoryIds, tagIds }`)_
- [x] Tạo Chapter editor. _(curriculum/page.tsx có add/edit chapter)_
- [x] Tạo Lesson editor. _(curriculum/page.tsx có add/edit lesson)_
- [x] Tạo LessonContentUploader. _(components/courses/LessonContentUploader.tsx — validate video/audio/PDF, upload Cloudinary, lưu content qua POST `/lessons/{lessonId}/content`)_
- [x] Tích hợp upload signature. _(GET `/api/courses/{courseId}/chapters/{chapterId}/lessons/upload-signature`; cần cấu hình `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` ở FE env)_
- [x] Tích hợp submit course. _(curriculum tab "Duyệt & xuất bản" + TeacherDashboard: confirm rồi POST `/api/courses/{courseId}/submit`, hỗ trợ DRAFT/REJECTED)_
- [x] Tích hợp publish course. _(curriculum tab "Duyệt & xuất bản" + TeacherDashboard: confirm rồi POST `/api/courses/{courseId}/publish`, chỉ bật khi APPROVED)_

## Phase 6 - Admin

Checklist:

- [x] Tạo AdminDashboardPage. _(components/dashboard/AdminDashboard.tsx — fetch pending approvals, courses, categories, tags và link nhanh tới trang quản trị)_
- [x] Tạo AdminCategoryPage. _(app/dashboard/admin/categories/page.tsx — CRUD `GET/POST/PUT/DELETE /api/categories`, có loading/error/empty state và confirm delete)_
- [x] Tạo AdminTagPage. _(app/dashboard/admin/tags/page.tsx — CRUD `GET/POST/PUT/DELETE /api/tags`, có loading/error/empty state và confirm delete)_
- [x] Tạo AdminCourseApprovalListPage. _(app/dashboard/admin/approvals/page.tsx — fetch `GET /api/courses/approvals/pending`)_
- [x] Tạo AdminCourseApprovalDetailPage. _(app/dashboard/admin/approvals/[requestId]/page.tsx — fetch `GET /api/courses/approvals/{requestId}`)_
- [x] Tạo approve/reject form. _(POST `/api/courses/approvals/{requestId}/process` với `{ action: "APPROVE" | "REJECT", reviewNote }`; reject bắt buộc ghi chú)_
- [x] Confirm dialog trước approve/reject. _(window.confirm trước khi process)_
- [x] Invalidate pending approvals sau process. _(global mutate cache `/api/courses/approvals/pending`, sau đó redirect về list)_

## Phase 7 - Polish & Deploy

Checklist:

- [x] Responsive mobile/tablet/desktop. _(đã bổ sung mobile menu cho Header, toast responsive, các grid/table chính dùng breakpoint và overflow-x)_
- [x] Skeleton loading. _(có Skeleton.tsx component)_
- [x] Empty/error states. _(có EmptyState.tsx, một số trang áp dụng)_
- [x] Toast toàn hệ thống. _(components/ui/Toast.tsx + ToastProvider trong root layout; code app/components không còn `alert()` runtime)_
- [x] Validate form bằng Zod. _(lib/validations.ts; áp dụng cho Login/Register/Profile/Teacher course create/Course taxonomy/Admin category/tag)_
- [ ] Test manual theo checklist. _(đã có checklist; chưa thực hiện walkthrough thủ công trên browser thật)_
- [x] Build production. _(`npm run build` pass với Next.js 16.2.6)_
- [ ] Deploy FE. _(chưa)_
- [ ] Cấu hình `NEXT_PUBLIC_API_URL` production. _(đã có `.env.example`; cần set giá trị production trên hosting)_
