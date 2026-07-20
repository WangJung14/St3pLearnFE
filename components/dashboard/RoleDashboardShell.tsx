"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import {
  Award,
  BookOpen,
  Brain,
  ClipboardCheck,
  Compass,
  Flag,
  FolderTree,
  Hash,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import { useAuth, type UserRole } from "@/context/AuthContext";
import { getRoleFromToken, getRoleHomePath } from "@/lib/roleRoutes";
import { cn } from "@/lib/utils";

type NavIcon = ComponentType<{ className?: string }>;

interface RoleNavItem {
  label: string;
  href: string;
  icon: NavIcon;
}

interface RoleShellConfig {
  label: string;
  badge: string;
  accent: string;
  active: string;
  icon: NavIcon;
  nav: RoleNavItem[];
  footer: string;
}

const ROLE_SHELLS: Record<UserRole, RoleShellConfig> = {
  STUDENT: {
    label: "Student Workspace",
    badge: "Học viên",
    accent: "from-primary to-secondary",
    active: "bg-pink-50 text-primary border-pink-100",
    icon: BookOpen,
    footer: "Student workspace - tiến độ học tập, khóa học và luyện tập cá nhân.",
    nav: [
      { label: "Tổng quan", href: "/student", icon: LayoutDashboard },
      { label: "Khóa học", href: "/courses", icon: BookOpen },
      { label: "Wishlist", href: "/student/wishlist", icon: Heart },
      { label: "Từ vựng", href: "/student/vocabulary", icon: Brain },
      { label: "Chứng chỉ", href: "/student/certificates", icon: Award },
    ],
  },
  TEACHER: {
    label: "Teacher Studio",
    badge: "Giáo viên",
    accent: "from-blue-600 to-cyan-500",
    active: "bg-blue-50 text-blue-700 border-blue-100",
    icon: Users,
    footer: "Teacher studio - quản lý khóa học, nội dung và gửi duyệt.",
    nav: [
      { label: "Tổng quan", href: "/teacher", icon: LayoutDashboard },
      { label: "Khóa học của tôi", href: "/teacher/courses", icon: BookOpen },
      { label: "Tạo khóa học", href: "/teacher/courses/new", icon: PlusCircle },
      { label: "Ngân hàng câu hỏi", href: "/teacher/question-banks", icon: Brain },
    ],
  },
  ADMIN: {
    label: "Admin Console",
    badge: "Quản trị",
    accent: "from-amber-500 to-rose-500",
    active: "bg-amber-50 text-amber-700 border-amber-100",
    icon: ShieldCheck,
    footer: "Admin console - kiểm duyệt, taxonomy và vận hành nền tảng.",
    nav: [
      { label: "Tổng quan", href: "/admin", icon: LayoutDashboard },
      { label: "Quản lý người dùng", href: "/admin/users", icon: Users },
      { label: "Quản lý khóa học", href: "/admin/courses", icon: BookOpen },
      { label: "Duyệt khóa học", href: "/admin/approvals", icon: ClipboardCheck },
      { label: "Categories", href: "/admin/categories", icon: FolderTree },
      { label: "Tags", href: "/admin/tags", icon: Hash },
      { label: "Public catalog", href: "/courses", icon: BookOpen },
    ],
  },
  MENTOR: {
    label: "Mentor Desk",
    badge: "Cố vấn",
    accent: "from-violet-600 to-fuchsia-500",
    active: "bg-violet-50 text-violet-700 border-violet-100",
    icon: UserCheck,
    footer: "Mentor desk - theo dõi học viên, phản hồi và đồng hành học tập.",
    nav: [
      { label: "Tổng quan", href: "/mentor", icon: LayoutDashboard },
      { label: "Học viên", href: "/mentor", icon: Users },
      { label: "Chat", href: "/chat", icon: MessageSquare },
      { label: "Cộng đồng", href: "/forum", icon: Compass },
    ],
  },
  MODERATOR: {
    label: "Moderator Hub",
    badge: "Điều phối",
    accent: "from-emerald-600 to-teal-500",
    active: "bg-emerald-50 text-emerald-700 border-emerald-100",
    icon: Flag,
    footer: "Moderator hub - theo dõi cộng đồng, phản hồi và báo cáo nội dung.",
    nav: [
      { label: "Tổng quan", href: "/moderator", icon: LayoutDashboard },
      { label: "Cộng đồng", href: "/forum", icon: MessageSquare },
      { label: "Chat", href: "/chat", icon: Sparkles },
      { label: "Catalog", href: "/courses", icon: BookOpen },
    ],
  },
};

interface RoleDashboardShellProps {
  role: UserRole;
  children: ReactNode;
}

export function RoleDashboardShell({ role, children }: RoleDashboardShellProps) {
  const config = ROLE_SHELLS[role];
  const RoleIcon = config.icon;
  const pathname = usePathname();
  const router = useRouter();
  const { token, user, logout } = useAuth();
  const currentRole = getRoleFromToken(token) ?? user?.role ?? role;
  const currentHome = getRoleHomePath(currentRole);
  const initial = (user?.fullName || user?.username || user?.email || config.badge)
    .trim()
    .slice(0, 1)
    .toUpperCase();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const renderNavLink = (item: RoleNavItem, index: number, compact = false) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = item.icon;

    return (
      <Link
        key={`${compact ? "mobile" : "desktop"}-${item.href}-${item.label}-${index}`}
        href={item.href}
        className={cn(
          "inline-flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-extrabold transition",
          compact ? "shrink-0" : "w-full",
          isActive
            ? config.active
            : "border-transparent text-gray-500 hover:border-gray-100 hover:bg-white hover:text-gray-900"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-950">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="dashboard-shell-container flex h-16 items-center justify-between gap-4">
          <Link href={currentHome} className="flex min-w-0 items-center gap-3">
            <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm", config.accent)}>
              <RoleIcon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black text-gray-950">{config.label}</span>
              <span className="block truncate text-2xs font-extrabold uppercase text-gray-400">{config.badge}</span>
            </span>
          </Link>

          <div className="flex min-w-0 items-center gap-2">
            <Link
              href="/"
              className="hidden items-center gap-2 rounded-xl px-3 py-2 text-xs font-extrabold text-gray-500 transition hover:bg-gray-50 hover:text-primary sm:inline-flex"
            >
              <Home className="h-4 w-4" />
              Trang chủ
            </Link>
            <Link href="/settings" className="flex min-w-0 items-center gap-2 rounded-full border border-gray-100 bg-gray-50 p-1 pr-3 hover:bg-gray-100 transition-colors">
              <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-black text-white", config.accent)}>
                {initial}
              </span>
              <span className="hidden max-w-36 truncate text-xs font-extrabold text-gray-700 sm:block">
                {user?.fullName || user?.username || user?.email || config.badge}
              </span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-red-500 transition hover:bg-red-50 hover:text-red-700"
              aria-label="Đăng xuất"
              title="Đăng xuất"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-shell-container flex gap-0">
        <aside className="hidden w-64 shrink-0 border-r border-gray-100 py-6 pr-5 lg:block">
          <nav className="space-y-1.5">{config.nav.map((item, index) => renderNavLink(item, index))}</nav>
        </aside>

        <main className="min-w-0 flex-1 py-5 lg:pl-8">
          <nav className="-mx-4 mb-5 flex gap-2 overflow-x-auto border-b border-gray-100 px-4 pb-4 sm:-mx-6 sm:px-6 lg:hidden">
            {config.nav.map((item, index) => renderNavLink(item, index, true))}
          </nav>
          <div className="min-w-0">{children}</div>
        </main>
      </div>

      <footer className="border-t border-gray-100 bg-white">
        <div className="dashboard-shell-container flex flex-col gap-2 py-5 text-xs font-bold text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <span>{config.footer}</span>
          <Link href={currentHome} className="text-primary hover:opacity-80">
            Về dashboard
          </Link>
        </div>
      </footer>
    </div>
  );
}
