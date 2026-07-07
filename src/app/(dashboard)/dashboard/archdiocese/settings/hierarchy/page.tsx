import { ArchdiocesePlaceholderPage } from "@/components/dashboard/archdiocese/shared/archdiocese-placeholder-page";

export default function ArchdioceseHierarchySettingsPage() {
  return (
    <ArchdiocesePlaceholderPage
      pathname="/dashboard/archdiocese/settings"
      eyebrow="Archdiocese Settings"
      title="Hierarchy settings"
      description="Hierarchy administration remains explicitly prepared for the Vicariate layer."
      actionHref="/dashboard/archdiocese/settings"
      actionLabel="Back to settings"
    />
  );
}
