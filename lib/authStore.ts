/**
 * authStore — Zustand store cho auth state management.
 *
 * Thay thế React Context AuthProvider với Zustand store nhẹ hơn.
 * Giữ nguyên 100% logic từ AuthContext.tsx — chỉ đổi cơ chế state management.
 *
 * Cách dùng:
 * ```ts
 * import { useAuthStore } from "@/lib/authStore";
 *
 * const { token, user, login, logout } = useAuthStore();
 * ```
 *
 * Lưu ý: Consumer files nên tiếp tục dùng `useAuth()` từ `@/context/AuthContext`
 * (thin wrapper) để không phải đổi import path.
 */

import { create } from "zustand";
import { mutate as globalMutate } from "swr";
import { API_BASE_URL } from "@/lib/apiConfig";
import { getRoleHomePath, normalizeRole } from "@/lib/roleRoutes";
import { getRoleStorageKey } from "@/lib/activeRoleHelper";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserRole =
  | "STUDENT"
  | "TEACHER"
  | "ADMIN"
  | "MENTOR"
  | "MODERATOR";

export interface User {
  id?: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  username?: string;
  role?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  fullName: string;
}

export interface AuthResult {
  success: boolean;
  message?: string;
  user?: User;
  role?: UserRole;
  redirectTo?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<AuthResult>;
  register: (data: RegisterData) => Promise<AuthResult>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  hydrate: () => void;
}

// ---------------------------------------------------------------------------
// JWT decode helper
// ---------------------------------------------------------------------------

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,

  // ---------------------------------------------------------------------------
  // hydrate — Restore session từ localStorage (gọi 1 lần khi app mount)
  // ---------------------------------------------------------------------------
  hydrate: () => {
    try {
      const tokenKey = getRoleStorageKey("st3p_token");
      const userKey = getRoleStorageKey("st3p_user");

      const savedToken = localStorage.getItem(tokenKey);
      const savedUser = localStorage.getItem(userKey);

      const tokenPayload = savedToken ? decodeJwt(savedToken) : null;
      const tokenRoles = tokenPayload?.roles as string[] | undefined;
      const tokenRole =
        tokenRoles && tokenRoles.length > 0
          ? tokenRoles[0]
          : (tokenPayload?.role as string | undefined);

      if (savedToken && savedUser) {
        const parsedUser = JSON.parse(savedUser) as User;
        set({
          token: savedToken,
          user: { ...parsedUser, role: normalizeRole(tokenRole ?? parsedUser.role) },
          isAuthenticated: true,
          isLoading: false,
        });
      } else if (savedToken) {
        set({ token: savedToken, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      console.error("Failed to restore auth session:", err);
      localStorage.removeItem(getRoleStorageKey("st3p_user"));
      set({ isLoading: false });
    }
  },

  // ---------------------------------------------------------------------------
  // login
  // ---------------------------------------------------------------------------
  login: async (email: string, password: string): Promise<AuthResult> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let body: Record<string, unknown> | null = null;
      try {
        body = (await res.json()) as Record<string, unknown>;
      } catch {
        // ignore JSON parse error
      }

      const data = body?.data as Record<string, unknown> | undefined;

      if (!res.ok || !data?.accessToken) {
        return {
          success: false,
          message: (body?.message as string) ?? "Đăng nhập thất bại",
        };
      }

      const accessToken = data.accessToken as string;
      const refreshToken = (data.refreshToken as string | undefined) ?? null;

      // Chưa lưu token ngay ở đây vì cần biết chính xác role. Tạm thời dùng biến local
      // hoặc lấy role từ tokenPayload
      const tokenPayload = decodeJwt(accessToken);
      const tempRole = normalizeRole(tokenPayload?.role as string | undefined);
      const tokenKeyTemp = getRoleStorageKey("st3p_token", tempRole);
      const refreshKeyTemp = getRoleStorageKey("st3p_refresh_token", tempRole);

      localStorage.setItem(tokenKeyTemp, accessToken);
      if (refreshToken) {
        localStorage.setItem(refreshKeyTemp, refreshToken);
      }

      // Gọi /api/users/me để lấy thông tin user chính xác từ server
      let userData: User;
      try {
        const meRes = await fetch(`${API_BASE_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (meRes.ok) {
          const meBody = (await meRes.json()) as Record<string, unknown>;
          const meData = (meBody?.data ?? meBody) as Record<string, unknown>;

          // Backend có thể trả về role (string) hoặc roles (array)
          const rolesArr = meData?.roles as string[] | undefined;
          const roleStr = meData?.role as string | undefined;
          const decodedRole = decodeJwt(accessToken)?.role as string | undefined;
          const resolvedRole = normalizeRole(
            rolesArr && rolesArr.length > 0 ? rolesArr[0] : roleStr ?? decodedRole
          );

          userData = {
            id: (meData?.id ?? meData?.userId) as string | undefined,
            fullName:
              (meData?.fullName ?? meData?.name ?? data?.username) as string | undefined,
            email: (meData?.email ?? email) as string,
            avatarUrl: (meData?.avatarUrl ?? meData?.avatar) as string | undefined,
            username: (meData?.username ?? data?.username) as string | undefined,
            role: resolvedRole,
          };
        } else {
          // Fallback: decode JWT
          throw new Error("GET /api/users/me failed");
        }
      } catch {
        // Fallback nếu /me thất bại — decode JWT
        const payload = decodeJwt(accessToken);
        userData = {
          fullName: (data?.username ?? "Học Viên") as string,
          email,
          avatarUrl: data?.avatarUrl as string | undefined,
          username: data?.username as string | undefined,
          role: normalizeRole(payload?.role as string | undefined),
        };
      }

      const resolvedRole = normalizeRole(userData.role);
      const tokenKey = getRoleStorageKey("st3p_token", resolvedRole);
      const userKey = getRoleStorageKey("st3p_user", resolvedRole);
      const refreshKey = getRoleStorageKey("st3p_refresh_token", resolvedRole);

      // Nếu temp role khác resolved role, cần đổi key
      if (tempRole !== resolvedRole) {
        localStorage.removeItem(tokenKeyTemp);
        localStorage.removeItem(refreshKeyTemp);
        localStorage.setItem(tokenKey, accessToken);
        if (refreshToken) {
          localStorage.setItem(refreshKey, refreshToken);
        }
      }

      set({ token: accessToken, user: userData, isAuthenticated: true });
      localStorage.setItem(userKey, JSON.stringify(userData));

      // Revalidate toàn bộ SWR cache
      globalMutate(() => true, undefined, { revalidate: true });

      const role = normalizeRole(userData.role);
      return {
        success: true,
        user: userData,
        role,
        redirectTo: getRoleHomePath(role),
      };
    } catch {
      return { success: false, message: "Lỗi kết nối server" };
    }
  },

  // ---------------------------------------------------------------------------
  // register
  // ---------------------------------------------------------------------------
  register: async (data: RegisterData): Promise<AuthResult> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      let body: Record<string, unknown> | null = null;
      try {
        body = (await res.json()) as Record<string, unknown>;
      } catch {
        // ignore
      }

      if (res.ok) {
        return { success: true };
      }

      return {
        success: false,
        message: (body?.message as string) ?? "Đăng ký thất bại. Vui lòng thử lại.",
      };
    } catch {
      return { success: false, message: "Lỗi kết nối server" };
    }
  },

  // ---------------------------------------------------------------------------
  // logout
  // ---------------------------------------------------------------------------
  logout: () => {
    set({ token: null, user: null, isAuthenticated: false });

    const tokenKey = getRoleStorageKey("st3p_token");
    const userKey = getRoleStorageKey("st3p_user");
    const refreshKey = getRoleStorageKey("st3p_refresh_token");

    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
    localStorage.removeItem(refreshKey);

    // Clear toàn bộ SWR cache
    globalMutate(() => true, undefined, { revalidate: false });
  },

  // ---------------------------------------------------------------------------
  // updateUser
  // ---------------------------------------------------------------------------
  updateUser: (data: Partial<User>) => {
    const prev = get().user;
    const updated = { ...(prev ?? {}), ...data };
    const userKey = getRoleStorageKey("st3p_user", updated.role as UserRole | undefined);
    set({ user: updated });
    localStorage.setItem(userKey, JSON.stringify(updated));
  },
}));
