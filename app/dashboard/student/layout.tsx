"use client";

import type { ReactNode } from "react";
import { RoleDashboardShell } from "@/components/dashboard/RoleDashboardShell";
import { RoleGuard } from "@/components/guards/RoleGuard";

export default function StudentDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allow={["STUDENT", "ADMIN"]}>
      <RoleDashboardShell role="STUDENT">{children}</RoleDashboardShell>
    </RoleGuard>
  );
}
