"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { mutate as globalMutate } from "swr";
import { API_BASE_URL } from "@/lib/apiConfig";
import { getRoleHomePath, normalizeRole } from "@/lib/roleRoutes";

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

interface AuthResult {
  success: boolean;
  message?: string;
  user?: User;
  role?: UserRole;
  redirectTo?: string;
}

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;

  login: (email: string, password: string) => Promise<AuthResult>;
  register: (data: RegisterData) => Promise<AuthResult>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;

}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session từ localStorage khi app khởi động
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("st3p_token");
      const savedUser = localStorage.getItem("st3p_user");

      const tokenPayload = savedToken ? decodeJwt(savedToken) : null;
      const tokenRoles = tokenPayload?.roles as string[] | undefined;
      const tokenRole =
        tokenRoles && tokenRoles.length > 0
          ? tokenRoles[0]
          : tokenPayload?.role as string | undefined;

      if (savedToken) setToken(savedToken);
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser) as User;
        setUser({ ...parsedUser, role: normalizeRole(tokenRole ?? parsedUser.role) });
      }
    } catch (err) {
      console.error("Failed to restore auth session:", err);
      localStorage.removeItem("st3p_user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // login
  // ---------------------------------------------------------------------------

  const login = async (email: string, password: string): Promise<AuthResult> => {
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

      // Lưu tokens
      localStorage.setItem("st3p_token", accessToken);
      if (refreshToken) {
        localStorage.setItem("st3p_refresh_token", refreshToken);
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

      setToken(accessToken);
      setUser(userData);
      localStorage.setItem("st3p_user", JSON.stringify(userData));

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
  };

  // ---------------------------------------------------------------------------
  // register
  // ---------------------------------------------------------------------------

  const register = async (data: RegisterData): Promise<AuthResult> => {
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
  };

  // ---------------------------------------------------------------------------
  // logout
  // ---------------------------------------------------------------------------

  const logout = () => {
    setToken(null);
    setUser(null);

    localStorage.removeItem("st3p_token");
    localStorage.removeItem("st3p_user");
    localStorage.removeItem("st3p_refresh_token");

    // Clear toàn bộ SWR cache
    globalMutate(() => true, undefined, { revalidate: false });
  };

  // ---------------------------------------------------------------------------
  // updateUser
  // ---------------------------------------------------------------------------

  const updateUser = (data: Partial<User>) => {
    setUser((prev) => {
      const updated = { ...(prev ?? {}), ...data };
      localStorage.setItem("st3p_user", JSON.stringify(updated));
      return updated;
    });
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: !!token,
        isLoading,
        user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
