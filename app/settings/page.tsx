"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  User,
  Shield,
  History,
  AlertTriangle,
  Save,
  X,
  Loader2,
  Edit2,
  ChevronRight,
  Lock,
  ArrowLeft,
  Activity
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth, type UserRole } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/apiConfig";
import { buildAuthHeaders } from "@/lib/authHeaders";
import { useToast } from "@/components/ui/Toast";
import { profileSchema } from "@/lib/validations";
import { RoleDashboardShell } from "@/components/dashboard/RoleDashboardShell";

const extendedProfileSchema = profileSchema.extend({
  timezone: z.string().optional(),
  avatarUrl: z.string().optional(),
});
type ExtendedProfileFormValues = z.infer<typeof extendedProfileSchema>;

export default function SettingsPageWrapper() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <RoleDashboardShell role={(user?.role as UserRole) || "STUDENT"}>
      <SettingsContent />
    </RoleDashboardShell>
  );
}

function SettingsContent() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "history" | "danger">("profile");

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-gray-900">Cài đặt tài khoản</h1>
        <p className="text-xs text-gray-500">Quản lý hồ sơ cá nhân, bảo mật và các thiết lập hệ thống.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-100 pb-px overflow-x-auto hide-scrollbar">
        <TabButton 
          active={activeTab === "profile"} 
          onClick={() => setActiveTab("profile")} 
          icon={User} 
          label="Hồ sơ cá nhân" 
        />
        <TabButton 
          active={activeTab === "security"} 
          onClick={() => setActiveTab("security")} 
          icon={Shield} 
          label="Bảo mật & đăng nhập" 
        />
        <TabButton 
          active={activeTab === "history"} 
          onClick={() => setActiveTab("history")} 
          icon={History} 
          label="Lịch sử hoạt động" 
        />
        <TabButton 
          active={activeTab === "danger"} 
          onClick={() => setActiveTab("danger")} 
          icon={AlertTriangle} 
          label="Danger Zone" 
          danger
        />
      </div>

      {/* Content */}
      <div className="pt-2">
        {activeTab === "profile" && <ProfileSettingsTab token={token} />}
        {activeTab === "security" && <SecuritySettingsTab token={token} />}
        {activeTab === "history" && <HistorySettingsTab token={token} />}
        {activeTab === "danger" && <DangerSettingsTab token={token} />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label, danger = false }: { active: boolean, onClick: () => void, icon: any, label: string, danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
        active
          ? danger
            ? "border-red-500 text-red-600 bg-red-50/50 rounded-t-xl"
            : "border-primary text-primary bg-pink-50/50 rounded-t-xl"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-xl"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function PlaceholderTab({ title, description, danger = false }: { title: string, description: string, danger?: boolean }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-8 text-center space-y-3">
      <div className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center ${danger ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'}`}>
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-extrabold text-gray-900">{title}</h3>
      <p className="text-xs text-gray-500 max-w-sm mx-auto">{description}</p>
    </div>
  );
}

function ProfileSettingsTab({ token }: { token: string | null }) {
  const toast = useToast();
  const { updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: profileData, mutate, isLoading } = useSWR(
    token ? [`${API_BASE_URL}/api/users/me`, token] : null,
    async ([url, t]) => {
      const res = await fetch(url, { headers: buildAuthHeaders(t) });
      if (!res.ok) throw new Error("Fetch failed");
      const body = await res.json();
      return body.data || body;
    },
    { revalidateOnFocus: false }
  );

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ExtendedProfileFormValues>({
    resolver: zodResolver(extendedProfileSchema),
  });

  useEffect(() => {
    if (profileData) {
      reset({
        fullName: profileData.fullName || "",
        bio: profileData.bio || "",
        country: profileData.country || "",
        englishLevel: profileData.englishLevel || "A1",
        birthDate: profileData.birthDate || "",
        timezone: profileData.timezone || "",
        avatarUrl: profileData.avatarUrl || ""
      });
    }
  }, [profileData, reset, isEditing]);

  const onSubmit = async (data: ExtendedProfileFormValues) => {
    if (!token) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(token)
        },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || "Cập nhật thất bại");
      }
      
      toast.success("Cập nhật thông tin thành công");
      await mutate();
      updateUser({ fullName: data.fullName, avatarUrl: data.avatarUrl });
      setIsEditing(false);
    } catch (e: any) {
      toast.error("Lỗi cập nhật", e.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-10 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <p className="text-xs font-semibold text-gray-400">Đang tải hồ sơ...</p>
      </div>
    );
  }

  const levelsList = [
    { value: "NONE", label: "Chưa xác định (None)" },
    { value: "BEGINNER", label: "Mới bắt đầu (Beginner / A1)" },
    { value: "ELEMENTARY", label: "Sơ cấp (Elementary / A2)" },
    { value: "INTERMEDIATE", label: "Trung cấp (Intermediate / B1)" },
    { value: "UPPER_INTERMEDIATE", label: "Trung cao cấp (Upper Intermediate / B2)" },
    { value: "ADVANCED", label: "Cao cấp (Advanced / C1-C2)" }
  ];
  
  const fieldClassName = (field: keyof ExtendedProfileFormValues) =>
    `w-full text-xs rounded-xl border px-4 py-3 focus:ring-2 focus:border-transparent outline-none transition-all ${
      errors[field] ? "border-red-300 focus:ring-red-400" : "border-gray-200 focus:ring-primary"
    }`;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-gray-900">Thông tin cá nhân</h2>
          <p className="text-2xs font-semibold text-gray-400">ID: {profileData?.userId || profileData?.id || "N/A"}</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Cập nhật thông tin
          </button>
        )}
      </div>

      <div className="p-6">
        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Avatar URL */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-2xs font-extrabold uppercase text-gray-400 tracking-wider">Ảnh đại diện (URL)</label>
                <input
                  type="text"
                  {...register("avatarUrl")}
                  placeholder="https://example.com/avatar.jpg"
                  className={fieldClassName("avatarUrl")}
                />
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-2xs font-extrabold uppercase text-gray-400 tracking-wider">Họ và tên</label>
                <input
                  type="text"
                  {...register("fullName")}
                  className={fieldClassName("fullName")}
                />
                {errors.fullName && <p className="text-3xs font-bold text-red-500">{errors.fullName.message}</p>}
              </div>

              {/* Email (Readonly) */}
              <div className="space-y-1.5">
                <label className="text-2xs font-extrabold uppercase text-gray-400 tracking-wider">Email (Không thể sửa)</label>
                <input
                  type="email"
                  value={profileData?.email || ""}
                  disabled
                  className="w-full text-xs rounded-xl border border-gray-100 bg-gray-50 text-gray-400 px-4 py-3 outline-none cursor-not-allowed"
                />
              </div>

              {/* Birth Date */}
              <div className="space-y-1.5">
                <label className="text-2xs font-extrabold uppercase text-gray-400 tracking-wider">Ngày sinh</label>
                <input
                  type="date"
                  {...register("birthDate")}
                  className={fieldClassName("birthDate")}
                />
              </div>

              {/* English Level */}
              <div className="space-y-1.5">
                <label className="text-2xs font-extrabold uppercase text-gray-400 tracking-wider">Trình độ tiếng Anh</label>
                <select
                  {...register("englishLevel")}
                  className="w-full text-xs rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-primary outline-none bg-white cursor-pointer"
                >
                  {levelsList.map(lvl => (
                    <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
                  ))}
                </select>
                {errors.englishLevel && <p className="text-3xs font-bold text-red-500">{errors.englishLevel.message}</p>}
              </div>

              {/* Country */}
              <div className="space-y-1.5">
                <label className="text-2xs font-extrabold uppercase text-gray-400 tracking-wider">Quốc gia</label>
                <input
                  type="text"
                  {...register("country")}
                  placeholder="Vietnam"
                  className={fieldClassName("country")}
                />
              </div>

              {/* Timezone */}
              <div className="space-y-1.5">
                <label className="text-2xs font-extrabold uppercase text-gray-400 tracking-wider">Múi giờ</label>
                <input
                  type="text"
                  {...register("timezone")}
                  placeholder="Asia/Ho_Chi_Minh"
                  className={fieldClassName("timezone")}
                />
              </div>

              {/* Bio */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-2xs font-extrabold uppercase text-gray-400 tracking-wider">Giới thiệu ngắn (Bio)</label>
                <textarea
                  rows={3}
                  {...register("bio")}
                  placeholder="Một vài dòng về bản thân..."
                  className={fieldClassName("bio")}
                />
                {errors.bio && <p className="text-3xs font-bold text-red-500">{errors.bio.message}</p>}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-50">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                className="px-5 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-primary hover:opacity-90 text-white rounded-xl text-xs font-extrabold shadow-md shadow-pink-200 transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu thay đổi
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
            <ViewField label="Họ và tên" value={profileData?.fullName} />
            <ViewField label="Tên đăng nhập" value={profileData?.username || (profileData?.email ? "@" + (profileData?.email.split('@')[0]) : "")} />
            <ViewField label="Email" value={profileData?.email} />
            <ViewField label="Ngày sinh" value={profileData?.birthDate} />
            <ViewField label="Trình độ ngoại ngữ" value={profileData?.englishLevel} />
            <ViewField label="Quốc gia" value={profileData?.country} />
            <ViewField label="Múi giờ" value={profileData?.timezone} />
            <div className="md:col-span-2">
              <ViewField label="Giới thiệu (Bio)" value={profileData?.bio} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ViewField({ label, value }: { label: string, value?: string }) {
  return (
    <div className="space-y-1">
      <span className="text-3xs font-extrabold uppercase text-gray-400 tracking-wider">{label}</span>
      <p className="text-sm font-semibold text-gray-800">{value || <span className="text-gray-300 italic">Chưa cập nhật</span>}</p>
    </div>
  );
}

function SecuritySettingsTab({ token }: { token: string | null }) {
  const [activeView, setActiveView] = useState<"list" | "changePassword">("list");

  if (activeView === "changePassword") {
    return <ChangePasswordForm token={token} onBack={() => setActiveView("list")} />;
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-gray-50">
        <h2 className="text-sm font-extrabold text-gray-900">Bảo mật & đăng nhập</h2>
        <p className="text-xs text-gray-500">Quản lý mật khẩu và các phương thức bảo mật.</p>
      </div>
      <div className="p-2">
        <button
          onClick={() => setActiveView("changePassword")}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Đổi mật khẩu</h3>
              <p className="text-xs text-gray-500">Cập nhật mật khẩu mới để bảo vệ tài khoản tốt hơn.</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </div>
  );
}

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Vui lòng nhập mật khẩu cũ."),
  newPassword: z.string().min(8, "Mật khẩu mới cần ít nhất 8 ký tự."),
  retypeNewPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu mới."),
}).refine(data => data.newPassword === data.retypeNewPassword, {
  message: "Mật khẩu nhập lại không khớp.",
  path: ["retypeNewPassword"],
});

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

function ChangePasswordForm({ token, onBack }: { token: string | null; onBack: () => void }) {
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormValues) => {
    if (!token) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/me/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(token)
        },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || "Đổi mật khẩu thất bại");
      }
      
      toast.success("Đổi mật khẩu thành công!");
      reset();
      onBack();
    } catch (e: any) {
      toast.error("Lỗi", e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const fieldClassName = (field: keyof ChangePasswordFormValues) =>
    `w-full text-xs rounded-xl border px-4 py-3 focus:ring-2 focus:border-transparent outline-none transition-all ${
      errors[field] ? "border-red-300 focus:ring-red-400" : "border-gray-200 focus:ring-primary"
    }`;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-gray-50 flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-50 rounded-lg text-gray-500 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-sm font-extrabold text-gray-900">Đổi mật khẩu</h2>
          <p className="text-2xs text-gray-500">Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.</p>
        </div>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 w-full md:w-1/2 mx-auto">
          <div className="space-y-1.5">
            <label className="text-2xs font-extrabold uppercase text-gray-400 tracking-wider">Mật khẩu hiện tại</label>
            <input type="password" {...register("oldPassword")} className={fieldClassName("oldPassword")} />
            {errors.oldPassword && <p className="text-3xs font-bold text-red-500">{errors.oldPassword.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-2xs font-extrabold uppercase text-gray-400 tracking-wider">Mật khẩu mới</label>
            <input type="password" {...register("newPassword")} className={fieldClassName("newPassword")} />
            {errors.newPassword && <p className="text-3xs font-bold text-red-500">{errors.newPassword.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-2xs font-extrabold uppercase text-gray-400 tracking-wider">Nhập lại mật khẩu mới</label>
            <input type="password" {...register("retypeNewPassword")} className={fieldClassName("retypeNewPassword")} />
            {errors.retypeNewPassword && <p className="text-3xs font-bold text-red-500">{errors.retypeNewPassword.message}</p>}
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-1.5 px-6 py-3 bg-primary hover:opacity-90 text-white rounded-xl text-xs font-extrabold shadow-md shadow-pink-200 transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Xác nhận đổi mật khẩu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HistorySettingsTab({ token }: { token: string | null }) {
  const [page, setPage] = useState(0);
  const size = 10;

  const { data, isLoading, error } = useSWR(
    token ? [`${API_BASE_URL}/api/users/me/login-history?page=${page}&size=${size}`, token] : null,
    async ([url, t]) => {
      const res = await fetch(url, { headers: buildAuthHeaders(t) });
      if (!res.ok) throw new Error("Fetch failed");
      const body = await res.json();
      return body.data;
    },
    { revalidateOnFocus: false }
  );

  const logs = data?.content || [];
  const totalPages = data?.totalPages || 0;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-gray-900">Lịch sử hoạt động</h2>
          <p className="text-xs text-gray-500">Các phiên đăng nhập và hoạt động gần đây của bạn.</p>
        </div>
      </div>
      
      <div className="p-0">
        {isLoading ? (
          <div className="p-10 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <p className="text-xs font-semibold text-gray-400">Đang tải lịch sử...</p>
          </div>
        ) : error ? (
          <div className="p-10 text-center text-red-500 text-xs font-bold">Lỗi khi tải lịch sử hoạt động.</div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-xs font-bold">Chưa có lịch sử hoạt động nào.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {logs.map((log: any, idx: number) => (
              <div key={log.logId || idx} className="p-4 px-6 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{log.eventType || "Đăng nhập thành công"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Thời gian: {new Date(log.timestamp).toLocaleString("vi-VN")}</p>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="mt-3 text-xs text-gray-600 bg-white border border-gray-100 shadow-sm p-3 rounded-xl flex flex-col gap-1.5">
                      {Object.entries(log.metadata).map(([key, value]) => (
                        <div key={key} className="flex items-start gap-2">
                          <span className="font-extrabold capitalize min-w-[70px] text-gray-700">{key}:</span>
                          <span className="text-gray-500 break-all">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/50">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Trang trước
          </button>
          <span className="text-xs font-bold text-gray-500">
            Trang {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
}

function DangerSettingsTab({ token }: { token: string | null }) {
  const [activeView, setActiveView] = useState<"list" | "deleteAccount">("list");

  if (activeView === "deleteAccount") {
    return <DeleteAccountForm token={token} onBack={() => setActiveView("list")} />;
  }

  return (
    <div className="bg-white rounded-3xl border border-red-100 shadow-soft overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-red-50 bg-red-50/30">
        <h2 className="text-sm font-extrabold text-red-600">Danger Zone</h2>
        <p className="text-xs text-red-400">Khu vực nguy hiểm, các hành động tại đây không thể hoàn tác.</p>
      </div>
      <div className="p-2">
        <button
          onClick={() => setActiveView("deleteAccount")}
          className="w-full flex items-center justify-between p-4 hover:bg-red-50 rounded-xl transition-colors text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center group-hover:bg-red-100 transition-colors">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 group-hover:text-red-600 transition-colors">Xóa tài khoản</h3>
              <p className="text-xs text-gray-500">Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu của bạn.</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
        </button>
      </div>
    </div>
  );
}

function DeleteAccountForm({ token, onBack }: { token: string | null; onBack: () => void }) {
  const toast = useToast();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmUsername, setConfirmUsername] = useState("");

  const expectedUsername = user?.username || "";
  const isMatch = confirmUsername === expectedUsername;

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !isMatch) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: "DELETE",
        headers: buildAuthHeaders(token)
      });
      
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || "Xóa tài khoản thất bại");
      }
      
      toast.success("Tài khoản của bạn đã được xóa thành công");
      await logout();
      router.replace("/login");
    } catch (e: any) {
      toast.error("Lỗi", e.message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-red-100 shadow-soft overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-red-50 bg-red-50/30 flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-white rounded-lg text-red-400 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-sm font-extrabold text-red-600">Xác nhận xóa tài khoản</h2>
          <p className="text-2xs text-red-400">Hành động này không thể hoàn tác.</p>
        </div>
      </div>
      <div className="p-6">
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <div className="space-y-1 text-xs text-red-600">
              <p className="font-bold">Cảnh báo quan trọng!</p>
              <p>Bạn đang yêu cầu xóa tài khoản. Tất cả dữ liệu, khóa học và thành tích của bạn sẽ bị mất vĩnh viễn.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleDelete} className="space-y-5 w-full md:w-1/2 mx-auto">
          <div className="space-y-1.5">
            <label className="text-2xs font-extrabold uppercase text-gray-400 tracking-wider">
              Vui lòng nhập <span className="text-red-500">{expectedUsername}</span> để xác nhận
            </label>
            <input 
              type="text" 
              value={confirmUsername}
              onChange={(e) => setConfirmUsername(e.target.value)}
              className="w-full text-xs rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none transition-all"
              placeholder={expectedUsername}
            />
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={!isMatch || isDeleting}
              className="w-full flex items-center justify-center gap-1.5 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-extrabold shadow-md shadow-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
              Xóa vĩnh viễn tài khoản
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
