"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { RoleDashboardShell } from "@/components/dashboard/RoleDashboardShell";
import { RoleGuard } from "@/components/guards/RoleGuard";

export default function MentorDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.endsWith("/login")) {
    return <>{children}</>;
  }

  return (
    <RoleGuard allow={["MENTOR", "ADMIN"]}>
      <RoleDashboardShell role="MENTOR">{children}</RoleDashboardShell>
    </RoleGuard>
  );
}
