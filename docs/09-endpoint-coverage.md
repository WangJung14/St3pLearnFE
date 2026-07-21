# Endpoint coverage matrix

> Đối chiếu với `BE/Endpoint_API.md`. Cập nhật sau đợt tích hợp FE ngày 2026-07-21.

## Tổng quan

| Trạng thái | Số lượng |
|---|---:|
| FE implemented, endpoint có route/implementation khả dụng | 95 |
| FE implemented / Gateway blocked | 13 |
| FE implemented / Backend vẫn mock/TODO | 3 |
| Không gọi trực tiếp từ FE (VNPay callback) | 1 |
| **Tổng** | **112** |

## Blocker Backend

- Gateway đã route cả `/api/payment/**` và `/api/payments/**` tới Payment Service.
- Gateway cần route `/api/reports/**`, `/api/tags/**` và tách Catalog moderation `/api/admin/reports` khỏi Admin Service exports.
- `/api/admin/courses/{courseId}/remove` hiện rơi vào Admin Service thay vì Catalog Service.
- Flashcard set create/clone và vocabulary import vẫn trả mock/TODO ở controller.
- Backend chưa có API list certificate, student exams, flashcard sets, payment orders/refunds; FE dùng deep-link hoặc form nhập ID.
- Notification Service hiện chỉ có RabbitMQ listener gửi email; chưa có controller, API inbox/read-state hay Gateway route. FE hiển thị blocker và không fallback mock/localStorage. Nhóm này không nằm trong 112 endpoint của `Endpoint_API.md`.

## Ma trận đầy đủ

| Service | Operation | Endpoint | Trạng thái |
|---|---|---|---|
| Identity Service | searchUsers | `GET /api/admin/users` | FE implemented |
| Identity Service | getUserDetail | `GET /api/admin/users/{userId}` | FE implemented |
| Identity Service | assignRole | `POST /api/admin/users/{userId}/roles` | FE implemented |
| Identity Service | removeRole | `DELETE /api/admin/users/{userId}/roles/{roleName}` | FE implemented |
| Identity Service | suspendUser | `PUT /api/admin/users/{userId}/suspend` | FE implemented |
| Identity Service | lockUser | `PUT /api/admin/users/{userId}/lock` | FE implemented |
| Identity Service | activateUser | `PUT /api/admin/users/{userId}/activate` | FE implemented |
| Identity Service | register | `POST /api/auth/register` | FE implemented |
| Identity Service | login | `POST /api/auth/login` | FE implemented |
| Identity Service | refresh | `POST /api/auth/refresh` | FE implemented |
| Identity Service | logout | `POST /api/auth/logout` | FE implemented |
| Identity Service | forgotPassword | `POST /api/auth/forgot-password` | FE implemented |
| Identity Service | resetPassword | `POST /api/auth/reset-password` | FE implemented |
| Identity Service | verifyEmail | `POST /api/auth/verify-email` | FE implemented |
| Identity Service | resendVerificationEmail | `POST /api/auth/resend-verification-email` | FE implemented |
| Identity Service | getMyProfile | `GET /api/users/me` | FE implemented |
| Identity Service | getPublicProfile | `GET /api/users/p/{publicId}` | FE implemented |
| Identity Service | updateMyProfile | `POST /api/users/me` | FE implemented |
| Identity Service | deactivateMyAccount | `DELETE /api/users/me` | FE implemented |
| Identity Service | getMyLoginHistory | `GET /api/users/me/login-history` | FE implemented |
| Identity Service | changePassword | `POST /api/users/me/password` | FE implemented |
| Catalog Service | removeCourse | `POST /api/admin/courses/{courseId}/remove` | FE implemented / Gateway blocked |
| Catalog Service | getReports | `GET /api/admin/reports` | FE implemented / Gateway blocked |
| Catalog Service | processReport | `POST /api/admin/reports/{reportId}/process` | FE implemented / Gateway blocked |
| Catalog Service | getAll | `GET /api/categories` | FE implemented |
| Catalog Service | create | `POST /api/categories` | FE implemented |
| Catalog Service | update | `PUT /api/categories/{id}` | FE implemented |
| Catalog Service | delete | `DELETE /api/categories/{id}` | FE implemented |
| Catalog Service | getChapters | `GET /api/courses/{courseId}/chapters` | FE implemented |
| Catalog Service | createChapter | `POST /api/courses/{courseId}/chapters` | FE implemented |
| Catalog Service | updateChapter | `POST /api/courses/{courseId}/chapters/{chapterId}` | FE implemented |
| Catalog Service | deleteChapter | `DELETE /api/courses/{courseId}/chapters/{chapterId}` | FE implemented |
| Catalog Service | createCourse | `POST /api/courses` | FE implemented |
| Catalog Service | updateCourse | `POST /api/courses/{courseId}` | FE implemented |
| Catalog Service | getAllCourses | `GET /api/courses` | FE implemented |
| Catalog Service | getCourse | `GET /api/courses/{courseId}` | FE implemented |
| Catalog Service | archiveCourse | `DELETE /api/courses/{courseId}/archive` | FE implemented |
| Catalog Service | assignTaxonomy | `POST /api/courses/{courseId}/taxonomy` | FE implemented |
| Catalog Service | submitForApproval | `POST /api/courses/{courseId}/submit` | FE implemented |
| Catalog Service | processCourseApproval | `POST /api/courses/approvals/{requestId}/process` | FE implemented |
| Catalog Service | getPendingApprovals | `GET /api/courses/approvals/pending` | FE implemented |
| Catalog Service | getApprovalDetail | `GET /api/courses/approvals/{requestId}` | FE implemented |
| Catalog Service | searchPublicCourses | `GET /api/courses/p/search` | FE implemented |
| Catalog Service | getMyCourses | `GET /api/courses/my-courses` | FE implemented |
| Catalog Service | cancelCourseApproval | `POST /api/courses/{courseId}/cancel-submit` | FE implemented |
| Catalog Service | publishCourse | `POST /api/courses/{courseId}/publish` | FE implemented |
| Catalog Service | getPublicCourseDetail | `GET /api/courses/p/{slug}` | FE implemented |
| Catalog Service | getBulkSummaries | `POST /api/courses/bulk-summaries` | FE implemented |
| Catalog Service | migrateCourseStatuses | `POST /api/courses/admin/migrate-status` | FE implemented |
| Catalog Service | submitReview | `POST /api/courses/{courseId}/reviews` | FE implemented |
| Catalog Service | getCourseReviews | `GET /api/courses/p/{courseId}/reviews` | FE implemented |
| Catalog Service | updateReview | `POST /api/courses/{courseId}/reviews/{reviewId}` | FE implemented |
| Catalog Service | deleteReview | `DELETE /api/courses/{courseId}/reviews/{reviewId}` | FE implemented |
| Catalog Service | replyToReview | `POST /api/courses/{courseId}/reviews/{reviewId}/reply` | FE implemented |
| Catalog Service | getLessons | `GET /api/courses/{courseId}/chapters/{chapterId}/lessons` | FE implemented |
| Catalog Service | createLesson | `POST /api/courses/{courseId}/chapters/{chapterId}/lessons` | FE implemented |
| Catalog Service | updateLesson | `POST /api/courses/{courseId}/chapters/{chapterId}/lessons/{lessonId}` | FE implemented |
| Catalog Service | deleteLesson | `DELETE /api/courses/{courseId}/chapters/{chapterId}/lessons/{lessonId}` | FE implemented |
| Catalog Service | getUploadSignature | `GET /api/courses/{courseId}/chapters/{chapterId}/lessons/upload-signature` | FE implemented |
| Catalog Service | saveLessonContent | `POST /api/courses/{courseId}/chapters/{chapterId}/lessons/{lessonId}/content` | FE implemented |
| Catalog Service | createReport | `POST /api/reports` | FE implemented / Gateway blocked |
| Catalog Service | getAll | `GET /api/tags` | FE implemented / Gateway blocked |
| Catalog Service | create | `POST /api/tags` | FE implemented / Gateway blocked |
| Catalog Service | update | `PUT /api/tags/{id}` | FE implemented / Gateway blocked |
| Catalog Service | delete | `DELETE /api/tags/{id}` | FE implemented / Gateway blocked |
| Catalog Service | saveCourse | `POST /api/wishlists/course/{courseId}` | FE implemented |
| Catalog Service | removeCourse | `DELETE /api/wishlists/courses/{courseId}` | FE implemented |
| Catalog Service | getMyWishlist | `GET /api/wishlists` | FE implemented |
| Learning Service | issueCertificate | `POST /api/learning/certificates/issue` | FE implemented |
| Learning Service | downloadCertificate | `GET /api/learning/certificates/{certificateId}/download` | FE implemented |
| Learning Service | verifyCertificate | `GET /api/learning/certificates/verify/{certificateCode}` | FE implemented |
| Learning Service | enrollCourse | `POST /api/enrollments` | FE implemented |
| Learning Service | getMyEnrolledCourses | `GET /api/enrollments/my-courses` | FE implemented |
| Learning Service | createExam | `POST /api/learning/exams` | FE implemented |
| Learning Service | updateExamInfo | `PUT /api/learning/exams/{examId}` | FE implemented |
| Learning Service | updateExamQuestions | `PUT /api/learning/exams/{examId}/questions` | FE implemented |
| Learning Service | updateExamStatus | `PUT /api/learning/exams/{examId}/status` | FE implemented |
| Learning Service | deleteExam | `DELETE /api/learning/exams/{examId}` | FE implemented |
| Learning Service | getExamsByInstructor | `GET /api/learning/exams` | FE implemented |
| Learning Service | getExamById | `GET /api/learning/exams/{examId}` | FE implemented |
| Learning Service | startExam | `POST /api/learning/exams/{examId}/attempts` | FE implemented |
| Learning Service | submitExam | `POST /api/learning/exams/attempts/{attemptId}/submit` | FE implemented |
| Learning Service | getExamSubmissions | `GET /api/learning/exams/{examId}/submissions` | FE implemented |
| Learning Service | gradeSubmission | `PUT /api/learning/exams/submissions/{attemptId}/grade` | FE implemented |
| Learning Service | getExamResult | `GET /api/learning/exams/attempts/{attemptId}/result` | FE implemented |
| Learning Service | getDueCards | `GET /api/learning/flashcard-sets/{id}/due-cards` | FE implemented |
| Learning Service | reviewFlashcard | `POST /api/learning/flashcards/{id}/review` | FE implemented |
| Learning Service | getDashboardHistory | `GET /api/learning/dashboard/history` | FE implemented |
| Learning Service | createFlashcardSet | `POST /api/learning/flashcard-sets` | FE implemented / BE mock |
| Learning Service | cloneFlashcardSet | `POST /api/learning/flashcard-sets/{id}/clone` | FE implemented / BE mock |
| Learning Service | startLearning | `POST /api/learning/courses/{courseId}/start` | FE implemented |
| Learning Service | trackProgress | `POST /api/learning/courses/{courseId}/lessons/{lessonId}/progress` | FE implemented |
| Learning Service | resumeLearning | `GET /api/learning/courses/{courseId}/resume` | FE implemented |
| Learning Service | completeLesson | `POST /api/learning/courses/{courseId}/lessons/{lessonId}/complete` | FE implemented |
| Learning Service | createBank | `POST /api/learning/question-banks` | FE implemented |
| Learning Service | updateBank | `PUT /api/learning/question-banks/{bankId}` | FE implemented |
| Learning Service | deleteBank | `DELETE /api/learning/question-banks/{bankId}` | FE implemented |
| Learning Service | getMyBanks | `GET /api/learning/question-banks` | FE implemented |
| Learning Service | createQuestion | `POST /api/learning/question-banks/{bankId}/questions` | FE implemented |
| Learning Service | updateQuestion | `PUT /api/learning/questions/{questionId}` | FE implemented |
| Learning Service | deleteQuestion | `DELETE /api/learning/questions/{questionId}` | FE implemented |
| Learning Service | getQuestionsByBankId | `GET /api/learning/question-banks/{bankId}/questions` | FE implemented |
| Learning Service | importVocabulary | `POST /api/learning/vocabulary/import` | FE implemented / BE mock |
| Payment Service | createCoupon | `POST /api/payment/coupons` | FE implemented |
| Payment Service | calculateDiscount | `POST /api/payment/coupons/calculate` | FE implemented |
| Payment Service | checkout | `POST /api/payment/orders/checkout` | FE implemented |
| Payment Service | vnpayCallback | `GET /api/payment/vnpay/callback` | N/A - VNPay calls Backend |
| Payment Service | requestRefund | `POST /api/payment/refunds` | FE implemented |
| Payment Service | approveRefund | `POST /api/payment/refunds/{id}/approve` | FE implemented |
| Admin Service | getDashboard | `GET /api/admin/dashboard` | FE implemented |
| Admin Service | exportRevenueReport | `GET /api/admin/reports/revenue/export` | FE implemented |
| Admin Service | exportCourseReport | `GET /api/admin/reports/course/export` | FE implemented |

## Kiểm tra

- `tsc --noEmit`: pass.
- `npm run lint`: pass, 0 errors (warnings không chặn build).
- `npm run build`: pass, 38/38 routes generated.
