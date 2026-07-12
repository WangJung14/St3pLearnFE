"use client";
/**
 * RoleGuard — Bảo vệ route theo role người dùng.
 *
 * Nếu chưa đăng nhập → redirect /login.
 * Nếu sai role → redirect /dashboard (hoặc `fallback`).
 *
 * Cách dùng:
 * ```tsx
 * return (
 *   <RoleGuard allow={["TEACHER", "ADMIN"]}>
 *     <TeacherCurriculumPage />
 *   </RoleGuard>
 * );
 * ```
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type UserRole } from "@/context/AuthContext";
import { getRoleFromToken, getRoleHomePath, normalizeRole } from "@/lib/roleRoutes";
import { getActiveRoleContext } from "@/lib/activeRoleHelper";

interface RoleGuardProps {
  /** Danh sách role được phép truy cập */
  allow: UserRole[];
  children: React.ReactNode;
  /** Trang redirect nếu sai role. Mặc định: "/dashboard" */
  fallback?: string;
}

export function RoleGuard({ allow, children, fallback }: RoleGuardProps) {
  const { isAuthenticated, isLoading, token, user } = useAuth();
  const router = useRouter();

  const effectiveRole = getRoleFromToken(token) ?? normalizeRole(user?.role);
  const hasRole = isAuthenticated && allow.includes(effectiveRole);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      const targetRole = getActiveRoleContext().toLowerCase();
      router.replace(`/${targetRole}/login`);
      return;
    }

    if (!hasRole) {
      router.replace(fallback ?? getRoleHomePath(effectiveRole));
    }
  }, [isAuthenticated, isLoading, hasRole, router, fallback, effectiveRole]);

  // Đang load hoặc chưa auth → null
  if (isLoading || !isAuthenticated) return null;

  // Sai role → null (redirect đang chạy)
  if (!hasRole) return null;

  return <>{children}</>;
}
