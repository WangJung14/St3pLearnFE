"use client";
import { Eye, EyeOff, BookOpen, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { GuestGuard } from "@/components/guards/GuestGuard";
import { useToast } from "@/components/ui/Toast";
import { registerSchema, type RegisterFormValues } from "@/lib/validations";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const router = useRouter();
  const { register: authRegister } = useAuth();
  const toast = useToast();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      password: "",
      retypePassword: "",
    },
  });

  const inputClassName = (field: keyof RegisterFormValues) =>
    `w-full text-xs rounded-xl border px-4 py-3 focus:ring-2 focus:border-transparent outline-none transition-all bg-white ${
      errors[field] ? "border-red-300 focus:ring-red-400" : "border-gray-200 focus:ring-primary"
    }`;

  // Xử lý đăng ký tài khoản mới qua AuthContext
  const onSubmit = async (data: RegisterFormValues) => {
    setErrorMessage("");
    setIsLoading(true);
    try {
      const result = await authRegister({
        email: data.email,
        password: data.password,
        username: data.username,
        fullName: data.fullName,
      });

      if (result.success) {
        toast.success("Đăng ký thành công", "Hãy đăng nhập bằng tài khoản mới.");
        router.push("/login");
      } else {
        const message = result.message ?? "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.";
        setErrorMessage(message);
        toast.error("Đăng ký thất bại", message);
      }
    } catch {
      setErrorMessage("Có lỗi xảy ra khi kết nối tới máy chủ!");
      toast.error("Không kết nối được máy chủ", "Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  const onInvalid = () => {
    const firstError = Object.values(errors)[0];
    if (firstError?.message) {
      setErrorMessage(firstError.message);
      toast.warning("Thông tin đăng ký chưa hợp lệ", firstError.message);
    }
  };

  return (
    <GuestGuard>
      <div className="flex min-h-screen bg-gray-50 text-gray-900">
        {/* Cột bên trái - Quảng bá thương hiệu (Ẩn trên màn hình di động) */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-secondary p-12 lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center min-[2400px]:p-24">
          {/* Vòng tròn phát sáng tạo hiệu ứng chiều sâu cao cấp */}
          <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-3xl pointer-events-none"></div>

          {/* Hình ảnh nền nhẹ */}
          <div
            className="absolute inset-0 opacity-10 bg-cover bg-center bg-blend-overlay pointer-events-none"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop')",
            }}
          />

          <div className="auth-hero-copy relative z-10 grid gap-8 text-center text-white min-[2400px]:grid-cols-[220px_minmax(0,1fr)] min-[2400px]:items-center min-[2400px]:text-left">
            <div className="flex justify-center min-[2400px]:justify-start">
              {/* Hộp biểu tượng kính mờ (Glassmorphism) cực chất */}
              <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/20 shadow-xl flex items-center justify-center animate-pulse">
                <BookOpen className="w-16 h-16 text-white" />
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="flex items-center justify-center gap-2 text-5xl font-black tracking-tight min-[2400px]:justify-start min-[2400px]:text-6xl">
                EduMastery
              </h1>
              <p className="max-w-[62ch] text-lg font-medium leading-relaxed text-white/95 min-[2400px]:text-xl">
                Bắt đầu hành trình học tập đột phá cùng EduMastery. Hàng ngàn bài học chất lượng đang chờ đón bạn khám phá.
              </p>
            </div>

            {/* Dòng chứng thực uy tín của nền tảng */}
            <div className="flex flex-wrap justify-center gap-4 pt-2 text-2xs font-extrabold uppercase tracking-widest text-white/80 min-[2400px]:col-span-2 min-[2400px]:justify-start min-[2400px]:gap-6">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Chứng chỉ có giá trị
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-4 h-4" /> Hệ thống Gamification thú vị
              </span>
            </div>
          </div>
        </div>

        {/* Cột bên phải - Khu vực Form nhập liệu đăng ký */}
        <div className="flex w-full items-center justify-center bg-gray-50 p-6 sm:p-12 md:p-16 lg:w-1/2 lg:p-24 min-[2400px]:p-28">
          <div className="auth-form-card w-full rounded-3xl border border-gray-100 bg-white p-8 shadow-soft sm:p-10 space-y-6">
            <div className="text-center md:text-left space-y-2">
              <h2 className="text-3xl font-black text-gray-950 tracking-tight">Tạo tài khoản mới</h2>
              <p className="text-xs text-gray-500 font-medium">
                Bắt đầu hành trình nâng tầm ngoại ngữ của bạn cùng EduMastery ngay hôm nay.
              </p>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 font-medium">
                {errorMessage}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit, onInvalid)}>
              <div className="space-y-4">
                {/* Dòng 1: Họ tên & Tên đăng nhập */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="fullname"
                      className="block text-2xs font-extrabold uppercase text-gray-400 tracking-wider"
                    >
                      Họ và Tên
                    </label>
                    <input
                      id="fullname"
                      type="text"
                      {...registerField("fullName")}
                      placeholder="Nguyen Van A"
                      aria-invalid={Boolean(errors.fullName)}
                      className={inputClassName("fullName")}
                    />
                    {errors.fullName && (
                      <p className="text-3xs font-bold text-red-500">{errors.fullName.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="username"
                      className="block text-2xs font-extrabold uppercase text-gray-400 tracking-wider"
                    >
                      Tên đăng nhập
                    </label>
                    <input
                      id="username"
                      type="text"
                      {...registerField("username")}
                      placeholder="nguyenvana123"
                      aria-invalid={Boolean(errors.username)}
                      className={inputClassName("username")}
                    />
                    {errors.username && (
                      <p className="text-3xs font-bold text-red-500">{errors.username.message}</p>
                    )}
                  </div>
                </div>

                {/* Dòng 2: Địa chỉ Email */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="block text-2xs font-extrabold uppercase text-gray-400 tracking-wider"
                  >
                    Địa chỉ Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...registerField("email")}
                    placeholder="name@example.com"
                    aria-invalid={Boolean(errors.email)}
                    className={inputClassName("email")}
                  />
                  {errors.email && (
                    <p className="text-3xs font-bold text-red-500">{errors.email.message}</p>
                  )}
                </div>

                {/* Dòng 3: Mật khẩu & Nhập lại mật khẩu */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="password"
                      className="block text-2xs font-extrabold uppercase text-gray-400 tracking-wider"
                    >
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        {...registerField("password")}
                        placeholder="••••••••"
                        aria-invalid={Boolean(errors.password)}
                        className={inputClassName("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-3xs font-bold text-red-500">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="retype-password"
                      className="block text-2xs font-extrabold uppercase text-gray-400 tracking-wider"
                    >
                      Nhập lại mật khẩu
                    </label>
                    <div className="relative">
                      <input
                        id="retype-password"
                        type={showRetypePassword ? "text" : "password"}
                        {...registerField("retypePassword")}
                        placeholder="••••••••"
                        aria-invalid={Boolean(errors.retypePassword)}
                        className={inputClassName("retypePassword")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRetypePassword(!showRetypePassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showRetypePassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.retypePassword && (
                      <p className="text-3xs font-bold text-red-500">{errors.retypePassword.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Nút gửi form đăng ký */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-95 text-white text-xs font-black py-3.5 rounded-xl shadow-md shadow-pink-200 transition-all transform active:scale-[0.99] disabled:opacity-50 flex items-center justify-center cursor-pointer mt-2"
              >
                {isLoading ? "Đang khởi tạo tài khoản..." : "Tạo Tài Khoản Học Viên"}
              </button>
            </form>

            {/* Đường dẫn sang trang đăng nhập */}
            <p className="text-center text-xs font-bold text-gray-500">
              Đã có tài khoản thành viên?{" "}
              <Link
                href="/login"
                className="text-primary hover:opacity-85 transition-opacity"
              >
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </GuestGuard>
  );
}
