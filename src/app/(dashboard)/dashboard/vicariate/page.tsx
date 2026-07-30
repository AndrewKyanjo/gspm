import {
  AlertTriangle,
  CalendarCheck,
  CircleDollarSign,
  ClipboardCheck,
  FolderKanban,
  Landmark,
  ShieldCheck,
  Users,
} from "lucide-react";
import { VicariateShell } from "@/components/dashboard/vicariate/shared/vicariate-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  compactCurrency,
  greeting,
  HealthScore,
  MetricCard,
  NotificationsPanel,
  ProgressList,
  TrendBars,
} from "@/components/dashboard/shared/command-dashboard";
import { getVicariateDashboard } from "@/features/vicariate/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

const currencyFormatter = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

export default async function VicariateDashboardPage() {
  const context = await requireAuth({ roles: ["vicariate_head", "vicariate_staff"] });
  if (!context.archdioceseId || !context.vicariateId) return null;

  const dashboard = await getVicariateDashboard({
    archdioceseId: context.archdioceseId,
    vicariateId: context.vicariateId,
  });

  const arrearsTotal = dashboard.arrears.reduce((total, item) => total + item.balance, 0);
  const healthScore = Math.max(
    35,
    Math.min(
      98,
      Math.round(
        dashboard.compliancePercent * 0.55 +
          (dashboard.totalParishes > 0 ? (dashboard.goodSamaritanCleared / dashboard.totalParishes) * 100 * 0.3 : 0) +
          (arrearsTotal > 0 ? 5 : 15),
      ),
    ),
  );
  const healthLabel = healthScore >= 85 ? "Strong regional performance" : healthScore >= 70 ? "Stable with follow-up items" : "Needs parish follow-up";
  const displayName = context.fullName?.split(" ")[0] ?? "Vicariate lead";

  const arrearsByDeanery = [...dashboard.arrears.reduce((map, item) => {
    const deanery = item.deaneryName ?? "Unassigned deanery";
    map.set(deanery, (map.get(deanery) ?? 0) + item.balance);
    return map;
  }, new Map<string, number>()).entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const progressItems = dashboard.arrears.slice(0, 5).map((item) => ({
    id: item.parishId,
    label: item.parishName,
    helper: item.deaneryName,
    value: Math.max(5, 100 - Math.min(100, Math.round((item.balance / Math.max(arrearsTotal, 1)) * 100))),
    accent: "bg-amber-600",
  }));

  const notifications = [
    {
      title: `${dashboard.arrears.length} parish${dashboard.arrears.length === 1 ? "" : "es"} have Emitemwa arrears`,
      href: "/dashboard/vicariate/contributions",
      tone: dashboard.arrears.length ? "warning" as const : "success" as const,
    },
    {
      title: `${dashboard.goodSamaritanCleared}/${dashboard.totalParishes} parishes cleared Good Samaritan Day`,
      href: "/dashboard/vicariate/contributions",
      tone: dashboard.goodSamaritanCleared === dashboard.totalParishes ? "success" as const : "info" as const,
    },
    {
      title: `${dashboard.totalDeaneries} deaneries need regional coordination`,
      href: "/dashboard/vicariate/deaneries",
      tone: "info" as const,
    },
  ];

  return (
    <VicariateShell
      pathname="/dashboard/vicariate"
      eyebrow="Vicariate Command Center"
      title={dashboard.vicariateName ?? "Vicariate dashboard"}
      subtitle="A regional operations view across deaneries, parish finance, and contribution follow-up."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button href="/dashboard/vicariate/contributions">
            <CircleDollarSign className="h-4 w-4" />
            Contributions
          </Button>
          <Button href="/dashboard/vicariate/deaneries" variant="secondary">
            <Landmark className="h-4 w-4" />
            Deaneries
          </Button>
        </div>
      }
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
          <div>
            <p className="text-sm font-medium text-primary">
              {greeting()}, {displayName}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-on-surface">
              {dashboard.vicariateName ?? "Vicariate operations"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-on-surface-variant">
              {dashboard.arrears.length
                ? `${dashboard.arrears.length} parishes need contribution follow-up across the vicariate.`
                : "No parish arrears are currently visible in this vicariate."}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button href="/dashboard/vicariate/reports" variant="secondary">
              <ClipboardCheck className="h-4 w-4" />
              View reports
            </Button>
            <Button href="/dashboard/vicariate/parishes" variant="secondary">
              <ShieldCheck className="h-4 w-4" />
              Parishes
            </Button>
            <Button href="/dashboard/vicariate/projects" variant="secondary">
              <FolderKanban className="h-4 w-4" />
              Projects
            </Button>
            <Button href="/dashboard/vicariate/documents" variant="secondary">
              <ClipboardCheck className="h-4 w-4" />
              Documents
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-on-surface-variant">Project contributions raised</p>
            <p className="mt-4 text-5xl font-semibold text-on-surface">
              {compactCurrency(dashboard.projectContributionsRaised)}
            </p>
            <p className="mt-3 text-sm text-on-surface-variant">
              Compliance is at {dashboard.compliancePercent}% with {dashboard.goodSamaritanCleared} parishes cleared for Good Samaritan Day.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-outline-variant bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-on-surface-variant">Compliance</p>
                  <CalendarCheck className="h-4 w-4 text-emerald-700" />
                </div>
                <p className="mt-2 text-2xl font-semibold text-on-surface">{dashboard.compliancePercent}%</p>
              </div>
              <div className="rounded-lg border border-outline-variant bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-on-surface-variant">Deaneries</p>
                  <Landmark className="h-4 w-4 text-blue-700" />
                </div>
                <p className="mt-2 text-2xl font-semibold text-on-surface">{dashboard.totalDeaneries}</p>
              </div>
              <div className="rounded-lg border border-outline-variant bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-on-surface-variant">Parishes</p>
                  <ShieldCheck className="h-4 w-4 text-cyan-700" />
                </div>
                <p className="mt-2 text-2xl font-semibold text-on-surface">{dashboard.totalParishes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:col-span-4">
          <HealthScore score={healthScore} label={healthLabel} />
          <MetricCard label="In arrears" value={dashboard.arrears.length} helper={currencyFormatter.format(arrearsTotal)} icon={AlertTriangle} accent="bg-amber-600" />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <TrendBars title="Arrears by deanery" items={arrearsByDeanery} formatter={(value) => compactCurrency(value)} />
        </div>
        <div className="xl:col-span-4">
          <NotificationsPanel items={notifications} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-6">
          <CardHeader>
            <CardTitle>Vicariate hierarchy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-on-surface">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium">{dashboard.vicariateName ?? "Vicariate"}</span>
              </div>
              <div className="ml-3 border-l border-outline-variant pl-6">
                <p>{dashboard.totalDeaneries} Deaneries</p>
                <div className="mt-3 border-l border-outline-variant pl-6">
                  <p>{dashboard.totalParishes} Parishes</p>
                  <p className="mt-3 text-on-surface-variant">{dashboard.goodSamaritanCleared} Good Samaritan Day clearances</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="xl:col-span-6">
          <ProgressList title="Parish follow-up priority" items={progressItems} />
        </div>
      </section>
    </VicariateShell>
  );
}
