"use client";

import type { ReactNode } from "react";
import { RoleDashboardShell } from "@/components/dashboard/RoleDashboardShell";
import { RoleGuard } from "@/components/guards/RoleGuard";

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allow={["ADMIN"]}>
      <RoleDashboardShell role="ADMIN">{children}</RoleDashboardShell>
    </RoleGuard>
  );
}
