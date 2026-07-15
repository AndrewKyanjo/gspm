import { MandatoryContributionForm, ProjectContributionForm } from "@/components/dashboard/parish/forms/contribution-form";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { ParishShell } from "@/components/dashboard/parish/shared/parish-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getParishContributionDashboard } from "@/features/contributions/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

export default async function NewParishContributionPage() {
  const context = await requireAuth({ roles: ["parish_head", "parish_data_entry"] });
  if (!context.parishId) return null;

  const year = new Date().getUTCFullYear();
  const dashboard = await getParishContributionDashboard(context.parishId, year);

  return (
    <ParishShell
      pathname="/dashboard/parish/contributions"
      eyebrow="Parish Finance"
      title="Record contribution"
      subtitle="Capture Emitemwa, Good Samaritan Day, or project contribution payments."
      actions={
        <Button href="/dashboard/parish/contributions" variant="secondary">
          Back to contributions
        </Button>
      }
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="New payment entry"
        description="Monthly Emitemwa and Good Samaritan Day are tracked separately from scoped project contributions."
      />

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mandatory contribution</CardTitle>
            <CardDescription>Record monthly Emitemwa or the annual Good Samaritan Day contribution.</CardDescription>
          </CardHeader>
          <CardContent>
            <MandatoryContributionForm
              parishId={context.parishId}
              year={year}
              returnTo="/dashboard/parish/contributions"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project contribution</CardTitle>
            <CardDescription>Record a payment toward a project currently open to this parish.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectContributionForm
              parishId={context.parishId}
              projects={dashboard?.projects ?? []}
              returnTo="/dashboard/parish/contributions"
            />
          </CardContent>
        </Card>
      </section>
    </ParishShell>
  );
}
