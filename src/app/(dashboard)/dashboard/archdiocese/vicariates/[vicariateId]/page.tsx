import { ArchdiocesePlaceholderPage } from "@/components/dashboard/archdiocese/shared/archdiocese-placeholder-page";

export default function ArchdioceseVicariateDetailPage() {
  return (
    <ArchdiocesePlaceholderPage
      pathname="/dashboard/archdiocese/vicariates"
      eyebrow="Archdiocese Vicariates"
      title="Vicariate detail"
      description="Detailed vicariate analytics will plug into the same hierarchy-aware data layer used by the executive overview."
      actionHref="/dashboard/archdiocese/vicariates"
      actionLabel="Back to vicariates"
    />
  );
}
