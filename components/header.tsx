"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutDashboard, LogOut, Menu, Settings, UserCircle, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getRoleFromToken, getRoleHomePath } from "@/lib/roleRoutes";
import NotificationDropdown from "@/components/ui/NotificationDropdown";

export default function Header() {
  const { user, token, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const currentRole = getRoleFromToken(token) ?? user?.role ?? "STUDENT";
  const dashboardHref = getRoleHomePath(currentRole);
  const displayName = user?.fullName || user?.username || user?.email || "Học viên";
  const userInitial =
    user?.fullName?.substring(0, 1) || user?.username?.substring(0, 1) || "H";

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const navLinks = [
    { label: "Khóa Học", href: "/courses" },
    { label: "Bảng Giá", href: "/pricing" },
    { label: "Cộng Đồng", href: "/forum" },
    { label: "Trò Chuyện", href: "/chat" },
  ];

  if (isAuthenticated) {
    navLinks.unshift({ label: "Học Tập", href: dashboardHref });
  }

  const handleLogout = () => {
    setShowMobileMenu(false);
    setShowUserMenu(false);
    logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 shadow-sm backdrop-blur-md">
      <div className="site-container flex h-20 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            className="flex items-center gap-2 text-2xl font-black text-primary transition-opacity hover:opacity-90"
            href="/"
          >
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-tr from-primary to-secondary shadow-md shadow-pink-200">
              <svg width="24" height="24" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="scale-95">
                <path fill="white" d="M101.141 53H136.632C151.023 53 162.689 64.6662 162.689 79.0573V112.904H148.112V79.0573C148.112 78.7105 148.098 78.3662 148.072 78.0251L112.581 112.898C112.701 112.902 112.821 112.904 112.941 112.904H148.112V126.672H112.941C98.5504 126.672 86.5638 114.891 86.5638 100.5V66.7434H101.141V100.5C101.141 101.15 101.191 101.792 101.289 102.422L137.56 66.7816C137.255 66.7563 136.945 66.7434 136.632 66.7434H101.141V53Z" />
                <path fill="white" d="M65.2926 124.136L14 66.7372H34.6355L64.7495 100.436V66.7372H80.1365V118.47C80.1365 126.278 70.4953 129.958 65.2926 124.136Z" />
              </svg>
            </div>
            <span className="hidden bg-gradient-to-r from-primary to-secondary bg-clip-text tracking-tight text-transparent sm:inline">
              St3pLearn
            </span>
          </Link>

          <nav className="hidden gap-4 md:flex">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  className={`rounded-xl px-3.5 py-2 text-sm font-bold transition-all ${
                    isActive
                      ? "bg-pink-50 text-primary"
                      : "text-gray-500 hover:bg-gray-50 hover:text-primary"
                  }`}
                  href={link.href}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {isAuthenticated ? (
            <div className="relative flex items-center gap-2 sm:gap-3">
              {/* Notification dropdown */}
              <NotificationDropdown token={token ?? null} />

              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu((value) => !value);
                  }}
                  className="flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50 p-1 transition hover:border-pink-100 hover:bg-pink-50 sm:pl-2 sm:pr-3"
                  aria-label="Mở menu tài khoản"
                  aria-expanded={showUserMenu}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white bg-gradient-to-br from-primary to-secondary text-xs font-extrabold uppercase text-white shadow-sm">
                    {userInitial}
                  </span>
                  <span className="hidden max-w-[120px] truncate text-xs font-bold text-gray-700 lg:block">
                    {displayName}
                  </span>
                  <ChevronDown
                    className={`hidden h-4 w-4 text-gray-400 transition sm:block ${
                      showUserMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showUserMenu && (
                  <div className="animate-fade-in absolute right-0 z-50 mt-3 w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl sm:w-72">
                    <div className="border-b border-gray-50 bg-gray-50/70 px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-black uppercase text-white">
                          {userInitial}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-gray-900">
                            {displayName}
                          </p>
                          <p className="mt-0.5 text-2xs font-extrabold uppercase tracking-wider text-gray-400">
                            {currentRole}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      <Link
                        href={dashboardHref}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-pink-50 hover:text-primary"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                      <Link
                        href={dashboardHref}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950"
                      >
                        <UserCircle className="h-4 w-4" />
                        Hồ sơ tài khoản
                      </Link>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-gray-400"
                        title="Trang cài đặt riêng chưa được triển khai"
                      >
                        <Settings className="h-4 w-4" />
                        Cài đặt
                        <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-4xs font-black uppercase text-gray-400">
                          Soon
                        </span>
                      </button>
                    </div>

                    <div className="border-t border-gray-50 p-2">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-extrabold text-red-600 transition hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="hidden rounded-xl p-2.5 text-red-500 transition-all hover:bg-red-50 hover:text-red-700 sm:inline-flex"
                title="Đăng xuất"
                aria-label="Đăng xuất"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-4 sm:flex">
              <Link
                href="/student/login"
                className="text-sm font-bold text-gray-500 transition-colors hover:text-primary"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-gradient-to-r from-primary to-secondary px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-pink-200 transition-all hover:opacity-95 active:scale-95"
              >
                Đăng ký
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setShowMobileMenu((value) => !value);
              setShowUserMenu(false);
            }}
            className="inline-flex items-center justify-center rounded-xl border border-gray-100 bg-white p-2.5 text-gray-500 shadow-sm transition hover:text-primary md:hidden"
            aria-label="Toggle mobile menu"
            aria-expanded={showMobileMenu}
          >
            {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {showMobileMenu && (
        <div className="border-t border-gray-100 bg-white px-4 py-4 shadow-sm md:hidden">
          <nav className="grid gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setShowMobileMenu(false)}
                  className={`rounded-xl px-4 py-3 text-sm font-extrabold transition ${
                    isActive
                      ? "bg-pink-50 text-primary"
                      : "text-gray-600 hover:bg-gray-50 hover:text-primary"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {isAuthenticated ? (
            <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
              <div className="rounded-xl bg-gray-50 px-4 py-3">
                <p className="truncate text-sm font-extrabold text-gray-800">
                  {user?.fullName || user?.username || user?.email}
                </p>
                <p className="mt-1 text-2xs font-extrabold uppercase tracking-wider text-gray-400">
                  Vai trò hiện tại: {currentRole}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-extrabold text-red-600"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
              <Link
                href="/student/login"
                onClick={() => setShowMobileMenu(false)}
                className="rounded-xl border border-gray-100 px-4 py-3 text-center text-sm font-extrabold text-gray-600"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                onClick={() => setShowMobileMenu(false)}
                className="rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-3 text-center text-sm font-extrabold text-white shadow-md shadow-pink-100"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
