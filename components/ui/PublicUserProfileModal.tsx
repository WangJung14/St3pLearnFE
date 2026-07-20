"use client";

import React, { useEffect } from "react";
import useSWR from "swr";
import { X, Loader2, User, MapPin } from "lucide-react";
import { API_BASE_URL } from "@/lib/apiConfig";

interface PublicUserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicId?: string | null;
}

export default function PublicUserProfileModal({ isOpen, onClose, publicId }: PublicUserProfileModalProps) {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const { data: profile, isLoading, error } = useSWR(
    isOpen && publicId ? `${API_BASE_URL}/api/users/p/${publicId}` : null,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch public profile");
      const body = await res.json();
      return body.data; // { username, fullName, avatarUrl, bio, country }
    }
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
      <div 
        className="absolute inset-0" 
        onClick={onClose} 
      ></div>
      
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {!publicId ? (
          <div className="p-8 text-center text-gray-500">
            Không tìm thấy thông tin người dùng.
          </div>
        ) : isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm font-bold text-gray-400">Đang tải hồ sơ...</p>
          </div>
        ) : error || !profile ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8" />
            </div>
            <p className="text-gray-900 font-bold mb-1">Tài khoản ẩn danh</p>
            <p className="text-sm text-gray-500">Hồ sơ này không tồn tại hoặc đã bị khóa.</p>
          </div>
        ) : (
          <div className="pb-6">
            {/* Header / Cover */}
            <div className="h-24 bg-gradient-to-r from-primary/20 to-primary-container"></div>
            
            <div className="px-6 relative text-center -mt-12">
              {/* Avatar */}
              <div className="w-24 h-24 bg-white rounded-full mx-auto p-1 mb-3 shadow-sm">
                {profile.avatarUrl ? (
                  <img 
                    src={profile.avatarUrl} 
                    alt={profile.username}
                    className="w-full h-full rounded-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="w-10 h-10 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* Info */}
              <h3 className="text-xl font-black text-gray-900 line-clamp-1">
                {profile.fullName || profile.username}
              </h3>
              <p className="text-sm text-gray-500 font-bold mt-1">@{profile.username}</p>
              
              {profile.country && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mt-2 font-semibold">
                  <MapPin className="w-3.5 h-3.5" />
                  {profile.country}
                </div>
              )}

              <div className="mt-5 pt-5 border-t border-gray-100">
                <p className="text-sm text-gray-600 line-clamp-3">
                  {profile.bio || "Người dùng này chưa cập nhật tiểu sử."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
