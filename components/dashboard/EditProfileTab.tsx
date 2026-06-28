"use client";

import { Edit, Loader2, Save } from "lucide-react";

interface EditProfileTabProps {
  fullName: string;
  setFullName: (val: string) => void;
  bio: string;
  setBio: (val: string) => void;
  country: string;
  setCountry: (val: string) => void;
  englishLevel: string;
  setEnglishLevel: (val: string) => void;
  birthDate: string;
  setBirthDate: (val: string) => void;
  isUpdating: boolean;
  handleUpdateProfile: (e: React.FormEvent) => void;
  cancelEdit: () => void;
  validationError?: string;
}

export default function EditProfileTab({
  fullName,
  setFullName,
  bio,
  setBio,
  country,
  setCountry,
  englishLevel,
  setEnglishLevel,
  birthDate,
  setBirthDate,
  isUpdating,
  handleUpdateProfile,
  cancelEdit,
  validationError,
}: EditProfileTabProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6 sm:p-8 max-w-3xl animate-fade-in">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Edit className="w-5 h-5 text-primary" />
        Thông tin cá nhân học viên
      </h2>

      {validationError && (
        <p className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
          {validationError}
        </p>
      )}

      <form onSubmit={handleUpdateProfile} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Full name */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">
              Họ và tên
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyen Van A"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm shadow-inner"
              required
            />
          </div>

          {/* Country */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">
              Quốc gia
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Vietnam"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm shadow-inner"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* English level */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">
              Trình độ tiếng Anh
            </label>
            <select
              value={englishLevel}
              onChange={(e) => setEnglishLevel(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary text-sm shadow-sm"
            >
              <option value="A1">A1 (Cơ bản)</option>
              <option value="A2">A2 (Sơ cấp)</option>
              <option value="B1">B1 (Trung cấp)</option>
              <option value="B2">B2 (Trung cao cấp)</option>
              <option value="C1">C1 (Cao cấp)</option>
              <option value="C2">C2 (Thành thạo)</option>
              <option value="IELTS">IELTS Target</option>
              <option value="TOEIC">TOEIC Target</option>
            </select>
          </div>

          {/* Birthdate */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">
              Ngày sinh
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm shadow-inner"
            />
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">
            Giới thiệu ngắn về bản thân
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Hãy chia sẻ mục tiêu học tập tiếng Anh của bạn..."
            rows={4}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm resize-none shadow-inner"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={cancelEdit}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isUpdating}
            className="bg-primary hover:bg-primary/95 text-white font-bold px-6 py-2.5 rounded-xl shadow-md shadow-primary/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer text-sm disabled:opacity-50"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Lưu thông tin</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
