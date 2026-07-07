import { ArchdiocesePlaceholderPage } from "@/components/dashboard/archdiocese/shared/archdiocese-placeholder-page";

export default function ArchdioceseContributionCreatePage() {
  return (
    <ArchdiocesePlaceholderPage
      pathname="/dashboard/archdiocese/contributions"
      eyebrow="Archdiocese Contributions"
      title="Create contribution"
      description="Register a contribution on behalf of any parish in the archdiocese."
      actionHref="/dashboard/archdiocese/contributions"
      actionLabel="Back to contributions"
    />
  );
}
