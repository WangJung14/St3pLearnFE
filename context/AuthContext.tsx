/**
 * AuthContext — Thin wrapper re-exporting từ Zustand auth store.
 *
 * File này giữ nguyên export path để 25+ consumer files
 * không cần thay đổi import:
 * ```ts
 * import { useAuth } from "@/context/AuthContext";
 * ```
 *
 * Toàn bộ logic đã chuyển sang `@/lib/authStore` (Zustand).
 */

// Re-export types từ store
export type { User, UserRole, RegisterData } from "@/lib/authStore";

// Re-export useAuthStore nhưng đóng gói qua tên cũ `useAuth`
import { useAuthStore } from "@/lib/authStore";

export function useAuth() {
  return useAuthStore();
}
