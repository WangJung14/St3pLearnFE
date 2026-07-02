"use client";
/**
 * AuthHydrator — Component nhẹ đặt trong root layout.
 *
 * Gọi `hydrate()` từ Zustand auth store 1 lần khi mount
 * để restore session từ localStorage.
 *
 * Thay thế AuthProvider wrapper — không wrap children,
 * chỉ cần render cạnh chúng.
 *
 * Cách dùng trong layout.tsx:
 * ```tsx
 * <AuthHydrator />
 * <ToastProvider>
 *   {children}
 * </ToastProvider>
 * ```
 */

import { useEffect } from "react";
import { useAuthStore } from "@/lib/authStore";

export function AuthHydrator() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return null;
}
