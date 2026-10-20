import { notFound } from "next/navigation";
import { ParishEditForm } from "@/components/dashboard/archdiocese/forms/parish-edit-form";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/requireAuth";
import { getHierarchyCollections } from "@/lib/db/queries/hierarchy";

type Props = { params: Promise<{ parishId: string }> };

export default async function ParishEditPage({ params }: Props) {
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin"] });
  if (!context.archdioceseId) notFound();

  const { parishId } = await params;
  const currentHierarchy = await getHierarchyCollections({ archdioceseId: context.archdioceseId, parishId });
  const parish = currentHierarchy.parishes.find((item) => item.id === parishId && item.archdiocese_id === context.archdioceseId);
  if (!parish || !currentHierarchy.archdioceses.some((item) => item.id === parish.archdiocese_id)) notFound();

  const canChangeArchdiocese = context.role === "super_admin";
  const hierarchy = canChangeArchdiocese ? await getHierarchyCollections() : currentHierarchy;

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/parishes"
      eyebrow="Archdiocese Parishes"
      title={`Edit ${parish.name}`}
      subtitle="Manage parish details, hierarchy and contribution rates."
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title={`Edit ${parish.name}`}
        description="Changes apply to this parish. Its vicariate is determined by the selected deanery."
        actions={<Button href="/dashboard/archdiocese/parishes" variant="secondary">All parishes</Button>}
      />
      <ParishEditForm
        parish={parish}
        archdioceses={hierarchy.archdioceses}
        deaneries={hierarchy.deaneries}
        vicariates={hierarchy.vicariates}
        canChangeArchdiocese={canChangeArchdiocese}
      />
    </ArchdioceseShell>
  );
}
