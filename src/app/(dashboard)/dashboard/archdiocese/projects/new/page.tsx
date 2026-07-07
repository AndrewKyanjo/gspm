import { ArchdiocesePlaceholderPage } from "@/components/dashboard/archdiocese/shared/archdiocese-placeholder-page";

export default function ArchdioceseProjectCreatePage() {
  return (
    <ArchdiocesePlaceholderPage
      pathname="/dashboard/archdiocese/projects"
      eyebrow="Archdiocese Projects"
      title="Create project"
      description="Launch a new project record with hierarchy-aware placement from day one."
      actionHref="/dashboard/archdiocese/projects"
      actionLabel="Back to projects"
    />
  );
}
