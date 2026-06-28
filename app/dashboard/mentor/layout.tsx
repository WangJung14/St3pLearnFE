"use client";

import type { ReactNode } from "react";
import { RoleDashboardShell } from "@/components/dashboard/RoleDashboardShell";
import { RoleGuard } from "@/components/guards/RoleGuard";

export default function MentorDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allow={["MENTOR", "ADMIN"]}>
      <RoleDashboardShell role="MENTOR">{children}</RoleDashboardShell>
    </RoleGuard>
  );
}
