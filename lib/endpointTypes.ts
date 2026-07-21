import type { ApiResponse, PagePayload } from "./apiResponses";

export type { ApiResponse, PagePayload };

export type ReportStatus = "PENDING" | "RESOLVED" | "DISMISSED";
export type ReportTargetType = "COURSE" | "REVIEW" | "USER" | "LESSON" | "OTHER";

export interface ReportTicket {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  description?: string;
  status: ReportStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DashboardMetrics {
  monthlyRevenue: number;
  newStudentsToday: number;
  activeUsersLast7Days: number;
  pendingReports: number;
  topCourses: Array<Record<string, unknown>>;
}

export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "TEXT" | "AUDIO";
export type QuestionDifficulty = "EASY" | "MEDIUM" | "HARD";
export type ExamStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type ExamAttemptStatus = "STARTED" | "SUBMITTED" | "NEEDS_GRADING" | "GRADED" | "EXPIRED";

export interface QuestionMetadata {
  options?: Array<{ id: string; text: string; correct?: boolean }>;
  correctAnswer?: string;
  explanation?: string;
  [key: string]: unknown;
}

export interface Question {
  id: string;
  bankId?: string;
  type: QuestionType;
  content: string;
  metadata: QuestionMetadata;
  difficulty: QuestionDifficulty;
  points: number;
}

export interface QuestionBank {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  instructorId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Exam {
  id: string;
  courseId: string;
  instructorId?: string;
  title: string;
  description?: string;
  durationMinutes: number;
  passingScore: number;
  maxAttempts: number;
  status: ExamStatus;
  questionIds?: string[];
  questions?: Question[];
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentQuestion extends Omit<Question, "bankId"> {}

export interface StartExamResponse {
  attemptId: string;
  endTime: string;
  questions: StudentQuestion[];
}

export interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  startedAt: string;
  submittedAt?: string;
  score?: number;
  passed?: boolean;
  status: ExamAttemptStatus;
}

export interface ExamResult {
  attemptId: string;
  examId: string;
  score: number;
  passed: boolean;
  status: ExamAttemptStatus;
  questionResults?: Array<Record<string, unknown>>;
}

export interface ResumeLearning {
  courseId: string;
  lastLessonId?: string;
  progressPercent?: number;
  currentSeconds?: number;
  completedLessonIds?: string[];
}

export interface DueCard {
  flashcardId: string;
  vocabularyId: string;
  frontType: string;
  backType: string;
  lemma: string;
  phonetic?: string;
  partOfSpeech?: string;
  definition?: string;
  example?: string;
}

export interface FlashcardHistory {
  totalCardsReviewed: number;
  newCardsLearned: number;
  masteredCards: number;
  averageEasinessFactor: number;
}

export interface Certificate {
  id: string;
  certificateCode?: string;
  studentId: string;
  studentName?: string;
  courseId: string;
  courseName?: string;
  issueDate?: string;
}

export interface CertificateVerification {
  valid?: boolean;
  isValid?: boolean;
  message: string;
  studentId?: string;
  studentName?: string;
  courseId?: string;
  courseName?: string;
  issueDate?: string;
}

export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export interface CheckoutResponse {
  orderNumber: string;
  paymentUrl: string;
}

export interface CouponPayload {
  courseId?: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount?: number;
  usageLimit?: number;
  startDate: string;
  endDate: string;
}

export interface RefundRequest {
  id: string;
  paymentOrderId: string;
  studentId?: string;
  refundAmount: number;
  reason: string;
  status?: string;
}

export interface ReviewReply {
  id: string;
  reviewId: string;
  authorId: string;
  content: string;
  createdAt: string;
}
