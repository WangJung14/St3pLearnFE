"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { RoleDashboardShell } from "@/components/dashboard/RoleDashboardShell";
import { RoleGuard } from "@/components/guards/RoleGuard";

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.endsWith("/login")) {
    return <>{children}</>;
  }

  return (
    <RoleGuard allow={["ADMIN"]}>
      <RoleDashboardShell role="ADMIN">{children}</RoleDashboardShell>
    </RoleGuard>
  );
}
