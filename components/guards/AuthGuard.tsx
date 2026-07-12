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
import { getActiveRoleContext } from "@/lib/activeRoleHelper";

interface AuthGuardProps {
  children: React.ReactNode;
  /** Trang redirect khi chưa đăng nhập. Nếu bỏ trống, sẽ tự nhận diện role context */
  redirectTo?: string;
}

export function AuthGuard({ children, redirectTo }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const targetRole = getActiveRoleContext().toLowerCase();
      const finalRedirect = redirectTo ?? `/${targetRole}/login`;
      router.replace(finalRedirect);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  // Đang load session → không render gì để tránh flash
  if (isLoading) return null;

  // Chưa auth → null (redirect đang chạy)
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
