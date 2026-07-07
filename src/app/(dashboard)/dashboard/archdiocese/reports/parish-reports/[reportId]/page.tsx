import { ArchdiocesePlaceholderPage } from "@/components/dashboard/archdiocese/shared/archdiocese-placeholder-page";

export default function ArchdioceseParishReportDetailPage() {
  return (
    <ArchdiocesePlaceholderPage
      pathname="/dashboard/archdiocese/reports"
      eyebrow="Archdiocese Reports"
      title="Parish report detail"
      description="A deeper approval timeline can be layered in here without reworking the hierarchy abstractions."
      actionHref="/dashboard/archdiocese/reports/parish-reports"
      actionLabel="Back to parish reports"
    />
  );
}
