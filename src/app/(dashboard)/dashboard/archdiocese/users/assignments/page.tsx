import { ArchdiocesePlaceholderPage } from "@/components/dashboard/archdiocese/shared/archdiocese-placeholder-page";

export default function ArchdioceseUserAssignmentsPage() {
  return (
    <ArchdiocesePlaceholderPage
      pathname="/dashboard/archdiocese/users"
      eyebrow="Archdiocese Users"
      title="Assignments workflow"
      description="Assignment operations will stay consistent with the hierarchy-aware user administration model."
      actionHref="/dashboard/archdiocese/users"
      actionLabel="Back to users"
    />
  );
}
