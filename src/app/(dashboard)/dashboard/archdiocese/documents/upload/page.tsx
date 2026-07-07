import { ArchdiocesePlaceholderPage } from "@/components/dashboard/archdiocese/shared/archdiocese-placeholder-page";

export default function ArchdioceseDocumentUploadPage() {
  return (
    <ArchdiocesePlaceholderPage
      pathname="/dashboard/archdiocese/documents"
      eyebrow="Archdiocese Documents"
      title="Upload document"
      description="Prepare enterprise documents for archdiocese-wide visibility and governance."
      actionHref="/dashboard/archdiocese/documents"
      actionLabel="Back to documents"
    />
  );
}
