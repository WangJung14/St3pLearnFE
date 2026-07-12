"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Bell,
  BookOpen,
  Trophy,
  MessageSquare,
  Info,
  Check,
  CheckCheck,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationType = "course_update" | "achievement" | "review" | "system";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;      // ISO string
  isRead: boolean;
  href?: string;
}

// ---------------------------------------------------------------------------
// Mock fallback data
// ---------------------------------------------------------------------------

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    type: "review",
    title: "Nhận xét mới",
    message: "Bài tập Writing Task 2 của bạn đã được Mentor nhận xét chi tiết.",
    time: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    isRead: false,
    href: "/student",
  },
  {
    id: "notif-2",
    type: "course_update",
    title: "Chương học mới",
    message: "Khóa học IELTS Masterclass 7.5+ vừa cập nhật chương mới: Kỹ thuật làm bài Listening Part 4.",
    time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    href: "/courses",
  },
  {
    id: "notif-3",
    type: "achievement",
    title: "Chuỗi học tập!",
    message: "Chúc mừng! Bạn đã duy trì chuỗi 5 ngày học liên tiếp. Tiếp tục phát huy!",
    time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
  },
  {
    id: "notif-4",
    type: "system",
    title: "Cập nhật hệ thống",
    message: "St3pLearn vừa ra mắt tính năng mới: Theo dõi tiến độ học tập chi tiết theo ngày.",
    time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Vừa xong";
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} giờ trước`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD} ngày trước`;
    return d.toLocaleDateString("vi-VN");
  } catch {
    return iso;
  }
}

function typeConfig(type: NotificationType) {
  switch (type) {
    case "course_update":
      return { Icon: BookOpen, bg: "bg-blue-50", iconColor: "text-blue-500" };
    case "achievement":
      return { Icon: Trophy, bg: "bg-amber-50", iconColor: "text-amber-500" };
    case "review":
      return { Icon: MessageSquare, bg: "bg-pink-50", iconColor: "text-pink-500" };
    case "system":
    default:
      return { Icon: Info, bg: "bg-gray-50", iconColor: "text-gray-400" };
  }
}

// ---------------------------------------------------------------------------
// localStorage persistence
// ---------------------------------------------------------------------------

const STORAGE_KEY = "st3p_read_notifications";

function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Hook: useNotifications
// ---------------------------------------------------------------------------

function useNotifications(token: string | null) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const applyReadState = useCallback((raw: AppNotification[]): AppNotification[] => {
    const readIds = getReadIds();
    return raw.map((n) => ({ ...n, isRead: n.isRead || readIds.has(n.id) }));
  }, []);

  const fetchNotifications = useCallback(async () => {
    // TODO: replace with real API when backend adds /api/notifications
    // if (token) {
    //   const res = await fetch(`${API_BASE_URL}/api/notifications`, {
    //     headers: { Authorization: `Bearer ${token}` }
    //   });
    //   if (res.ok) {
    //     const body = await res.json();
    //     setNotifications(applyReadState(body.data ?? []));
    //     setLoading(false);
    //     return;
    //   }
    // }
    await new Promise((r) => setTimeout(r, 400));
    setNotifications(applyReadState(MOCK_NOTIFICATIONS));
    setLoading(false);
  }, [token, applyReadState]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = useCallback((id: string) => {
    const readIds = getReadIds();
    readIds.add(id);
    saveReadIds(readIds);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const readIds = getReadIds();
      prev.forEach((n) => readIds.add(n.id));
      saveReadIds(readIds);
      return prev.map((n) => ({ ...n, isRead: true }));
    });
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return { notifications, loading, unreadCount, markAsRead, markAllAsRead };
}

// ---------------------------------------------------------------------------
// NotificationDropdown component
// ---------------------------------------------------------------------------

interface NotificationDropdownProps {
  token: string | null;
}

export default function NotificationDropdown({ token }: NotificationDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } =
    useNotifications(token);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
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
      {/* Bell trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-xl p-2.5 text-gray-500 transition-all hover:bg-gray-100 hover:text-primary"
        aria-label="Mở thông báo"
        aria-expanded={open}
        id="notification-bell"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="animate-fade-in absolute right-0 z-50 mt-2 w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-gray-200/60 sm:w-[360px]"
          role="dialog"
          aria-labelledby="notification-bell"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <span className="text-sm font-extrabold text-gray-900">Thông báo</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-black text-primary">
                  {unreadCount} mới
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-gray-400 transition hover:bg-gray-50 hover:text-primary"
                  title="Đánh dấu tất cả đã đọc"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Đọc tất cả</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="divide-y divide-gray-50">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 px-4 py-3.5">
                    <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-gray-100" />
                    <div className="flex-1 space-y-2 py-0.5">
                      <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
                      <div className="h-2.5 w-full animate-pulse rounded bg-gray-100" />
                      <div className="h-2.5 w-2/3 animate-pulse rounded bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50">
                  <Bell className="h-6 w-6 text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-400">Không có thông báo nào</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((n) => {
                  const { Icon, bg, iconColor } = typeConfig(n.type);
                  return (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      onKeyDown={(e) => { if (e.key === "Enter") markAsRead(n.id); }}
                      tabIndex={0}
                      role="button"
                      className={`group relative flex cursor-pointer gap-3 px-4 py-3.5 outline-none transition-colors hover:bg-gray-50/80 focus-visible:bg-gray-50 ${
                        !n.isRead ? "bg-pink-50/40" : ""
                      }`}
                    >
                      {/* Unread indicator */}
                      {!n.isRead && (
                        <span className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary" />
                      )}

                      {/* Type icon */}
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                        <Icon className={`h-4 w-4 ${iconColor}`} />
                      </div>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-bold leading-snug ${n.isRead ? "text-gray-600" : "text-gray-900"}`}>
                            {n.title}
                          </p>
                          {n.isRead && <Check className="mt-0.5 h-3 w-3 shrink-0 text-gray-300" />}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-gray-500">
                          {n.message}
                        </p>
                        <span className="mt-1 block text-[10px] font-semibold text-gray-400">
                          {formatTime(n.time)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {!loading && notifications.length > 0 && (
            <div className="border-t border-gray-50 px-4 py-2.5 text-center">
              <button
                type="button"
                className="text-xs font-bold text-primary transition hover:underline"
              >
                Xem tất cả thông báo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
