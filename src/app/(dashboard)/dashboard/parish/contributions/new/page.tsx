import { ContributionForm } from "@/components/dashboard/parish/forms/contribution-form";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { ParishShell } from "@/components/dashboard/parish/shared/parish-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/requireAuth";

export default async function NewParishContributionPage() {
  await requireAuth({ roles: ["parish_head", "parish_data_entry"] });

  return (
    <ParishShell
      pathname="/dashboard/parish/contributions"
      eyebrow="Parish Finance"
      title="Record contribution"
      subtitle="Capture contribution details and save them directly to the parish finance ledger."
      actions={
        <Button href="/dashboard/parish/contributions" variant="secondary">
          Back to contributions
        </Button>
      }
    >
      <PageHeader
        title="New contribution entry"
        description="Record donor name, amount, method, and any reference details needed for parish finance follow-up."
      />

      <Card>
        <CardContent className="p-5">
          <ContributionForm />
        </CardContent>
      </Card>
    </ParishShell>
  );
}
