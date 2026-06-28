/**
 * Cấu hình API Base URL tập trung cho toàn bộ giao diện EduMastery.
 *
 * Mặc định kết nối tới API Gateway chạy ở cổng 8080 (http://localhost:8080).
 * Có thể dễ dàng thay đổi địa chỉ này thông qua biến môi trường NEXT_PUBLIC_API_URL
 * khi triển khai lên các môi trường Staging hoặc Production khác nhau.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
