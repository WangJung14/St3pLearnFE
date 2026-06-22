"use client";

import { User as UserIcon, LogOut, MapPin } from "lucide-react";

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

interface ProfileHeaderProps {
  profile: Profile;
  logout: () => void;
}

export default function ProfileHeader({ profile, logout }: ProfileHeaderProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6 sm:p-8 mb-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
      <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20 shrink-0 shadow-sm">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.fullName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <UserIcon className="w-12 h-12" />
          )}
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-gray-900">
            {profile.fullName || "Học Viên"}
          </h1>
          <p className="text-sm text-gray-500 flex items-center gap-1.5 justify-center sm:justify-start">
            <span>@{profile.username}</span> • <span>{profile.email}</span>
          </p>
          {profile.bio && (
            <p className="text-sm text-gray-600 max-w-xl line-clamp-2">
              {profile.bio}
            </p>
          )}
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
            {profile.englishLevel && (
              <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Level: {profile.englishLevel}
              </span>
            )}
            {profile.country && (
              <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                {profile.country}
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={logout}
        className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2.5 rounded-xl text-sm font-bold border border-red-200/50 hover:border-red-200 transition-all shrink-0 cursor-pointer shadow-sm"
      >
        <LogOut className="w-4 h-4" />
        Đăng xuất
      </button>
    </div>
  );
}
