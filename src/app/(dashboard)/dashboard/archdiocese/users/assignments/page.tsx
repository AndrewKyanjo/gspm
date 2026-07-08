// src/app/(dashboard)/dashboard/archdiocese/users/assignments/page.tsx
import { ShieldCheck, UserCheck, Users } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getArchdioceseUserOverviews } from "@/features/archdiocese/queries";
import { ROLE_LABELS, LEVEL_LABELS } from "@/lib/permissions/roles";
import { requireAuth } from "@/lib/auth/requireAuth";

export default async function UserAssignmentsPage() {
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin"] });
  if (!context.archdioceseId) return null;

  const assignments = await getArchdioceseUserOverviews(context.archdioceseId);

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/users"
      eyebrow="Archdiocese Users"
      title="Assignment management"
      subtitle="Manage user-role bindings across the full hierarchy."
      actions={
        <Button href="/dashboard/archdiocese/users" variant="secondary">
          Users directory
        </Button>
      }
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Assignments"
        description="Each row represents a user-role binding with hierarchy scope. Use the admin panel or API to modify assignments."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Total assignments"
          value={assignments.length}
          helper="All user-role bindings"
          icon={Users}
        />
        <StatCard
          label="Primary"
          value={assignments.filter((a) => a.isPrimary).length}
          helper="Default dashboard routing"
          icon={ShieldCheck}
        />
        <StatCard
          label="Active"
          value={assignments.filter((a) => a.isActive).length}
          helper="Currently enabled"
          icon={UserCheck}
        />
      </section>

      <SimpleTable
        title="All assignments"
        description="Each user may have multiple assignments across different hierarchy levels."
        rows={assignments}
        columns={[
          {
            header: "User",
            cell: (item) => (
              <div className="space-y-1">
                <div className="font-medium">{item.fullName ?? "Unnamed"}</div>
                <div className="text-xs text-on-surface-variant">{item.email ?? "No email"}</div>
              </div>
            ),
          },
          {
            header: "Role",
            cell: (item) => ROLE_LABELS[item.role as keyof typeof ROLE_LABELS] ?? item.role,
          },
          {
            header: "Level",
            cell: (item) => LEVEL_LABELS[item.level],
          },
          {
            header: "Scope",
            cell: (item) =>
              item.parishName ?? item.deaneryName ?? item.vicariateName ?? "Archdiocese-wide",
          },
          {
            header: "Status",
            cell: (item) => (
              <div className="flex gap-1">
                <Badge variant={item.isActive ? "success" : "danger"}>
                  {item.isActive ? "active" : "inactive"}
                </Badge>
                {item.isPrimary && <Badge variant="info">primary</Badge>}
              </div>
            ),
          },
          {
            header: "Open",
            cell: (item) => (
              <Button
                href={`/dashboard/archdiocese/users/assignments/${item.id}`}
                size="sm"
                variant="secondary"
              >
                View
              </Button>
            ),
          },
        ]}
      />

      <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
        <p className="text-sm font-semibold text-on-surface mb-2">Management actions</p>
        <p className="text-sm text-on-surface-variant">
          Assignment mutations (create, update, toggle active/primary, change scope) are available via the
          server actions in <code className="text-xs bg-surface-container px-1 py-0.5 rounded">src/features/archdiocese/actions.ts</code>:
          <code className="text-xs bg-surface-container px-1 py-0.5 rounded ml-1">toggleAssignmentActive</code>,
          <code className="text-xs bg-surface-container px-1 py-0.5 rounded ml-1">setPrimaryAssignment</code>,
          <code className="text-xs bg-surface-container px-1 py-0.5 rounded ml-1">updateAssignmentScope</code>.
          These are gated to <strong>super_admin</strong> and <strong>archdiocese_admin</strong> roles.
        </p>
      </div>
    </ArchdioceseShell>
  );
}
