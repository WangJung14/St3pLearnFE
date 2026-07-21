"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Info, X } from "lucide-react";

interface NotificationDropdownProps {
  token: string | null;
}

export default function NotificationDropdown({ token }: NotificationDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-xl p-2.5 text-gray-500 transition-all hover:bg-gray-100 hover:text-primary"
        aria-label="Mở thông báo"
        aria-expanded={open}
        id="notification-bell"
      >
        <Bell className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="animate-fade-in absolute right-0 z-50 mt-2 w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-gray-200/60 sm:w-[360px]"
          role="dialog"
          aria-labelledby="notification-bell"
        >
          <div className="flex items-center justify-between border-b border-gray-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <span className="text-sm font-extrabold text-gray-900">Thông báo</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
              aria-label="Đóng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50">
              <Info className="h-6 w-6 text-amber-500" />
            </div>
            <p className="text-sm font-bold text-gray-700">
              Chưa có API hộp thư thông báo
            </p>
            <p className="text-xs leading-relaxed text-gray-500">
              {token
                ? "Backend hiện chỉ gửi thông báo qua email và chưa cung cấp API danh sách hoặc đánh dấu đã đọc."
                : "Đăng nhập để nhận các email thông báo từ hệ thống."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
