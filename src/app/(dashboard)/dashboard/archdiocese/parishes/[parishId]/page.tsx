import { ArchdiocesePlaceholderPage } from "@/components/dashboard/archdiocese/shared/archdiocese-placeholder-page";

export default function ArchdioceseParishDetailPage() {
  return (
    <ArchdiocesePlaceholderPage
      pathname="/dashboard/archdiocese/parishes"
      eyebrow="Archdiocese Parishes"
      title="Parish detail"
      description="Parish detail will expand here with its deanery and vicariate lineage already preserved."
      actionHref="/dashboard/archdiocese/parishes"
      actionLabel="Back to parishes"
    />
  );
}
