"use client";

import type { ReactNode } from "react";
import { RoleDashboardShell } from "@/components/dashboard/RoleDashboardShell";
import { RoleGuard } from "@/components/guards/RoleGuard";

export default function ModeratorDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allow={["MODERATOR", "ADMIN"]}>
      <RoleDashboardShell role="MODERATOR">{children}</RoleDashboardShell>
    </RoleGuard>
  );
}
