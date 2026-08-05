import { Bell, ShieldCheck, Users } from "lucide-react";
import { VicariateShell } from "@/components/dashboard/vicariate/shared/vicariate-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getVicariateSettingsOverview } from "@/features/vicariate/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

export default async function VicariateSettingsPage() {
  const context = await requireAuth({ roles: ["vicariate_head", "vicariate_staff"] });
  if (!context.archdioceseId || !context.vicariateId) return null;

  const { context: vc, users } = await getVicariateSettingsOverview(context.archdioceseId, context.vicariateId);

  return (
    <VicariateShell
      pathname="/dashboard/vicariate/settings"
      eyebrow="Vicariate Settings"
      title="Vicariate settings"
      subtitle="Profile, user access, and operational preferences for the vicariate layer."
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader title="Settings" description="This page centralizes vicariate profile context, assigned users, and supervisory access details." />
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Assigned users" value={users.length} helper="Active vicariate assignments" icon={Users} />
        <StatCard label="Notification mode" value="Enabled" helper="Workflow alerts are visible in the shell" icon={Bell} />
        <StatCard label="Access layer" value="Scoped" helper="Restricted to the current vicariate and deaneries" icon={ShieldCheck} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Vicariate profile</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md bg-surface-container p-4"><p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Vicariate</p><p className="mt-1 text-sm text-on-surface">{vc.vicariateName ?? "-"}</p></div>
            <div className="rounded-md bg-surface-container p-4"><p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Archdiocese</p><p className="mt-1 text-sm text-on-surface">{vc.archdioceseName ?? "-"}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Operational preferences</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-on-surface-variant">
            <p>Vicariate heads can oversee deaneries and parishes, track contribution performance, and monitor report submissions.</p>
            <p>Vicariate staff can view data and support supervisory workflows across the region.</p>
            <p>All actions remain scoped to the currently assigned vicariate.</p>
          </CardContent>
        </Card>
      </section>

      <SimpleTable
        title="Assigned users"
        rows={users}
        columns={[
          { header: "Name", cell: (u) => u.fullName ?? "-" },
          { header: "Email", cell: (u) => u.email ?? "-" },
          { header: "Role", cell: (u) => u.role },
          { header: "Primary", cell: (u) => u.isPrimary ? "Yes" : "No" },
          { header: "Active", cell: (u) => u.isActive ? "Yes" : "No" },
        ]}
      />
    </VicariateShell>
  );
}
