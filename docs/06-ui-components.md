# 06 - UI Components

## 1. Layout

### PublicLayout

Dùng cho: Home, Course search, Course detail, Login, Register, Pricing, Chat, Forum.

Thành phần:

```txt
components/header.tsx    ← Navbar với logo, nav links, auth buttons
components/footer.tsx    ← Footer
```

Pattern trong page:

```tsx
return (
  <div className="flex flex-col min-h-screen">
    <Header />
    <main className="flex-grow">
      {/* nội dung page */}
    </main>
    <Footer />
  </div>
);
```

### RoleDashboardShell

Dashboard dùng layout riêng cho từng role group:

```txt
app/dashboard/student/layout.tsx
app/dashboard/teacher/layout.tsx
app/dashboard/admin/layout.tsx
app/dashboard/mentor/layout.tsx
app/dashboard/moderator/layout.tsx
```

Mỗi layout bọc `RoleGuard` và `RoleDashboardShell`:

```tsx
<RoleGuard allow={...}>
  <RoleDashboardShell role="...">{children}</RoleDashboardShell>
</RoleGuard>
```

`app/dashboard/page.tsx` chỉ là entry redirect theo role, không render dashboard trực tiếp.

## 2. UI component nền tảng (`components/ui/`)

Các component đã có:

```txt
button.tsx        ← Button với variants: default, outline, ghost...
Avatar.tsx        ← Avatar với fallback chữ cái
Badge.tsx         ← Badge label với variants
Card.tsx          ← Card + CardContent, CardHeader...
DataGrid.tsx      ← Grid hiển thị dữ liệu dạng bảng
Drawer.tsx        ← Drawer/sidebar mobile
EmptyState.tsx    ← Empty state với icon + text
Input.tsx         ← Input field
Modal.tsx         ← Modal dialog
Select.tsx        ← Select dropdown
Skeleton.tsx      ← Skeleton loading placeholder
Table.tsx         ← Table component
Tooltip.tsx       ← Tooltip hover
Toast.tsx         ← Toast notification toàn hệ thống
```

Component cần thêm:

```txt
ConfirmDialog.tsx ← Confirm dialog trước hành động nguy hiểm
Spinner.tsx       ← Loading spinner
Pagination.tsx    ← Phân trang
Tabs.tsx          ← Tab navigation
```

## 3. Course components (`components/courses/`)

Đã có:

```txt
CourseCard.tsx          ← Card hiển thị khóa học trong grid
CourseCheckoutCard.tsx  ← Card checkout khi xem course detail
ChapterAccordion.tsx    ← Accordion hiển thị chapter/lesson list
FilterBar.tsx           ← Search + filter bar cho course search page
VideoModal.tsx          ← Modal xem video preview
```

Cần thêm:

```txt
CourseReviewList.tsx    ← Danh sách review của course
CourseReviewForm.tsx    ← Form viết review
WishlistButton.tsx      ← Nút thêm/xóa wishlist
EnrollButton.tsx        ← Nút enroll khóa học
```

## 4. Dashboard components (`components/dashboard/`)

Đã có:

```txt
AdminDashboard.tsx      ← Dashboard cho ADMIN
TeacherDashboard.tsx    ← Dashboard cho TEACHER (có my courses list)
StudentDashboard.tsx    ← Dashboard cho STUDENT
MentorDashboard.tsx     ← Dashboard cho MENTOR
RoleDashboardShell.tsx  ← Header/sidebar/footer riêng theo role
OverviewTab.tsx         ← Tab overview chung
ProfileHeader.tsx       ← Header profile với avatar, name, role
EditProfileTab.tsx      ← Form chỉnh sửa profile
```

## 5. Sử dụng EmptyState

```tsx
import { EmptyState } from "@/components/ui/EmptyState";

// Khi list rỗng
{courses.length === 0 && (
  <EmptyState
    title="Chưa có khóa học"
    description="Bạn chưa tạo khóa học nào. Hãy tạo khóa học đầu tiên."
  />
)}
```

## 6. Sử dụng Skeleton

```tsx
import { Skeleton } from "@/components/ui/Skeleton";

// Khi đang loading
{isLoading && (
  <div className="grid grid-cols-3 gap-8">
    {[1, 2, 3].map((i) => (
      <Skeleton key={i} className="h-64 rounded-2xl" />
    ))}
  </div>
)}
```

## 7. Sử dụng Modal

```tsx
import { Modal } from "@/components/ui/Modal";

const [isOpen, setIsOpen] = useState(false);

<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Xác nhận">
  <p>Bạn có chắc muốn xóa lesson này không?</p>
  <div className="flex gap-2 mt-4">
    <button onClick={handleDelete}>Xác nhận</button>
    <button onClick={() => setIsOpen(false)}>Hủy</button>
  </div>
</Modal>
```

## 8. UX checklist

Mỗi màn hình cần có:

- Title rõ ràng (h1 cho page title).
- **Loading state**: Skeleton hoặc spinner khi đang fetch.
- **Error state**: thông báo lỗi + nút retry.
- **Empty state**: EmptyState component khi list rỗng.
- **Feedback mutation**: toast khi thành công/thất bại.
- **Confirm dialog**: trước hành động nguy hiểm (xóa, archive, reject).
- Responsive layout tối thiểu (mobile-friendly).
