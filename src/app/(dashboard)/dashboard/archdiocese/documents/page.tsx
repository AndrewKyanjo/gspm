import { ArchdiocesePlaceholderPage } from "@/components/dashboard/archdiocese/shared/archdiocese-placeholder-page";

export default function ArchdioceseDocumentsPage() {
  return (
    <ArchdiocesePlaceholderPage
      pathname="/dashboard/archdiocese/documents"
      eyebrow="Archdiocese Documents"
      title="Documents workspace"
      description="Enterprise document management for the entire archdiocese."
      actionHref="/dashboard/archdiocese/settings"
      actionLabel="Open settings"
    />
  );
}
