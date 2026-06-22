"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Grid, Settings, Loader2 } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ProfileHeader from "@/components/dashboard/ProfileHeader";
import OverviewTab from "@/components/dashboard/OverviewTab";
import EditProfileTab from "@/components/dashboard/EditProfileTab";

// khai bao kieu du lieu
interface Profile {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  bio: string;
  country: string;
  timezone: string;
  englishLevel: string;
  birthDate: string;
}

interface EnrolledCourse {
  title: string;
  slug: string;
  thumbnail: string;
  progress: number;
  lastActive: string;
}

// may cai mock data
const MOCK_PROFILE: Profile = {
  userId: "mock",
  username: "demo_user",
  email: "demo@gmail.com",
  fullName: "Bùi Gia Hân",
  avatarUrl: "",
  bio: "Học viên tiếng Anh xuất sắc, đang chinh phục mục tiêu IELTS 7.5+",
  country: "Vietnam",
  timezone: "Asia/Ho_Chi_Minh",
  englishLevel: "B2",
  birthDate: "2005-06-15",
};

const MOCK_ENROLLED: EnrolledCourse[] = [
  {
    title: "IELTS Masterclass: Step-by-Step 7.5+",
    slug: "ielts-masterclass-step-by-step-7-5",
    thumbnail: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=400",
    progress: 75,
    lastActive: "2 giờ trước",
  },
  {
    title: "English Grammar for Beginners & Intermediate",
    slug: "english-grammar-for-beginners-intermediate",
    thumbnail: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=400",
    progress: 30,
    lastActive: "Hôm qua",
  },
];

// goi api chung
const fetcher = async ([url, token]: [string, string]) => {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw new Error("Fetch profile failed");

  const json = await res.json();
  return json.data as Profile;
};

export default function DashboardPage() {
  const { token, isAuthenticated, isLoading, logout, updateUser } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"overview" | "edit-profile">("overview");

  // Profile Form States
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("");
  const [englishLevel, setEnglishLevel] = useState("B2");
  const [birthDate, setBirthDate] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // chua dang nhap thi da ve trang login nha
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // fetch thong tin profile tu gateway 8080
  const { data: profileResponse, mutate } = useSWR(
    token ? ["http://localhost:8080/api/users/me", token] : null,
    fetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  const profile = profileResponse || MOCK_PROFILE;

  // fill data vao form de sua
  useEffect(() => {
    if (!profileResponse) return;

    setFullName(profileResponse.fullName || "");
    setBio(profileResponse.bio || "");
    setCountry(profileResponse.country || "");
    setEnglishLevel(profileResponse.englishLevel || "B2");
    setBirthDate(profileResponse.birthDate || "");

    updateUser?.({ fullName: profileResponse.fullName });
  }, [profileResponse]);

  // update lai profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsUpdating(true);

    try {
      // goi qua port 8080 nha
      const res = await fetch("http://localhost:8080/api/users/me", {
        method: "POST", // Giữ nguyên POST theo UserController backend mapping
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          bio,
          country,
          englishLevel,
          birthDate: birthDate || null,
        }),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        alert(body?.message || "Cập nhật thất bại");
        return;
      }

      alert("Cập nhật thành công!");

      updateUser?.({ fullName });

      // update lai local state swr cho nhanh
      mutate(
        {
          ...profileResponse,
          fullName,
          bio,
          country,
          englishLevel,
          birthDate,
        } as Profile,
        false
      );

      setActiveTab("overview");
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối server");
    } finally {
      setIsUpdating(false);
    }
  };

  // dang load
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-gray-500 font-medium">Đang kiểm tra bảo mật...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto w-full px-4 py-10 flex-grow">
        {/* header thong tin user */}
        <ProfileHeader profile={profile} logout={logout} />

        {/* menu tab */}
        <div className="flex border-b border-gray-200 mb-8 gap-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Grid className="w-4 h-4" />
            Tổng quan học tập
          </button>
          <button
            onClick={() => setActiveTab("edit-profile")}
            className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "edit-profile"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Settings className="w-4 h-4" />
            Chỉnh sửa hồ sơ
          </button>
        </div>

        {/* noi dung tab */}
        {activeTab === "overview" ? (
          <OverviewTab enrolledCourses={MOCK_ENROLLED} />
        ) : (
          <EditProfileTab
            fullName={fullName}
            setFullName={setFullName}
            bio={bio}
            setBio={setBio}
            country={country}
            setCountry={setCountry}
            englishLevel={englishLevel}
            setEnglishLevel={setEnglishLevel}
            birthDate={birthDate}
            setBirthDate={setBirthDate}
            isUpdating={isUpdating}
            handleUpdateProfile={handleUpdateProfile}
            cancelEdit={() => setActiveTab("overview")}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
