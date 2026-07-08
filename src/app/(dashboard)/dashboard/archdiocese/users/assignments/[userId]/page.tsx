// src/app/(dashboard)/dashboard/archdiocese/users/assignments/[userId]/page.tsx
import { Building2, Landmark, ShieldCheck, UserCheck, Users } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getArchdioceseAssignmentDetail } from "@/features/archdiocese/queries";
import { ROLE_LABELS, LEVEL_LABELS } from "@/lib/permissions/roles";
import { requireAuth } from "@/lib/auth/requireAuth";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ userId: string }> };

export default async function AssignmentDetailPage({ params }: Props) {
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin"] });
  if (!context.archdioceseId) return null;

  const { userId } = await params;
  const detail = await getArchdioceseAssignmentDetail(context.archdioceseId, userId);
  if (!detail || (!detail.assignmentId && !detail.fullName)) notFound();

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/users"
      eyebrow="Archdiocese Users"
      title={detail.fullName ?? "Unknown user"}
      subtitle={detail.email ?? "No email on file"}
      actions={
        <Button href="/dashboard/archdiocese/users/assignments" variant="secondary">
          All assignments
        </Button>
      }
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title={`Assignment: ${detail.fullName ?? "Unknown user"}`}
        description={`User ID: ${userId}`}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Role"
          value={ROLE_LABELS[detail.role as keyof typeof ROLE_LABELS] ?? detail.role}
          helper="Assigned system role"
          icon={ShieldCheck}
        />
        <StatCard
          label="Level"
          value={LEVEL_LABELS[detail.level as keyof typeof LEVEL_LABELS] ?? detail.level}
          helper="Hierarchy assignment level"
          icon={Building2}
        />
        <StatCard
          label="Status"
          value={detail.isActive ? "Active" : "Inactive"}
          helper={detail.isPrimary ? "Primary assignment" : "Secondary assignment"}
          icon={detail.isActive ? UserCheck : Users}
        />
        <StatCard
          label="Assigned"
          value={detail.assignedAt ? new Date(detail.assignedAt).toLocaleDateString() : "N/A"}
          helper="Assignment date"
          icon={Landmark}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between rounded-md bg-surface-container p-3">
              <span className="text-sm text-on-surface-variant">Full name</span>
              <span className="text-sm font-medium text-on-surface">{detail.fullName ?? "N/A"}</span>
            </div>
            <div className="flex justify-between rounded-md bg-surface-container p-3">
              <span className="text-sm text-on-surface-variant">Email</span>
              <span className="text-sm font-medium text-on-surface">{detail.email ?? "N/A"}</span>
            </div>
            <div className="flex justify-between rounded-md bg-surface-container p-3">
              <span className="text-sm text-on-surface-variant">Role</span>
              <Badge variant="info">
                {ROLE_LABELS[detail.role as keyof typeof ROLE_LABELS] ?? detail.role}
              </Badge>
            </div>
            <div className="flex justify-between rounded-md bg-surface-container p-3">
              <span className="text-sm text-on-surface-variant">Assignment status</span>
              <div className="flex gap-1">
                <Badge variant={detail.isActive ? "success" : "danger"}>
                  {detail.isActive ? "active" : "inactive"}
                </Badge>
                {detail.isPrimary && <Badge variant="info">primary</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hierarchy scope</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between rounded-md bg-surface-container p-3">
              <span className="text-sm text-on-surface-variant">Level</span>
              <span className="text-sm font-medium text-on-surface">
                {LEVEL_LABELS[detail.level as keyof typeof LEVEL_LABELS] ?? detail.level}
              </span>
            </div>
            <div className="flex justify-between rounded-md bg-surface-container p-3">
              <span className="text-sm text-on-surface-variant">Vicariate</span>
              <span className="text-sm font-medium text-on-surface">
                {detail.vicariateName ?? "Archdiocese-wide"}
              </span>
            </div>
            <div className="flex justify-between rounded-md bg-surface-container p-3">
              <span className="text-sm text-on-surface-variant">Deanery</span>
              <span className="text-sm font-medium text-on-surface">
                {detail.deaneryName ?? "N/A"}
              </span>
            </div>
            <div className="flex justify-between rounded-md bg-surface-container p-3">
              <span className="text-sm text-on-surface-variant">Parish</span>
              <span className="text-sm font-medium text-on-surface">
                {detail.parishName ?? "N/A"}
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      {detail.assignmentId && (
        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
          <p className="text-sm font-semibold text-on-surface mb-2">Assignment ID</p>
          <p className="text-xs text-on-surface-variant font-mono">{detail.assignmentId}</p>
          <p className="text-sm text-on-surface-variant mt-3">
            Use the server actions in <code className="text-xs bg-surface-container px-1 py-0.5 rounded">src/features/archdiocese/actions.ts</code> to
            modify this assignment: toggle active status, set as primary, or update hierarchy scope.
          </p>
        </div>
      )}
    </ArchdioceseShell>
  );
}
