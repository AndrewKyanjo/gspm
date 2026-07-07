import { ArchdiocesePlaceholderPage } from "@/components/dashboard/archdiocese/shared/archdiocese-placeholder-page";

export default function ArchdioceseFinancialReportsPage() {
  return (
    <ArchdiocesePlaceholderPage
      pathname="/dashboard/archdiocese/reports"
      eyebrow="Archdiocese Reports"
      title="Financial reports"
      description="Dedicated financial reporting can branch from the central reporting console while reusing the same hierarchy scope."
      actionHref="/dashboard/archdiocese/reports"
      actionLabel="Back to reports"
    />
  );
}
