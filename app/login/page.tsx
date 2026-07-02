"use client";
import { Eye, EyeOff, BookOpen, ShieldCheck, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { GuestGuard } from "@/components/guards/GuestGuard";
import { useToast } from "@/components/ui/Toast";
import { getRoleHomePath } from "@/lib/roleRoutes";
import { loginSchema, type LoginFormValues } from "@/lib/validations";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const toast = useToast();
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Lấy đường dẫn chuyển hướng sau khi đăng nhập thành công từ Search Params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const r = params.get("redirect");
      if (r) {
        setRedirectUrl(r);
      }
    }
  }, []);

  // Xử lý đăng nhập thông qua API Gateway
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const res = await login(data.email, data.password);
      if (res.success) {
        toast.success("Đăng nhập thành công", "Đang chuyển bạn vào dashboard.");
        router.push(redirectUrl ?? res.redirectTo ?? getRoleHomePath(res.role));
      } else {
        toast.error("Đăng nhập thất bại", res.message || "Vui lòng kiểm tra lại thông tin.");
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      toast.error("Không kết nối được máy chủ", "Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  const onInvalid = () => {
    const firstError = Object.values(errors)[0];
    if (firstError?.message) {
      toast.warning("Thông tin đăng nhập chưa hợp lệ", firstError.message);
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
              "url('https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=2070&auto=format&fit=crop')",
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
              St3pLearn
            </h1>
            <p className="max-w-[62ch] text-lg font-medium leading-relaxed text-white/95 min-[2400px]:text-xl">
              Chinh phục tiếng Anh học thuật thông minh hơn với phương pháp lặp lại ngắt quãng và chấm điểm phát âm AI.
            </p>
          </div>

          {/* Dòng chứng thực uy tín của nền tảng */}
          <div className="flex flex-wrap justify-center gap-4 pt-2 text-2xs font-extrabold uppercase tracking-widest text-white/80 min-[2400px]:col-span-2 min-[2400px]:justify-start min-[2400px]:gap-6">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Bảo mật chuẩn quốc tế
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-4 h-4" /> Đồng hành cùng Mentor 24/7
            </span>
          </div>
        </div>
      </div>

      {/* Cột bên phải - Khu vực Form nhập liệu */}
      <div className="flex w-full items-center justify-center bg-gray-50 p-6 sm:p-12 md:p-16 lg:w-1/2 lg:p-24 min-[2400px]:p-28">
        <div className="auth-form-card w-full rounded-3xl border border-gray-100 bg-white p-8 shadow-soft sm:p-10 space-y-8">
          <div className="text-center md:text-left space-y-2">
            <h2 className="text-3xl font-black text-gray-950 tracking-tight">Chào mừng trở lại</h2>
            <p className="text-xs text-gray-500 font-medium">
              Vui lòng đăng nhập vào tài khoản St3pLearn của bạn để tiếp tục học tập.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit, onInvalid)}>
            <div className="space-y-4">
              {/* Nhập Email */}
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
                  className={`w-full text-xs rounded-xl border px-4 py-3 focus:ring-2 focus:border-transparent outline-none transition-all bg-white ${
                    errors.email ? "border-red-300 focus:ring-red-400" : "border-gray-200 focus:ring-primary"
                  }`}
                />
                {errors.email && (
                  <p className="text-3xs font-bold text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Nhập Mật khẩu */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-2xs font-extrabold uppercase text-gray-400 tracking-wider"
                >
                  Mật khẩu tài khoản
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...registerField("password")}
                    placeholder="••••••••"
                    aria-invalid={Boolean(errors.password)}
                    className={`w-full text-xs rounded-xl border px-4 py-3 focus:ring-2 focus:border-transparent outline-none transition-all bg-white ${
                      errors.password ? "border-red-300 focus:ring-red-400" : "border-gray-200 focus:ring-primary"
                    }`}
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
            </div>

            {/* Các tùy chọn ghi nhớ đăng nhập và quên mật khẩu */}
            <div className="flex items-center justify-between text-xs font-bold text-gray-500">
              <div className="flex items-center">
                <input
                  id="terms"
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-200 text-primary focus:ring-primary cursor-pointer"
                />
                <label
                  htmlFor="terms"
                  className="ml-2 cursor-pointer hover:text-gray-900"
                >
                  Duy trì đăng nhập
                </label>
              </div>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info("Khôi phục mật khẩu", "Vui lòng liên hệ support@St3pLearn.com để được hỗ trợ.");
                }}
                className="text-primary hover:opacity-85 transition-opacity"
              >
                Quên mật khẩu?
              </a>
            </div>

            {/* Nút gửi form đăng nhập */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-95 text-white text-xs font-black py-3.5 rounded-xl shadow-md shadow-pink-200 transition-all transform active:scale-[0.99] disabled:opacity-50 flex items-center justify-center cursor-pointer"
            >
              {isLoading ? "Đang xử lý đăng nhập..." : "Đăng Nhập Ngay"}
            </button>
          </form>

          {/* Đường dẫn sang trang đăng ký tài khoản */}
          <p className="text-center text-xs font-bold text-gray-500">
            Chưa có tài khoản học tập?{" "}
            <Link
              href="/register"
              className="text-primary hover:opacity-85 transition-opacity"
            >
              Đăng ký ngay hôm nay
            </Link>
          </p>
        </div>
      </div>
    </div>
    </GuestGuard>
  );
}

