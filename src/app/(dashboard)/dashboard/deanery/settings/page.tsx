import { Bell, ShieldCheck, Users } from "lucide-react";
import { DeaneryShell } from "@/components/dashboard/deanery/shared/deanery-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDeanerySettingsOverview } from "@/features/deanery/settings/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

export default async function DeanerySettingsPage() {
  const context = await requireAuth({ roles: ["deanery_head", "deanery_staff"] });
  if (!context.deaneryId) return null;

  const { context: deanery, users } = await getDeanerySettingsOverview(context.deaneryId);

  return (
    <DeaneryShell
      pathname="/dashboard/deanery/settings"
      eyebrow="Deanery Settings"
      title="Deanery settings"
      subtitle="Profile, user access, and operational preferences for the deanery layer."
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader title="Settings" description="This page centralizes deanery profile context, assigned users, and supervisory access details." />
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Assigned users" value={users.length} helper="Active deanery assignments" icon={Users} />
        <StatCard label="Notification mode" value="Enabled" helper="Workflow alerts are visible in the shell" icon={Bell} />
        <StatCard label="Access layer" value="Scoped" helper="Restricted to the current deanery and parishes" icon={ShieldCheck} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Deanery profile</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md bg-surface-container p-4"><p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Deanery</p><p className="mt-1 text-sm text-on-surface">{deanery.deaneryName ?? "-"}</p></div>
            <div className="rounded-md bg-surface-container p-4"><p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Vicariate</p><p className="mt-1 text-sm text-on-surface">{deanery.vicariateName ?? "-"}</p></div>
            <div className="rounded-md bg-surface-container p-4"><p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Archdiocese</p><p className="mt-1 text-sm text-on-surface">{deanery.archdioceseName ?? "-"}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Approval preferences</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-on-surface-variant">
            <p>Deanery heads can approve, reject, or return parish reports after review.</p>
            <p>Deanery staff can add review comments and support supervisory workflows.</p>
            <p>All actions remain scoped to the currently assigned deanery.</p>
          </CardContent>
        </Card>
      </section>

      <SimpleTable
        title="Assigned users"
        rows={users}
        columns={[
          { header: "Name", cell: (user) => user.fullName ?? "-" },
          { header: "Email", cell: (user) => user.email ?? "-" },
          { header: "Role", cell: (user) => user.role },
          { header: "Primary", cell: (user) => (user.isPrimary ? "Yes" : "No") },
          { header: "Active", cell: (user) => (user.isActive ? "Yes" : "No") },
        ]}
      />
    </DeaneryShell>
  );
}
