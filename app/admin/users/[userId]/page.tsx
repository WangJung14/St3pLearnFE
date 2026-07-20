"use client";

import React from "react";
import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/apiConfig";
import { buildAuthHeaders } from "@/lib/authHeaders";
import { useToast } from "@/components/ui/Toast";
import { ArrowLeft, Loader2, User, Mail, Calendar, Key, Lock, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

export default function AdminUserDetailPage() {
  const { userId } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const toast = useToast();

  const { data: user, isLoading, error, mutate } = useSWR(
    token ? [`${API_BASE_URL}/api/admin/users/${userId}`, token] : null,
    async ([url, t]) => {
      const res = await fetch(url, { headers: buildAuthHeaders(t) });
      if (!res.ok) throw new Error("Fetch failed");
      const body = await res.json();
      return body.data;
    }
  );

  const handleToggleRole = async (roleName: string) => {
    if (!user || !token) return;
    const isAssigning = !(user.roles?.includes(roleName));
    try {
      const url = isAssigning 
        ? `${API_BASE_URL}/api/admin/users/${userId}/roles`
        : `${API_BASE_URL}/api/admin/users/${userId}/roles/${roleName}`;
      const method = isAssigning ? "POST" : "DELETE";
      const body = isAssigning ? JSON.stringify({ roleName }) : undefined;
      
      const res = await fetch(url, {
        method,
        headers: {
          ...buildAuthHeaders(token),
          ...(isAssigning ? { "Content-Type": "application/json" } : {}),
        },
        body
      });
      
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.message || "Cập nhật quyền thất bại");
      }
      
      mutate();
      toast.success(`Đã ${isAssigning ? "cấp" : "thu hồi"} quyền ${roleName} thành công.`);
    } catch (e: any) {
      toast.error("Lỗi", e.message);
    }
  };

  const handleUpdateStatus = async (action: "lock" | "suspend" | "activate") => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/${action}`, {
        method: "PUT",
        headers: buildAuthHeaders(token)
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.message || "Cập nhật trạng thái thất bại");
      }
      mutate();
      toast.success("Cập nhật trạng thái thành công!");
    } catch (e: any) {
      toast.error("Lỗi", e.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-sm font-bold text-gray-500">Đang tải thông tin người dùng...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-20 text-center">
        <p className="text-red-500 font-bold">Lỗi tải dữ liệu người dùng.</p>
        <button onClick={() => router.back()} className="mt-4 text-xs font-bold text-gray-500 underline">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const roleConfigs = [
    { name: "ADMIN", label: "Quản trị viên (Admin)", color: "amber" },
    { name: "TEACHER", label: "Giáo viên (Teacher)", color: "blue" },
    { name: "MENTOR", label: "Cố vấn (Mentor)", color: "violet" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()} 
          className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            {user.username}
            {user.status === "ACTIVE" ? (
              <span className="px-2 py-0.5 rounded-lg bg-green-100 text-green-700 text-xs font-extrabold border border-green-200">ACTIVE</span>
            ) : user.status === "LOCKED" ? (
              <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-extrabold border border-gray-200">LOCKED</span>
            ) : (
              <span className="px-2 py-0.5 rounded-lg bg-red-100 text-red-700 text-xs font-extrabold border border-red-200">{user.status}</span>
            )}
          </h1>
          <p className="text-xs text-gray-400 mt-1 font-mono">ID: {user.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-6 space-y-6">
            <h2 className="text-sm font-extrabold text-gray-900 border-b border-gray-100 pb-3">Thông tin hồ sơ</h2>
            <div className="flex gap-6">
              <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center border-4 border-amber-50 shrink-0">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-amber-500" />
                )}
              </div>
              <div className="space-y-3 flex-1 min-w-0">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xs font-extrabold text-gray-400 uppercase tracking-wider">Họ và tên</p>
                    <p className="text-sm font-bold text-gray-800 truncate">{user.fullName || "Chưa cập nhật"}</p>
                  </div>
                  <div>
                    <p className="text-2xs font-extrabold text-gray-400 uppercase tracking-wider">Email</p>
                    <p className="text-sm font-bold text-gray-800 truncate flex items-center gap-1.5">
                      {user.email}
                      {user.emailVerified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-2xs font-extrabold text-gray-400 uppercase tracking-wider">Tiểu sử</p>
                  <p className="text-xs text-gray-600 line-clamp-2">{user.bio || "Không có tiểu sử"}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-2xs font-bold text-gray-400">Ngày tham gia</p>
                  <p className="text-xs font-bold text-gray-800">{new Date(user.createdAt).toLocaleDateString("vi-VN")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-2xs font-bold text-gray-400">Đăng nhập lần cuối</p>
                  <p className="text-xs font-bold text-gray-800">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("vi-VN") : "Chưa từng đăng nhập"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Roles & Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-6">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
              <Key className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-extrabold text-gray-900">Quản lý Phân quyền</h2>
            </div>
            <div className="space-y-3">
              {roleConfigs.map((role) => {
                const hasRole = user.roles?.includes(role.name) || false;
                return (
                  <div key={role.name} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <span className="text-xs font-bold text-gray-700">{role.label}</span>
                    <button 
                      onClick={() => handleToggleRole(role.name)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${hasRole ? 'bg-amber-500' : 'bg-gray-200'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${hasRole ? 'translate-x-2' : '-translate-x-2'}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-red-100 shadow-soft p-6">
            <div className="flex items-center gap-2 border-b border-red-50 pb-3 mb-4">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-extrabold text-red-600">Trạng thái tài khoản</h2>
            </div>
            
            <div className="space-y-3">
              {user.status !== "ACTIVE" && (
                <button
                  onClick={() => handleUpdateStatus("activate")}
                  className="w-full flex items-center justify-between px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl text-xs font-bold transition-colors border border-green-200"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Kích hoạt lại
                  </div>
                </button>
              )}

              {user.status !== "LOCKED" && (
                <button
                  onClick={() => handleUpdateStatus("lock")}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition-colors border border-gray-200"
                >
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Khóa tài khoản
                  </div>
                </button>
              )}

              {user.status !== "SUSPENDED" && (
                <button
                  onClick={() => handleUpdateStatus("suspend")}
                  className="w-full flex items-center justify-between px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-colors border border-red-200"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Đình chỉ tài khoản
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
