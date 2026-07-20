"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, MailCheck, KeyRound, EyeOff, Eye, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/authStore";
import { useToast } from "@/components/ui/Toast";

export default function ResetPasswordPage() {
  const router = useRouter();
  const toast = useToast();
  
  const { forgotPassword, resetPassword } = useAuthStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      toast.warning("Lỗi", "Vui lòng nhập địa chỉ email của bạn.");
      return;
    }
    
    const isResend = step === 2;
    if (isResend) setIsResending(true);
    else setIsLoading(true);

    try {
      const res = await forgotPassword(email);
      if (res.success) {
        toast.success("Thành công", "Đã gửi mã khôi phục tới email của bạn.");
        if (step === 1) setStep(2);
        setTimeLeft(300); // 5 minutes
      } else {
        toast.error("Thất bại", res.message || "Không thể gửi yêu cầu.");
      }
    } catch (error) {
      toast.error("Lỗi", "Không kết nối được máy chủ.");
    } finally {
      setIsLoading(false);
      setIsResending(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.warning("Lỗi", "Mã OTP phải gồm 6 chữ số.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.warning("Lỗi", "Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warning("Lỗi", "Hai mật khẩu không khớp nhau.");
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await resetPassword({ email, otp, newPassword });
      if (res.success) {
        toast.success("Thành công", "Mật khẩu của bạn đã được thay đổi.");
        router.push("/student/login"); // Đưa về login
      } else {
        toast.error("Thất bại", res.message || "Mã OTP không chính xác.");
      }
    } catch (error) {
      toast.error("Lỗi", "Không kết nối được máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full items-center justify-center bg-gray-50 p-6 sm:p-12 md:p-16 relative min-h-screen">
      <div className="auth-form-card w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-soft sm:p-10 space-y-8 relative">
        <Link 
          href="/login" 
          className="absolute top-8 left-8 text-gray-400 hover:text-primary transition-colors flex items-center justify-center p-2 rounded-full hover:bg-pink-50"
          title="Quay lại"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {step === 1 ? (
          // BƯỚC 1: NHẬP EMAIL
          <>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="bg-pink-50 p-4 rounded-full text-primary">
                <KeyRound className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-black text-gray-950 tracking-tight">Quên mật khẩu?</h2>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Đừng lo lắng! Vui lòng nhập địa chỉ email được liên kết với tài khoản của bạn để nhận mã khôi phục.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSendOTP}>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-xs rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white focus:ring-primary"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-95 text-white text-xs font-black py-3.5 rounded-xl shadow-md transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? "Đang xử lý..." : "Nhận Mã Khôi Phục"}
              </button>
            </form>
          </>
        ) : (
          // BƯỚC 2: NHẬP OTP & ĐẶT LẠI MẬT KHẨU
          <>
            <div className="flex flex-col items-center text-center space-y-4 pt-4">
              <div className="bg-green-50 p-4 rounded-full text-green-600">
                <ShieldCheck className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-black text-gray-950 tracking-tight">Đặt lại mật khẩu</h2>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Mã OTP gồm 6 chữ số đã được gửi đến: <br />
                <span className="font-bold text-gray-900">{email}</span>
              </p>
              {timeLeft > 0 ? (
                <p className="text-xs text-primary font-bold bg-pink-50 px-3 py-1 rounded-full">
                  Mã OTP sẽ có hiệu lực trong ({formatTime(timeLeft)})
                </p>
              ) : (
                <p className="text-xs text-red-500 font-bold bg-red-50 px-3 py-1 rounded-full">
                  Mã OTP đã hết hiệu lực. Vui lòng gửi lại mã mới.
                </p>
              )}
            </div>

            <form className="space-y-4" onSubmit={handleResetPassword}>
              <div className="space-y-1.5 text-center">
                <label
                  htmlFor="otp"
                  className="block text-2xs font-extrabold uppercase text-gray-400 tracking-wider mb-1"
                >
                  Nhập mã OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="123456"
                  className="w-full text-center text-xl font-bold rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white focus:ring-primary tracking-[0.5em]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="newPassword"
                  className="block text-2xs font-extrabold uppercase text-gray-400 tracking-wider"
                >
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white focus:ring-primary"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="confirmPassword"
                  className="block text-2xs font-extrabold uppercase text-gray-400 tracking-wider"
                >
                  Nhập lại mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white focus:ring-primary"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6 || newPassword.length < 6 || newPassword !== confirmPassword}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-95 text-white text-xs font-black py-3.5 rounded-xl shadow-md transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-2"
              >
                {isLoading ? "Đang xử lý..." : "Đặt Lại Mật Khẩu"}
              </button>
            </form>

            <div className="pt-2 text-center border-t border-gray-100 space-y-4">
              <button
                type="button"
                onClick={() => handleSendOTP()}
                disabled={isResending}
                className="text-primary hover:opacity-85 font-bold text-sm transition-opacity flex items-center justify-center gap-1 mx-auto disabled:opacity-50"
              >
                <MailCheck className="w-4 h-4" />
                {isResending ? "Đang gửi lại..." : "Gửi lại mã OTP"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
