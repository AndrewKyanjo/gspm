// src/app/(dashboard)/dashboard/archdiocese/settings/system/page.tsx
import { Cpu, Database, Globe, ShieldCheck } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/requireAuth";

export default async function SystemSettingsPage() {
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin"] });
  if (!context.archdioceseId) return null;

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/settings"
      eyebrow="Archdiocese Settings"
      title="System configuration"
      subtitle="Platform-wide settings, integrations, and maintenance controls."
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
        title="System"
        description="System-level configuration for the GSPM portal. Some settings are managed via environment variables and Supabase configuration."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Environment" value="Production" helper="Deployment target" icon={Globe} />
        <StatCard label="Database" value="Supabase" helper="PostgreSQL backend" icon={Database} />
        <StatCard label="Auth Provider" value="Supabase Auth" helper="Email/password authentication" icon={ShieldCheck} />
        <StatCard label="Storage" value="Supabase Storage" helper="Document and media files" icon={Cpu} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Authentication settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-surface-container p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Email verification</p>
              <p className="mt-1 text-sm text-on-surface">Required for new accounts</p>
            </div>
            <div className="rounded-md bg-surface-container p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Admin approval</p>
              <p className="mt-1 text-sm text-on-surface">All registrations require Archdiocese admin review</p>
            </div>
            <div className="rounded-md bg-surface-container p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Session duration</p>
              <p className="mt-1 text-sm text-on-surface">30 days (configurable via Supabase)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data & storage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-surface-container p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">File upload limit</p>
              <p className="mt-1 text-sm text-on-surface">20 MB per document, 10 MB per image</p>
            </div>
            <div className="rounded-md bg-surface-container p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Supported formats</p>
              <p className="mt-1 text-sm text-on-surface">PDF, DOCX, XLSX, JPEG, PNG, WebP</p>
            </div>
            <div className="rounded-md bg-surface-container p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Row-level security</p>
              <p className="mt-1 text-sm text-on-surface">Enabled on all tables via Supabase RLS policies</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-surface-container p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Welcome email</p>
              <p className="mt-1 text-sm text-on-surface">Sent on account creation with email verification link</p>
            </div>
            <div className="rounded-md bg-surface-container p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Approval notification</p>
              <p className="mt-1 text-sm text-on-surface">Sent when registration is approved or rejected</p>
            </div>
            <div className="rounded-md bg-surface-container p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Report notifications</p>
              <p className="mt-1 text-sm text-on-surface">Sent to admins when parish reports are submitted</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-surface-container p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Database backups</p>
              <p className="mt-1 text-sm text-on-surface">Managed by Supabase — daily automated backups</p>
            </div>
            <div className="rounded-md bg-surface-container p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">API rate limiting</p>
              <p className="mt-1 text-sm text-on-surface">Configured at the Supabase project level</p>
            </div>
            <div className="rounded-md bg-surface-container p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Log retention</p>
              <p className="mt-1 text-sm text-on-surface">Activity logs retained according to Supabase plan</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </ArchdioceseShell>
  );
}
