import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { ParishShell } from "@/components/dashboard/parish/shared/parish-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { searchParishWorkspace } from "@/features/parish/search/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

type ParishSearchPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function titleCaseModule(module: string) {
  return module.charAt(0).toUpperCase() + module.slice(1);
}

export default async function ParishSearchPage({ searchParams }: ParishSearchPageProps) {
  const context = await requireAuth({ roles: ["parish_head", "parish_data_entry"] });

  if (!context.parishId) {
    return null;
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const query = typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q.trim() : "";
  const results = query ? await searchParishWorkspace(context.parishId, query) : [];

  return (
    <ParishShell
      pathname="/dashboard/parish/search"
      eyebrow="Parish Search"
      title="Workspace search"
      subtitle="Search across reports, documents, contributions, media, and projects from one parish-level search surface."
      searchQuery={query}
      actions={
        <Button href="/dashboard/parish" variant="secondary">
          Back to overview
        </Button>
      }
    >
      <PageHeader
        title={query ? `Search results for "${query}"` : "Search the parish workspace"}
        description={
          query
            ? `${results.length} result(s) found across the parish modules.`
            : "Use the search bar in the top header to find records by name, title, or other visible labels."
        }
      />

      {query ? (
        results.length ? (
          <div className="grid gap-4">
            {results.map((result) => (
              <Card key={`${result.module}-${result.href}-${result.title}`}>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="info">{titleCaseModule(result.module)}</Badge>
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
          <EmptyState
            title="No results found"
            description="Try a different file name, project title, contributor name, or report term."
          />
        )
      ) : (
        <EmptyState
          title="Start with a search term"
          description="The workspace search reads across reports, documents, contributions, media, and projects."
        />
      )}
    </ParishShell>
  );
}
