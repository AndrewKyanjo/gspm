import { Building2, Shield } from "lucide-react";
import { ParishShell } from "@/components/dashboard/parish/shared/parish-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/requireAuth";
import { getParishSettingsSnapshot } from "@/features/parish/settings/queries";

export default async function ParishSettingsPage() {
  const context = await requireAuth({ roles: ["parish_head", "parish_data_entry"] });

  if (!context.parishId) {
    return null;
  }

  const snapshot = await getParishSettingsSnapshot(context.parishId, context.userId);

  return (
    <ParishShell
      pathname="/dashboard/parish/settings"
      eyebrow="Parish Settings"
      title="Parish configuration"
      subtitle="Profile, scope, and operator details presented in one stable administrative view."
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Parish settings"
        description="This page is modeled after the reference settings screen and currently focuses on live profile and scope data already present in Supabase."
      />

      <section className="grid gap-4 md:grid-cols-2">
        <StatCard label="Parish code" value={snapshot.parishCode ?? "Unassigned"} helper="Reference identifier" icon={Building2} />
        <StatCard label="Access role" value={context.role.replaceAll("_", " ")} helper="Current signed-in operator" icon={Shield} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Parish profile</CardTitle>
            <CardDescription>Live hierarchy details for the current parish scope.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-on-surface">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Parish</p>
              <p className="mt-1">{snapshot.parishName ?? "Unknown parish"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Deanery</p>
              <p className="mt-1">{snapshot.deaneryName ?? "Unknown deanery"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Vicariate</p>
              <p className="mt-1">{snapshot.vicariateName ?? "Unknown vicariate"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operator details</CardTitle>
            <CardDescription>Current signed-in parish user information from profiles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-on-surface">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Name</p>
              <p className="mt-1">{snapshot.currentUserName ?? "Unknown user"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Email</p>
              <p className="mt-1">{snapshot.currentUserEmail ?? "Unknown email"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ParishShell>
  );
}
