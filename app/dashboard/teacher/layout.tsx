"use client";

import type { ReactNode } from "react";
import { RoleDashboardShell } from "@/components/dashboard/RoleDashboardShell";
import { RoleGuard } from "@/components/guards/RoleGuard";

export default function TeacherDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allow={["TEACHER", "ADMIN"]}>
      <RoleDashboardShell role="TEACHER">{children}</RoleDashboardShell>
    </RoleGuard>
  );
}
