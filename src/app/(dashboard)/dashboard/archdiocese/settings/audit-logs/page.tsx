// src/app/(dashboard)/dashboard/archdiocese/settings/audit-logs/page.tsx
import { Activity, Clock, FileText } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getArchdioceseAuditLogs } from "@/features/archdiocese/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

function actionVariant(action: string) {
  if (action.includes("approved")) return "success" as const;
  if (action.includes("rejected") || action.includes("returned")) return "danger" as const;
  if (action.includes("pending")) return "warning" as const;
  if (action.includes("submitted")) return "info" as const;
  return "default" as const;
}

export default async function AuditLogsPage() {
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin"] });
  if (!context.archdioceseId) return null;

  const logs = await getArchdioceseAuditLogs(context.archdioceseId);

  const today = new Date();
  const recent24h = logs.filter((l) => {
    const d = new Date(l.createdAt);
    return (today.getTime() - d.getTime()) < 24 * 60 * 60 * 1000;
  });

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/settings"
      eyebrow="Archdiocese Settings"
      title="Audit logs"
      subtitle="Recent system activity across all modules in the archdiocese."
      actions={
        <Button href="/dashboard/archdiocese/settings" variant="secondary">
          Settings overview
        </Button>
      }
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Audit Logs"
        description="A chronological feed of key system events: registrations, reports, contributions, and project updates."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total events" value={logs.length} helper="Across all modules" icon={Activity} />
        <StatCard label="Last 24 hours" value={recent24h.length} helper="Recent activity" icon={Clock} />
        <StatCard
          label="Modules"
          value={new Set(logs.map((l) => l.entityType).filter(Boolean)).size}
          helper="Distinct entity types"
          icon={FileText}
        />
      </section>

      {logs.length > 0 ? (
        <SimpleTable
          title="Activity feed"
          description="The most recent 50 events across the system, newest first."
          rows={logs}
          columns={[
            {
              header: "Action",
              cell: (item) => <Badge variant={actionVariant(item.action)}>{item.action}</Badge>,
            },
            {
              header: "Module",
              cell: (item) => item.entityType ?? "unknown",
            },
            {
              header: "Details",
              cell: (item) => (
                <div className="max-w-xs truncate text-sm">{item.details ?? "-"}</div>
              ),
            },
            {
              header: "When",
              cell: (item) =>
                item.createdAt
                  ? new Date(item.createdAt).toLocaleString()
                  : "-",
            },
          ]}
        />
      ) : (
        <EmptyState
          title="No activity yet"
          description="System activity will appear here as operations occur across the archdiocese."
        />
      )}
    </ArchdioceseShell>
  );
}
