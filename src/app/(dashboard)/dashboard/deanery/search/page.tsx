import { DeaneryShell } from "@/components/dashboard/deanery/shared/deanery-shell";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { searchDeaneryWorkspace } from "@/features/deanery/search/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

type DeanerySearchPageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function DeanerySearchPage({ searchParams }: DeanerySearchPageProps) {
  const context = await requireAuth({ roles: ["deanery_head", "deanery_staff"] });
  if (!context.deaneryId) return null;

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const query = typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q.trim() : "";
  const results = query ? await searchDeaneryWorkspace(context.deaneryId, query) : [];

  return (
    <DeaneryShell
      pathname="/dashboard/deanery/search"
      eyebrow="Deanery Search"
      title="Workspace search"
      subtitle="Search across parish supervision, reports, documents, projects, contributions, and media."
      searchQuery={query}
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader title={query ? `Search results for "${query}"` : "Search the deanery workspace"} description={query ? `${results.length} result(s) across the deanery module.` : "Use the shell search bar to find records by parish, report, file, project, or media name."} />
      {query ? (
        results.length ? (
          <div className="grid gap-4">
            {results.map((result) => (
              <Card key={`${result.module}-${result.href}-${result.title}`}>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="info">{result.module}</Badge>
                    <CardTitle>{result.title}</CardTitle>
                  </div>
                  <CardDescription>{result.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-on-surface-variant">{result.meta}</p>
                  <Button href={result.href}>Open result</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="No results found" description="Try a different parish, report term, file title, or project name." />
        )
      ) : (
        <EmptyState title="Start with a search term" description="The deanery search reaches across parishes, reports, documents, projects, contributions, and media." />
      )}
    </DeaneryShell>
  );
}
