import { ArchdiocesePlaceholderPage } from "@/components/dashboard/archdiocese/shared/archdiocese-placeholder-page";

export default function ArchdioceseMediaPage() {
  return (
    <ArchdiocesePlaceholderPage
      pathname="/dashboard/archdiocese/media"
      eyebrow="Archdiocese Media"
      title="Media command center"
      description="Central media operations for parish and deanery content across the archdiocese."
      actionHref="/dashboard/archdiocese/settings"
      actionLabel="Open settings"
    />
  );
}
