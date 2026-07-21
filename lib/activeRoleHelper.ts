import { normalizeRole } from "./roleRoutes";
import type { UserRole } from "./authStore";

/**
 * Trích xuất role hiện tại từ URL (Context-aware).
 * Hỗ trợ Multi-session: Tab nào ở URL của role nào thì lấy token của role đó.
 *
 * @returns UserRole (STUDENT, TEACHER, ADMIN, v.v...) hoặc role cuối cùng tương tác
 */
export function getActiveRoleContext(): UserRole {
  // SSR fallback
  if (typeof window === "undefined") return "STUDENT";

  const path = window.location.pathname;

  let activeRole: UserRole | null = null;

  if (path.startsWith("/admin")) activeRole = "ADMIN";
  else if (path.startsWith("/teacher")) activeRole = "TEACHER";
  else if (path.startsWith("/mentor")) activeRole = "MENTOR";
  else if (path.startsWith("/moderator")) activeRole = "MODERATOR";
  else if (path.startsWith("/student") && !path.startsWith("/student/player")) activeRole = "STUDENT";

  // Nếu đang ở trang có context role, lưu lại làm "last active role"
  if (activeRole) {
    localStorage.setItem("st3p_last_active_role", activeRole);
    return activeRole;
  }

  // Nếu đang ở trang public (VD: /courses, /, /pricing)
  // Lấy role vừa dùng gần nhất để load session
  const lastActive = localStorage.getItem("st3p_last_active_role");
  if (lastActive) {
    return normalizeRole(lastActive);
  }

  // Mặc định là STUDENT nếu chưa đăng nhập gì cả
  return "STUDENT";
}

/**
 * Lấy Storage Key riêng biệt cho từng role
 */
export function getRoleStorageKey(baseKey: string, role?: UserRole): string {
  const targetRole = role ?? getActiveRoleContext();
  return `${baseKey}_${targetRole}`;
}
