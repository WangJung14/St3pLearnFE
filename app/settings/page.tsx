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
  Edit2
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
        {activeTab === "security" && <PlaceholderTab title="Bảo mật & đăng nhập" description="Tính năng đổi mật khẩu và quản lý 2FA sẽ được cập nhật sớm." />}
        {activeTab === "history" && <PlaceholderTab title="Lịch sử hoạt động" description="Lịch sử đăng nhập và các phiên hoạt động trên thiết bị của bạn." />}
        {activeTab === "danger" && <PlaceholderTab title="Danger Zone" description="Vô hiệu hóa hoặc xóa tài khoản vĩnh viễn." danger />}
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
