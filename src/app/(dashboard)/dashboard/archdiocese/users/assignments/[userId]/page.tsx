import { ArchdiocesePlaceholderPage } from "@/components/dashboard/archdiocese/shared/archdiocese-placeholder-page";

export default function ArchdioceseUserAssignmentDetailPage() {
  return (
    <ArchdiocesePlaceholderPage
      pathname="/dashboard/archdiocese/users"
      eyebrow="Archdiocese Users"
      title="Assignment detail"
      description="Detailed reassignment and audit history can be added here without changing scope resolution."
      actionHref="/dashboard/archdiocese/users/assignments"
      actionLabel="Back to assignments"
    />
  );
}
