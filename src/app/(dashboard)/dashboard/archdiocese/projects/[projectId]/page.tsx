import { ArchdiocesePlaceholderPage } from "@/components/dashboard/archdiocese/shared/archdiocese-placeholder-page";

export default function ArchdioceseProjectDetailPage() {
  return (
    <ArchdiocesePlaceholderPage
      pathname="/dashboard/archdiocese/projects"
      eyebrow="Archdiocese Projects"
      title="Project detail"
      description="A detailed executive project view can expand here without changing the hierarchy query model."
      actionHref="/dashboard/archdiocese/projects"
      actionLabel="Back to projects"
    />
  );
}
