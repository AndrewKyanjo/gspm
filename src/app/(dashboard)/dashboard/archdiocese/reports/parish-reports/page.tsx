import { ArchdiocesePlaceholderPage } from "@/components/dashboard/archdiocese/shared/archdiocese-placeholder-page";

export default function ArchdioceseParishReportsPage() {
  return (
    <ArchdiocesePlaceholderPage
      pathname="/dashboard/archdiocese/reports"
      eyebrow="Archdiocese Reports"
      title="Parish reports"
      description="This route is ready for a focused parish-report workflow on top of the central executive reporting data."
      actionHref="/dashboard/archdiocese/reports"
      actionLabel="Back to reports"
    />
  );
}
