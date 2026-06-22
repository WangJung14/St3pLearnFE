"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { mutate as globalMutate } from "swr";

interface User {
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  username?: string;
}

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;

  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string }>;

  logout: () => void;

  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // lay token voi user tu localstorage luc vao trang
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("st3p_token");
      const savedUser = localStorage.getItem("st3p_user");

      if (savedToken) setToken(savedToken);

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.error("Invalid localStorage user:", err);
      localStorage.removeItem("st3p_user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // dang nhap
  const login = async (email: string, password: string) => {
    try {
      // goi gateway 8080 de qua identity service nha
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      // parse json thoi, cho vao try catch cho chac
      let body: any = null;
      try {
        body = await res.json();
      } catch (e) {}

      if (res.ok && body?.data?.accessToken) {
        const accessToken = body.data.accessToken;
        const userData: User = {
          fullName: body.data.username || "Học Viên",
          email: body.data.email,
          avatarUrl: body.data.avatarUrl,
          username: body.data.username,
        };

        setToken(accessToken);
        setUser(userData);

        localStorage.setItem("st3p_token", accessToken);
        localStorage.setItem("st3p_user", JSON.stringify(userData));

        // xoa cache swr de load lai data moi cho dep
        globalMutate(() => true, undefined, { revalidate: true });

        return { success: true };
      }

      return {
        success: false,
        message: body?.message || "Đăng nhập thất bại",
      };
    } catch (err) {
      return {
        success: false,
        message: "Lỗi kết nối server",
      };
    }
  };

  // dang xuat
  const logout = () => {
    setToken(null);
    setUser(null);

    localStorage.removeItem("st3p_token");
    localStorage.removeItem("st3p_user");

    // xoa het cache cua swr luon
    globalMutate(() => true, undefined, { revalidate: false });
  };

  // cap nhat thong tin user
  const updateUser = (data: Partial<User>) => {
    setUser((prev) => {
      const updated = { ...(prev || {}), ...data };

      localStorage.setItem("st3p_user", JSON.stringify(updated));

      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: !!token,
        isLoading,
        user,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// hook de xai cho nhanh
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
