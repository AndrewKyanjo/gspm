import { Building2, Landmark, ShieldCheck, UserCheck } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getArchdioceseSettingsSnapshot } from "@/features/archdiocese/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

export default async function ArchdioceseSettingsPage() {
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin"] });
  if (!context.archdioceseId) {
    return null;
  }

  const snapshot = await getArchdioceseSettingsSnapshot(context.archdioceseId, context.userId);

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/settings"
      eyebrow="Archdiocese Settings"
      title="Executive settings"
      subtitle="Profile, hierarchy, and governance configuration for the top-level dashboard."
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Settings"
        description="This settings surface documents the current hierarchy-aware posture and keeps the future Vicariate insertion explicit."
        actions={<Button href="/dashboard/archdiocese/settings/hierarchy" variant="secondary">Open hierarchy settings</Button>}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Vicariates" value={snapshot.totalVicariates} helper="Immediate child layer" icon={Building2} />
        <StatCard label="Deaneries" value={snapshot.totalDeaneries} helper="Resolved under vicariates" icon={Landmark} />
        <StatCard label="Parishes" value={snapshot.totalParishes} helper="Operational units in scope" icon={ShieldCheck} />
        <StatCard label="Hierarchy depth" value={snapshot.hierarchyDepth} helper="Archdiocese to parish inclusive" icon={UserCheck} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Archdiocese profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md bg-surface-container p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Name</p>
              <p className="mt-1 text-sm text-on-surface">{snapshot.archdioceseName ?? "-"}</p>
            </div>
            <div className="rounded-md bg-surface-container p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Current admin</p>
              <p className="mt-1 text-sm text-on-surface">{snapshot.currentUserName ?? "-"}</p>
              <p className="mt-1 text-xs text-on-surface-variant">{snapshot.currentUserEmail ?? "-"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Architecture posture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-on-surface">
            <p>Hierarchy queries are centralized so pages do not hard-code deaneries as direct Archdiocese children.</p>
            <p>Vicariate remains explicit in navigation, scope resolution, and rollup calculations even before its dedicated module is complete.</p>
            <p>When the Vicariate dashboard ships, most of the change can stay at the page layer instead of requiring a data-model rewrite.</p>
          </CardContent>
        </Card>
      </section>
    </ArchdioceseShell>
  );
}
