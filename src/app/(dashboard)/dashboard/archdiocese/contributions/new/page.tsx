// src/app/(dashboard)/dashboard/archdiocese/contributions/new/page.tsx
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { Button } from "@/components/ui/button";
import { getArchdioceseParishOverviews } from "@/features/archdiocese/queries";
import { requireAuth } from "@/lib/auth/requireAuth";
import { CreateContributionForm } from "./create-form";

export default async function CreateContributionPage() {
  const context = await requireAuth({
    roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry"],
  });
  if (!context.archdioceseId) return null;

  const parishes = await getArchdioceseParishOverviews(context.archdioceseId);

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/contributions"
      eyebrow="Archdiocese Contributions"
      title="Record contribution"
      subtitle="Proxy-enter a contribution on behalf of any parish in the archdiocese."
      actions={
        <Button href="/dashboard/archdiocese/contributions" variant="secondary">
          All contributions
        </Button>
      }
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="New Contribution"
        description="Record a contribution for any parish. This entry will be marked as proxy-entered by the Archdiocese."
      />
      <CreateContributionForm
        archdioceseId={context.archdioceseId}
        parishes={parishes}
      />
    </ArchdioceseShell>
  );
}
