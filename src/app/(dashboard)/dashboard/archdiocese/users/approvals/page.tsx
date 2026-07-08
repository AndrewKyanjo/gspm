import { Building2, ShieldCheck, UserCheck } from "lucide-react";
import RegistrationTable, {
  type RegistrationRequestRow,
} from "@/components/dashboard/RegistrationTable";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { Button } from "@/components/ui/button";
import { getArchdiocesePendingRequests } from "@/features/archdiocese/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

export default async function ApprovalsPage() {
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin"] });
  if (!context.archdioceseId) {
    return null;
  }

  const requests = await getArchdiocesePendingRequests(context.archdioceseId);
  const rows: RegistrationRequestRow[] = requests.map((request) => ({
    id: request.id,
    requested_role: request.requestedRole as RegistrationRequestRow["requested_role"],
    requested_level: request.requestedLevel,
    requested_archdiocese_id: request.requestedArchdioceseId,
    requested_vicariate_id: request.requestedVicariateId,
    requested_deanery_id: request.requestedDeaneryId,
    requested_parish_id: request.requestedParishId,
    created_at: request.createdAt,
    profile: request.profile
      ? {
          full_name: request.profile.fullName ?? "Unknown applicant",
          email: request.profile.email ?? "No email",
          phone: request.profile.phone,
        }
      : null,
    vicariate: request.vicariateName ? { name: request.vicariateName } : null,
    deanery: request.deaneryName ? { name: request.deaneryName } : null,
    parish: request.parishName ? { name: request.parishName } : null,
  }));

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/users/approvals"
      eyebrow="Archdiocese Approvals"
      title="Registration approvals"
      subtitle="Centralized access review for the whole hierarchy."
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Pending access requests"
        description="Requests retain vicariate, deanery, and parish scope so the approval flow stays aligned with the real hierarchy."
        actions={<Button href="/dashboard/archdiocese/users">Back to users</Button>}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Pending requests" value={rows.length} helper="Awaiting archdiocesan review" icon={UserCheck} />
        <StatCard label="Approval model" value="Centralized" helper="Reviewed at the executive layer" icon={ShieldCheck} />
        <StatCard label="Scope validation" value="Hierarchy-aware" helper="Vicariate, deanery, and parish preserved" icon={Building2} />
      </section>

      <RegistrationTable requests={rows} />
    </ArchdioceseShell>
  );
}
