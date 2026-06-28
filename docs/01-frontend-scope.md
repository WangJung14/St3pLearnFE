# 01 - Frontend Scope

## 1. Mục tiêu FE

Frontend của St3p-Learn cần cung cấp giao diện cho các nghiệp vụ chính:

- Người học tìm khóa học, đăng ký học, xem bài học, theo dõi tiến độ.
- Giáo viên tạo và quản lý khóa học.
- Admin duyệt khóa học và quản lý danh mục/tag.
- Mentor theo dõi và hỗ trợ học viên ở giai đoạn sau.

## 2. MVP bắt buộc

### Public

- Trang chủ
- Danh sách khóa học
- Tìm kiếm/lọc khóa học
- Chi tiết khóa học
- Xem review khóa học
- Đăng nhập
- Đăng ký

### Student

- Profile cá nhân
- Wishlist
- Enroll khóa học
- Dashboard khóa học đã tham gia
- Xem lesson
- Viết/sửa/xóa review

### Teacher

- Dashboard giáo viên
- Danh sách khóa học của tôi
- Tạo khóa học
- Sửa thông tin khóa học
- Gắn category/tag
- Tạo chapter
- Tạo/sửa/xóa lesson
- Upload nội dung lesson
- Submit khóa học
- Publish khóa học sau khi duyệt

### Admin

- Dashboard admin
- CRUD categories
- CRUD tags
- Xem danh sách khóa học chờ duyệt
- Xem chi tiết yêu cầu duyệt
- Approve/reject course

## 3. Phần nên để sau

Các phần này có thể để giai đoạn 2 nếu thời gian ít:

- Live class
- Chat real-time
- Forum đầy đủ
- Assessment nâng cao
- Flashcard/spaced repetition
- Certificate
- Payment thật
- Analytics nâng cao
- Mentor dashboard chi tiết

## 4. Ưu tiên demo

Để demo tốt, nên ưu tiên luồng sau:

```txt
Teacher đăng nhập
-> tạo khóa học
-> thêm chapter/lesson
-> upload nội dung
-> submit duyệt

Admin đăng nhập
-> xem pending approvals
-> approve course

Teacher đăng nhập
-> publish course

Student/public
-> xem course trên trang chủ
-> xem detail
-> enroll
-> học lesson
-> review/wishlist
```

Luồng này chứng minh được FE tích hợp đủ Auth, RBAC, Catalog, Authoring, Approval, Learning.
