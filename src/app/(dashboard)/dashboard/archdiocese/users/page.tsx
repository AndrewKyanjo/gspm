import { ShieldCheck, UserCheck, Users } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getArchdioceseUserOverviews } from "@/features/archdiocese/queries";
import { LEVEL_LABELS, ROLE_LABELS } from "@/lib/permissions/roles";
import { requireAuth } from "@/lib/auth/requireAuth";

export default async function ArchdioceseUsersPage() {
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin"] });
  if (!context.archdioceseId) {
    return null;
  }

  const users = await getArchdioceseUserOverviews(context.archdioceseId);

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/users"
      eyebrow="Archdiocese Users"
      title="User administration"
      subtitle="Role and scope oversight across the full hierarchy."
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Assignments directory"
        description="User records remain tied to hierarchy scope so Archdiocese operations can later delegate into Vicariate surfaces without changing the assignment model."
        actions={<Button href="/dashboard/archdiocese/users/approvals">Open approvals</Button>}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Assignments" value={users.length} helper="All user-role bindings in scope" icon={Users} />
        <StatCard
          label="Primary assignments"
          value={users.filter((user) => user.isPrimary).length}
          helper="Routing home for each user"
          icon={ShieldCheck}
        />
        <StatCard
          label="Active assignments"
          value={users.filter((user) => user.isActive).length}
          helper="Currently enabled records"
          icon={UserCheck}
        />
      </section>

      <SimpleTable
        title="Users and assignments"
        description="The executive layer sees both role and hierarchy placement for every assignment."
        rows={users}
        columns={[
          {
            header: "User",
            cell: (item) => (
              <div className="space-y-1">
                <div className="font-medium">{item.fullName ?? "Unnamed user"}</div>
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
            cell: (item) => item.parishName ?? item.deaneryName ?? item.vicariateName ?? "Archdiocese-wide",
          },
          {
            header: "Status",
            cell: (item) => (
              <div className="flex gap-2">
                <Badge variant={item.isActive ? "success" : "danger"}>{item.isActive ? "active" : "inactive"}</Badge>
                {item.isPrimary ? <Badge variant="info">primary</Badge> : null}
              </div>
            ),
          },
          {
            header: "Assigned",
            cell: (item) => (item.assignedAt ? new Date(item.assignedAt).toLocaleDateString() : "-"),
          },
        ]}
      />
    </ArchdioceseShell>
  );
}
