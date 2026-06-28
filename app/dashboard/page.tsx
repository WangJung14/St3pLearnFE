"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getRoleFromToken, getRoleHomePath } from "@/lib/roleRoutes";

export default function DashboardRedirectPage() {
  const { isAuthenticated, isLoading, token, user } = useAuth();
  const router = useRouter();
  const effectiveRole = getRoleFromToken(token) ?? user?.role;

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    router.replace(getRoleHomePath(effectiveRole));
  }, [isAuthenticated, isLoading, router, effectiveRole]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-gray-600">
      <div className="flex items-center gap-3 text-sm font-extrabold">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        Đang mở dashboard phù hợp...
      </div>
    </main>
  );
}
