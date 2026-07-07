import { ArchdiocesePlaceholderPage } from "@/components/dashboard/archdiocese/shared/archdiocese-placeholder-page";

export default function ArchdioceseSystemSettingsPage() {
  return (
    <ArchdiocesePlaceholderPage
      pathname="/dashboard/archdiocese/settings"
      eyebrow="Archdiocese Settings"
      title="System settings"
      description="System preferences can expand here while still inheriting the executive shell and hierarchy posture."
      actionHref="/dashboard/archdiocese/settings"
      actionLabel="Back to settings"
    />
  );
}
