import type { UserRole } from "@/context/AuthContext";

export const ROLE_HOME_PATH: Record<UserRole, string> = {
  STUDENT: "/dashboard/student",
  TEACHER: "/dashboard/teacher",
  ADMIN: "/dashboard/admin",
  MENTOR: "/dashboard/mentor",
  MODERATOR: "/dashboard/moderator",
};

const VALID_ROLES = new Set<UserRole>([
  "STUDENT",
  "TEACHER",
  "ADMIN",
  "MENTOR",
  "MODERATOR",
]);

export function normalizeRole(role?: string | null): UserRole {
  const normalized = role?.trim().toUpperCase();
  return VALID_ROLES.has(normalized as UserRole) ? (normalized as UserRole) : "STUDENT";
}

export function getRoleHomePath(role?: string | null): string {
  return ROLE_HOME_PATH[normalizeRole(role)];
}

export function getRoleFromToken(token?: string | null): UserRole | null {
  if (!token) return null;

  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(paddedBase64)) as { role?: string; roles?: string[] };
    const role = payload.roles && payload.roles.length > 0 ? payload.roles[0] : payload.role;
    return role ? normalizeRole(role) : null;
  } catch {
    return null;
  }
}
