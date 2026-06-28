# 08 - Manual Test Checklist

> Checklist này dùng route thật hiện tại của Next.js App Router. Không dùng các route cũ `/profile`, `/learn`, `/teacher`, `/admin`.

## 1. Auth

- [ ] Register tài khoản mới thành công tại `/register`.
- [ ] Login đúng email/password thành công tại `/login`.
- [ ] Login sai password hiển thị lỗi.
- [ ] Sau login gọi được `/api/users/me` hoặc fallback role từ JWT nếu `/me` lỗi.
- [ ] Token được gắn vào header `Authorization`.
- [ ] Refresh token hoạt động khi request qua `apiFetch` gặp 401.
- [ ] Logout xóa `st3p_token`, `st3p_user`, `st3p_refresh_token` và về `/login`.
- [ ] User chưa login vào `/dashboard/student`, `/dashboard/teacher`, `/dashboard/admin` đều bị redirect `/login`.
- [ ] User đã login mở `/login` hoặc `/register` bị redirect về dashboard đúng role.

## 2. RBAC

- [ ] Student vào được `/dashboard/student`.
- [ ] Student không vào được `/dashboard/teacher`, bị redirect về `/dashboard/student`.
- [ ] Student không vào được `/dashboard/admin`, bị redirect về `/dashboard/student`.
- [ ] Teacher vào được `/dashboard/teacher`.
- [ ] Teacher không vào được `/dashboard/admin`, bị redirect về `/dashboard/teacher`.
- [ ] Admin vào được `/dashboard/admin`.
- [ ] Admin có thể vào các nhóm route student/teacher theo policy hiện tại.
- [ ] Mentor vào được `/dashboard/mentor`.
- [ ] Moderator vào được `/dashboard/moderator`.
- [ ] `/dashboard` redirect đúng role: student/teacher/admin/mentor/moderator.

## 3. Public Course

- [ ] Trang chủ load được categories/course showcase hoặc fallback rõ ràng.
- [ ] `/courses` load được course list.
- [ ] Search keyword hoạt động.
- [ ] Filter không làm vỡ UI nếu API chưa hỗ trợ đủ.
- [ ] Click course card đi tới `/courses/:slug`.
- [ ] Course detail load đúng dữ liệu từ `GET /api/courses/p/{slug}`.
- [ ] Review list hiển thị đúng từ `GET /api/courses/p/{courseId}/reviews`.
- [ ] Course không tồn tại hiển thị empty/not found state.

## 4. Student Flow

- [ ] Student enroll course thành công qua `POST /api/enrollments`.
- [ ] Sau enroll redirect về `/dashboard/student`.
- [ ] Course đã enroll xuất hiện trong learning dashboard hoặc local fallback.
- [ ] Click lesson mở được `/dashboard/student/player/:slug`.
- [ ] Preview lesson xem được nếu API/data cho phép.
- [ ] Add wishlist thành công.
- [ ] Remove wishlist thành công.
- [ ] Viết review thành công.
- [ ] Sửa review của chính mình thành công.
- [ ] Xóa review của chính mình thành công.
- [ ] Non-student không được gửi review/enroll nếu backend trả 403.

## 5. Teacher Flow

- [ ] Teacher tạo course mới tại `/dashboard/teacher/courses/new`.
- [ ] Teacher xem được my courses tại `/dashboard/teacher`.
- [ ] Teacher mở curriculum tại `/dashboard/teacher/courses/:courseId/curriculum`.
- [ ] Teacher sửa basic info.
- [ ] Teacher gắn category/tag.
- [ ] Teacher tạo chapter.
- [ ] Teacher tạo lesson.
- [ ] Teacher sửa lesson.
- [ ] Teacher xóa lesson.
- [ ] Teacher lấy được upload signature.
- [ ] Upload file lên Cloudinary thành công khi env đủ.
- [ ] Update lesson content thành công.
- [ ] Submit course thành công.
- [ ] Publish course thành công khi course đã approved.

## 6. Admin Flow

- [ ] Admin xem được `/dashboard/admin`.
- [ ] Admin CRUD category tại `/dashboard/admin/categories`.
- [ ] Admin CRUD tag tại `/dashboard/admin/tags`.
- [ ] Admin xem được pending approvals tại `/dashboard/admin/approvals`.
- [ ] Admin xem được approval detail.
- [ ] Admin approve course thành công.
- [ ] Admin reject course kèm review note thành công.
- [ ] Sau approve/reject, pending list được refresh.
- [ ] User không phải admin không xem/gọi được màn approval.

## 7. Error Handling

- [ ] API 400 hiển thị lỗi form/inline.
- [ ] API 401 redirect login hoặc refresh token.
- [ ] API 403 hiển thị toast lỗi hoặc redirect role-home theo guard.
- [ ] API 404 hiển thị Not Found/Empty state.
- [ ] API 500 hiển thị thông báo lỗi hệ thống.
- [ ] Mất mạng hiển thị fallback/retry rõ ràng.

## 8. Responsive

- [ ] Header public hiển thị tốt trên mobile.
- [ ] Role dashboard shell có nav ngang trên mobile.
- [ ] Course grid chuyển từ nhiều cột sang 1 cột mobile.
- [ ] Form không bị tràn màn hình.
- [ ] Table admin có scroll ngang hoặc không phá layout mobile.

## 9. Build

- [x] `npx tsc --noEmit` không lỗi.
- [x] `npx eslint . --quiet` không lỗi nghiêm trọng.
- [x] `npm run build` chạy thành công. _(2026-06-28: pass với Next.js 16.2.6)_
- [ ] Không có env thật trong repo.
- [ ] Không có console log token.
- [ ] Production API URL được set đúng khi deploy.
