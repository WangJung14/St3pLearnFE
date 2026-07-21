import { z } from "zod";

const requiredText = (message: string, min = 2, max = 120) =>
  z.string().trim().min(min, message).max(max, `Tối đa ${max} ký tự.`);

export const loginSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ."),
  password: z.string().min(1, "Vui lòng nhập mật khẩu."),
});

export const registerSchema = z
  .object({
    fullName: requiredText("Vui lòng nhập họ tên.", 2, 100),
    username: z
      .string()
      .trim()
      .min(4, "Tên đăng nhập cần ít nhất 4 ký tự.")
      .max(40, "Tên đăng nhập tối đa 40 ký tự.")
      .regex(/^[a-zA-Z0-9_.-]+$/, "Tên đăng nhập chỉ dùng chữ, số, _, . hoặc -."),
    email: z.string().trim().email("Email không hợp lệ."),
    password: z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự."),
    retypePassword: z.string().min(1, "Vui lòng nhập lại mật khẩu."),
  })
  .refine((value) => value.password === value.retypePassword, {
    message: "Mật khẩu nhập lại không khớp.",
    path: ["retypePassword"],
  });

export const courseCreateSchema = z.object({
  title: requiredText("Vui lòng nhập tên khóa học.", 5, 160),
  shortDescription: requiredText("Vui lòng nhập mô tả ngắn.", 12, 240),
  thumbnailUrl: z.string().trim().url("URL ảnh bìa không hợp lệ.").or(z.literal("")),
  description: requiredText("Vui lòng nhập giới thiệu chi tiết.", 20, 3000),
  price: z.coerce.number().min(0, "Học phí không được âm."),
  level: requiredText("Vui lòng chọn trình độ.", 1, 20),
  language: requiredText("Vui lòng chọn ngôn ngữ.", 2, 40),
  categoryId: requiredText("Vui lòng chọn danh mục.", 1, 80),
});

export const taxonomyNameSchema = z.object({
  name: requiredText("Tên không được để trống.", 2, 80),
});

export const profileSchema = z.object({
  fullName: requiredText("Vui lòng nhập họ tên.", 2, 100),
  bio: z.string().trim().max(500, "Giới thiệu tối đa 500 ký tự.").optional(),
  country: z.string().trim().max(80, "Quốc gia tối đa 80 ký tự.").optional(),
  englishLevel: requiredText("Vui lòng chọn trình độ tiếng Anh.", 1, 20),
  birthDate: z
    .string()
    .optional()
    .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
      message: "Ngày sinh không hợp lệ.",
    }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type CourseCreateFormValues = z.infer<typeof courseCreateSchema>;
export type CourseCreateFormInput = z.input<typeof courseCreateSchema>;
export type ProfileFormValues = z.infer<typeof profileSchema>;

export type FieldErrors<T extends string> = Partial<Record<T, string>>;

export function toFieldErrors<T extends string>(error: z.ZodError): FieldErrors<T> {
  return error.issues.reduce<FieldErrors<T>>((errors, issue) => {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key as T]) {
      errors[key as T] = issue.message;
    }
    return errors;
  }, {});
}

export function getValidationMessage(error: unknown, fallback = "Dữ liệu chưa hợp lệ.") {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
