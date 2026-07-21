"use client";

import Link from "next/link";
import { Flag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function CourseReportForm({ courseId, slug }: { courseId?: string; slug?: string }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !["STUDENT", "TEACHER"].includes(user?.role ?? "")) return null;

  const targetSlug = slug || courseId;

  return (
    <Link
      href={`/courses/${targetSlug}/report`}
      className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-red-600 transition-colors shrink-0"
    >
      <Flag className="h-4 w-4" /> Báo cáo khóa học
    </Link>
  );
}