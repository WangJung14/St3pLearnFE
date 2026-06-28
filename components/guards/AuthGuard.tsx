"use client";
/**
 * AuthGuard — Bảo vệ route yêu cầu đăng nhập.
 *
 * Nếu chưa đăng nhập → redirect /login.
 * Hiển thị `null` trong khi đang kiểm tra session để tránh flash nội dung.
 *
 * Cách dùng:
 * ```tsx
 * return (
 *   <AuthGuard>
 *     <TeacherDashboard />
 *   </AuthGuard>
 * );
 * ```
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface AuthGuardProps {
  children: React.ReactNode;
  /** Trang redirect khi chưa đăng nhập. Mặc định: "/login" */
  redirectTo?: string;
}

export function AuthGuard({ children, redirectTo = "/login" }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  // Đang load session → không render gì để tránh flash
  if (isLoading) return null;

  // Chưa auth → null (redirect đang chạy)
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
