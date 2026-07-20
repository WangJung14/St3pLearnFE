"use client";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, MailCheck } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { useToast } from "@/components/ui/Toast";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const emailQuery = searchParams.get("email") || "";
  const router = useRouter();
  const toast = useToast();
  
  const { verifyEmail, resendVerificationEmail } = useAuthStore();
  const [email, setEmail] = useState(emailQuery);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  useEffect(() => {
    if (emailQuery) {
      setEmail(emailQuery);
    }
  }, [emailQuery]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.warning("Lỗi", "Mã xác thực phải gồm 6 chữ số.");
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await verifyEmail(email, otp);
      if (res.success) {
        toast.success("Xác thực thành công!", "Tài khoản của bạn đã được kích hoạt.");
        router.push("/student/login");
      } else {
        toast.error("Xác thực thất bại", res.message || "Mã OTP không chính xác.");
      }
    } catch (error) {
      toast.error("Lỗi", "Không thể kết nối đến máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.warning("Lỗi", "Không tìm thấy địa chỉ email.");
      return;
    }
    setIsResending(true);
    try {
      const res = await resendVerificationEmail(email);
      if (res.success) {
        toast.success("Đã gửi mã", "Vui lòng kiểm tra hộp thư đến hoặc thư rác (Spam).");
        setTimeLeft(300); // Reset timer to 5 minutes
      } else {
        toast.error("Gửi thất bại", res.message || "Vui lòng thử lại sau.");
      }
    } catch (error) {
      toast.error("Lỗi", "Không thể kết nối đến máy chủ.");
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="flex w-full items-center justify-center bg-gray-50 p-6 sm:p-12 md:p-16 relative min-h-screen">
      <div className="auth-form-card w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-soft sm:p-10 space-y-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="bg-green-50 p-4 rounded-full text-green-600">
            <MailCheck className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-gray-950 tracking-tight">Xác thực Email</h2>
          <p className="text-sm text-gray-500 font-medium leading-relaxed">
            Chúng tôi đã gửi một mã OTP gồm 6 chữ số đến email <br />
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

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-1.5 text-center">
            <label
              htmlFor="otp"
              className="block text-xs font-extrabold uppercase text-gray-400 tracking-wider mb-2"
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
              className="w-full text-center text-2xl font-bold rounded-xl border border-gray-200 px-4 py-4 focus:ring-2 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white focus:ring-primary tracking-[0.5em]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-95 text-white text-sm font-black py-4 rounded-xl shadow-md transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
          >
            {isLoading ? "Đang xác thực..." : "Xác Nhận Ngay"}
          </button>
        </form>

        <div className="pt-4 text-center border-t border-gray-100 space-y-4">
          <p className="text-xs font-medium text-gray-500">
            Chưa nhận được mã OTP?{" "}
          </p>
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-primary hover:opacity-85 font-bold text-sm transition-opacity flex items-center justify-center gap-1 mx-auto disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            {isResending ? "Đang gửi lại..." : "Gửi lại mã xác thực"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
