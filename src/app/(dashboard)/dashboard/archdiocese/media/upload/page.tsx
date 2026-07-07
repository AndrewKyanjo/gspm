import { ArchdiocesePlaceholderPage } from "@/components/dashboard/archdiocese/shared/archdiocese-placeholder-page";

export default function ArchdioceseMediaUploadPage() {
  return (
    <ArchdiocesePlaceholderPage
      pathname="/dashboard/archdiocese/media"
      eyebrow="Archdiocese Media"
      title="Upload media"
      description="Add new media assets into the central archdiocese media pipeline."
      actionHref="/dashboard/archdiocese/media"
      actionLabel="Back to media"
    />
  );
}
