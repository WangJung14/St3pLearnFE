# 01 - Frontend Scope

## 1. Mục tiêu FE

Frontend của St3p-Learn cần cung cấp giao diện cho các nghiệp vụ chính:

- **Người học (Student):** Tìm kiếm khóa học, mua/đăng ký khóa học, xem bài học, làm bài kiểm tra (exam), học qua flashcard, nhận chứng chỉ và theo dõi tiến độ.
- **Giáo viên (Teacher/Instructor):** Tạo và quản lý khóa học, cấu trúc bài giảng, ngân hàng câu hỏi, bài thi, và chấm điểm.
- **Quản trị viên (Admin):** Quản lý người dùng, phân quyền, duyệt khóa học, quản lý danh mục/tag, và xem/xuất báo cáo thống kê doanh thu.
- **Mentor:** Theo dõi và hỗ trợ học viên ở giai đoạn sau.

## 2. MVP bắt buộc (Đồng bộ với Backend API)

Dựa trên hệ thống API Backend hiện có, FE cần hoàn thiện các chức năng sau:

### Public & Auth (Identity Service)

- Trang chủ
- Danh sách khóa học
- Tìm kiếm/lọc khóa học
- Chi tiết khóa học
- Đăng nhập / Đăng ký
- Quên mật khẩu, Đặt lại mật khẩu & Xác thực Email
- Đổi mật khẩu & Xem lịch sử đăng nhập

### Student (Learning, Payment & Catalog)

- Profile cá nhân
- Wishlist
- Thanh toán & Đăng ký khóa học (Tích hợp Checkout VNPay, Coupon)
- Dashboard khóa học đã tham gia
- Xem lesson & Lưu tiến độ (Progress Tracking)
- Học và ôn tập bằng Flashcards
- Làm bài thi (Start & Submit Exam), Xem kết quả
- Xác thực & Tải Chứng chỉ (Certificate)
- Viết/sửa/xóa review khóa học
- Yêu cầu hoàn tiền (Refund)

### Teacher (Catalog & Learning)

- Dashboard giáo viên
- Danh sách khóa học của tôi
- Tạo/Sửa thông tin khóa học & Gắn Category/Tag
- Cấu trúc chương trình: Tạo/sửa/xóa Chapter, Lesson
- Upload nội dung lesson (qua upload-signature)
- Quản lý Ngân hàng câu hỏi (Question Banks) & Câu hỏi
- Quản lý Bài thi (Exams) & Chấm bài (Grade Submission)
- Quản lý vòng đời khóa học: Submit duyệt, Hủy submit, Publish, Archive

### Admin (Admin, Identity & Catalog)

- Dashboard admin (Xem thống kê tổng quan)
- Quản lý Users: Tìm kiếm, phân quyền (Assign/Remove Role), Khóa/Mở khóa tài khoản (Suspend, Lock, Activate)
- Quản lý danh mục (CRUD Categories)
- Quản lý thẻ (CRUD Tags)
- Quản lý kiểm duyệt: Xem danh sách chờ duyệt & Approve/Reject Course
- Quản lý báo cáo vi phạm (Reports)
- Xuất báo cáo: Doanh thu, Khóa học (Export CSV/Excel)

## 3. Phần nên để sau (Giai đoạn 2)

Các tính năng không có hoặc chưa cần thiết ở giai đoạn MVP:

- Live class
- Chat real-time
- Forum đầy đủ
- Analytics siêu nâng cao (Tracking hành vi chi tiết)
- Mentor dashboard chi tiết

## 4. Ưu tiên demo luồng chính (End-to-End)

Để demo tốt toàn bộ hệ thống, nên ưu tiên luồng sau:

```txt
1. Teacher đăng nhập
-> Tạo khóa học -> Thêm chapter/lesson -> Upload nội dung
-> Tạo Question Bank & Gắn bài thi (Exam)
-> Submit duyệt khóa học

2. Admin đăng nhập
-> Xem pending approvals -> Approve course
-> (Có thể demo thêm tính năng khóa tài khoản hoặc phân quyền User)

3. Teacher đăng nhập
-> Publish course để sinh viên có thể thấy

4. Student/public (hoặc User chưa đăng nhập)
-> Truy cập trang chủ -> Tìm kiếm course -> Xem detail
-> Đăng ký tài khoản / Đăng nhập
-> Checkout & Thanh toán qua VNPay
-> Vào Dashboard -> Học lesson -> Hệ thống ghi nhận tiến độ
-> Hoàn thành bài thi
-> Pass -> Nhận & Tải Certificate
-> Review course
```

Luồng này chứng minh được hệ thống FE tích hợp đầy đủ và trơn tru các vi dịch vụ: Auth, RBAC, Catalog, Authoring, Approval, Payment, Learning & Certification.
