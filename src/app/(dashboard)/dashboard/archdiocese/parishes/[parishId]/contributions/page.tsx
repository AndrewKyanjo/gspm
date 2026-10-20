import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ParishRateForm } from "@/components/dashboard/archdiocese/forms/parish-rate-form";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ parishId: string }> };

export default async function ParishContributionsPage({ params }: Props) {
  const context = await requireAuth({
    roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry"],
  });
  if (!context.archdioceseId) return null;

  const canEditParish = context.role === "super_admin" || context.role === "archdiocese_admin";
  const { parishId } = await params;
  const supabase = createAdminClient();

  // Fetch parish with vicariate rates
  const { data: parish } = await supabase
    .from("parishes")
    .select("id, name, code, vicariate_id, monthly_emitemwa_amount, good_samaritan_day_amount")
    .eq("id", parishId)
    .eq("archdiocese_id", context.archdioceseId)
    .maybeSingle();

  if (!parish) notFound();

  // Fetch vicariate rates for comparison
  const { data: vicariate } = await supabase
    .from("vicariates")
    .select("name, monthly_emitemwa_amount, good_samaritan_day_amount")
    .eq("id", parish.vicariate_id)
    .maybeSingle();

  const vicariateMonthly = Number(vicariate?.monthly_emitemwa_amount ?? 50000);
  const vicariateGsd = Number(vicariate?.good_samaritan_day_amount ?? 250000);

  const hasCustomRate =
    parish.monthly_emitemwa_amount != null || parish.good_samaritan_day_amount != null;
  const effectiveMonthly =
    parish.monthly_emitemwa_amount != null
      ? Number(parish.monthly_emitemwa_amount)
      : vicariateMonthly;
  const effectiveGsd =
    parish.good_samaritan_day_amount != null
      ? Number(parish.good_samaritan_day_amount)
      : vicariateGsd;

  return (
    <ArchdioceseShell
      pathname={`/dashboard/archdiocese/parishes/${parishId}`}
      eyebrow="Archdiocese Parishes"
      title={parish.name}
      subtitle="Contribution rate management"
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title={`${parish.name} — Contribution Rates`}
        description={`Code: ${parish.code ?? "N/A"} • Vicariate: ${vicariate?.name ?? "Unknown"}`}
        actions={
          <span className="inline-flex flex-wrap gap-2">
            {canEditParish ? <Button href={`/dashboard/archdiocese/parishes/${parishId}/edit`}>Edit parish</Button> : null}
            <Button href={`/dashboard/archdiocese/parishes/${parishId}`} variant="secondary">
              Back to parish
            </Button>
          </span>
        }
      />

      <div className={`grid gap-6 ${canEditParish ? "lg:grid-cols-2" : ""}`}>
        <Card>
          <CardHeader>
            <CardTitle>Effective Rates</CardTitle>
            <CardDescription>
              Rates used when calculating contributions for this parish.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-outline-variant pb-3">
              <span className="font-medium text-on-surface-variant">Source</span>
              <Badge variant={hasCustomRate ? "success" : "default"}>
                {hasCustomRate ? "Custom Parish Rate" : "Inherited from Vicariate"}
              </Badge>
            </div>
            <div className="flex justify-between border-b border-outline-variant pb-3">
              <span className="font-medium text-on-surface-variant">
                Monthly Emitemwa
              </span>
              <span className="text-on-surface">
                {effectiveMonthly.toLocaleString()} UGX
              </span>
            </div>
            <div className="flex justify-between border-b border-outline-variant pb-3">
              <span className="font-medium text-on-surface-variant">
                Good Samaritan Day
              </span>
              <span className="text-on-surface">
                {effectiveGsd.toLocaleString()} UGX
              </span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="font-medium text-on-surface-variant">
                Annual Emitemwa Total
              </span>
              <span className="text-on-surface">
                {(effectiveMonthly * 12).toLocaleString()} UGX
              </span>
            </div>
          </CardContent>
        </Card>

        {canEditParish ? (
          <Card>
            <CardHeader>
              <CardTitle>
                {hasCustomRate ? "Update Custom Rates" : "Set Custom Rates"}
              </CardTitle>
              <CardDescription>
                Override the vicariate defaults for this specific parish.
                {hasCustomRate && " Clear both fields to revert to vicariate rates."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ParishRateForm
                parishId={parish.id}
                monthlyAmount={
                  parish.monthly_emitemwa_amount != null
                    ? Number(parish.monthly_emitemwa_amount)
                    : null
                }
                goodSamaritanAmount={
                  parish.good_samaritan_day_amount != null
                    ? Number(parish.good_samaritan_day_amount)
                    : null
                }
                vicariateMonthlyAmount={vicariateMonthly}
                vicariateGsdAmount={vicariateGsd}
                returnTo={`/dashboard/archdiocese/parishes/${parishId}/contributions`}
              />
            </CardContent>
          </Card>
        ) : null}
      </div>

      <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          How Rates Work
        </p>
        <div className="mt-4 space-y-2 text-sm text-on-surface-variant">
          <p>
            <strong>Default:</strong> All parishes inherit rates from their parent vicariate.
            The current vicariate rate for <strong>{vicariate?.name ?? "this vicariate"}</strong>{" "}
            is {vicariateMonthly.toLocaleString()} UGX/month (Emitemwa) and{" "}
            {vicariateGsd.toLocaleString()} UGX (Good Samaritan Day).
          </p>
          <p>
            <strong>Custom override:</strong> When you set a custom rate for this parish, it
            takes precedence over the vicariate rate. Contribution calculations will use the
            parish-specific rate.
          </p>
          <p>
            <strong>Reverting:</strong> Clear both fields and save to revert to the
            vicariate defaults.
          </p>
        </div>
      </div>
    </ArchdioceseShell>
  );
}
