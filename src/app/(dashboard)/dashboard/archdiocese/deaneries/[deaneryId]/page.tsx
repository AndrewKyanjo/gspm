import { ArchdiocesePlaceholderPage } from "@/components/dashboard/archdiocese/shared/archdiocese-placeholder-page";

export default function ArchdioceseDeaneryDetailPage() {
  return (
    <ArchdiocesePlaceholderPage
      pathname="/dashboard/archdiocese/deaneries"
      eyebrow="Archdiocese Deaneries"
      title="Deanery detail"
      description="Deanery detail remains ready for a deeper page without bypassing the vicariate layer."
      actionHref="/dashboard/archdiocese/deaneries"
      actionLabel="Back to deaneries"
    />
  );
}
