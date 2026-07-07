import { ArchdiocesePlaceholderPage } from "@/components/dashboard/archdiocese/shared/archdiocese-placeholder-page";

export default function ArchdioceseAuditLogsPage() {
  return (
    <ArchdiocesePlaceholderPage
      pathname="/dashboard/archdiocese/settings"
      eyebrow="Archdiocese Settings"
      title="Audit logs"
      description="Audit and governance views can expand here without changing the executive shell."
      actionHref="/dashboard/archdiocese/settings"
      actionLabel="Back to settings"
    />
  );
}
