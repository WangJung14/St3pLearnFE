"use client";
/**
 * GuestGuard — Chỉ hiển thị nội dung khi chưa đăng nhập.
 *
 * Nếu đã đăng nhập → redirect /dashboard.
 * Dùng cho Login page và Register page để tránh user đã login quay lại.
 *
 * Cách dùng:
 * ```tsx
 * return (
 *   <GuestGuard>
 *     <LoginForm />
 *   </GuestGuard>
 * );
 * ```
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getRoleFromToken, getRoleHomePath } from "@/lib/roleRoutes";

interface GuestGuardProps {
  children: React.ReactNode;
  /** Trang redirect khi đã đăng nhập. Mặc định: "/dashboard" */
  redirectTo?: string;
}

export function GuestGuard({ children, redirectTo = "/dashboard" }: GuestGuardProps) {
  const { isAuthenticated, isLoading, token, user } = useAuth();
  const router = useRouter();
  const effectiveRole = getRoleFromToken(token) ?? user?.role;

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectTo === "/dashboard" ? getRoleHomePath(effectiveRole) : redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo, effectiveRole]);

  // Đang load session → không render gì để tránh flash form login
  if (isLoading) return null;

  // Đã auth → null (redirect đang chạy)
  if (isAuthenticated) return null;

  return <>{children}</>;
}
