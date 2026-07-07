import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { Button } from "@/components/ui/button";
import { ArchdioceseShell } from "./archdiocese-shell";

export function ArchdiocesePlaceholderPage({
  pathname,
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  pathname: string;
  eyebrow: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <ArchdioceseShell pathname={pathname} eyebrow={eyebrow} title={title} subtitle={description}>
      <PageHeader title={title} description={description} />
      <EmptyState
        title="This surface is scaffolded for the executive console"
        description="The shared Archdiocese shell and hierarchy-aware query layer are in place, so this route can be expanded without revisiting the hierarchy architecture."
        action={
          actionHref && actionLabel ? (
            <Button href={actionHref} variant="secondary">
              {actionLabel}
            </Button>
          ) : undefined
        }
      />
    </ArchdioceseShell>
  );
}
