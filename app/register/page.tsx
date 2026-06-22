"use client";
import { Eye, EyeOff, BookOpen } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== retypePassword) {
      alert("Mật khẩu nhập lại không khớp!");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          username,
          password,
          fullName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Registration successful", data);
        alert("Đăng ký thành công! Hãy đăng nhập bằng tài khoản mới.");
        router.push("/login");
      } else {
        const errorData = await res.json().catch(() => null);
        alert(
          `Đăng ký thất bại: ${errorData?.message || "Vui lòng kiểm tra lại thông tin"}`
        );
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Có lỗi xảy ra khi kết nối tới máy chủ!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Side - Visual/Branding (Hidden on mobile) */}
      <div className="hidden md:flex md:w-1/2 bg-primary flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-primary/60" />

        <div className="relative z-10 text-white text-center space-y-6 max-w-[512px]">
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
              <BookOpen className="w-16 h-16 text-white/80" />
            </div>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight">St3pLearn</h1>
          <p className="text-xl text-white/80 font-medium leading-relaxed">
            Bắt đầu hành trình học tập cùng St3pLearn. Hàng ngàn khóa học chất
            lượng đang chờ đón bạn.
          </p>
        </div>
      </div>

      {/* Right Side - Form Area */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:px-16 lg:px-24 bg-white">
        <div className="w-full max-w-112 space-y-8">
          <div className="text-center md:text-left space-y-2">
            <h2 className="text-3xl font-bold text-gray-900">
              Create an account
            </h2>
            <p className="text-gray-500">
              Bắt đầu hành trình học tập cùng St3pLearn.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleRegister}>
            <div className="space-y-4">
              {/* Row 1: Full Name & Username */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="fullname"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Full Name
                  </label>
                  <input
                    id="fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyen Van A"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="nguyenvana123"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  required
                />
              </div>

              {/* Row 3: Password & Retype Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="retype-password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Retype Password
                  </label>
                  <div className="relative">
                    <input
                      id="retype-password"
                      type={showRetypePassword ? "text" : "password"}
                      value={retypePassword}
                      onChange={(e) => setRetypePassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRetypePassword(!showRetypePassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showRetypePassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:opacity-80 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
