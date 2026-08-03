"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type InteractiveTableShellProps = {
  tableId: string;
  rowCount: number;
  title: string;
  children: ReactNode;
  defaultPageSize?: number;
};

const pageSizeOptions = [10, 25, 50, 100];

export function InteractiveTableShell({
  tableId,
  rowCount,
  title,
  children,
  defaultPageSize = 10,
}: InteractiveTableShellProps) {
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [page, setPage] = useState(1);
  const [matchedCount, setMatchedCount] = useState(rowCount);

  const totalPages = Math.max(1, Math.ceil(matchedCount / pageSize));

  useEffect(() => {
    const table = document.getElementById(tableId);
    const rows = Array.from(table?.querySelectorAll<HTMLTableRowElement>("tbody tr[data-table-row]") ?? []);
    const normalizedQuery = query.trim().toLowerCase();
    const matchedRows = rows.filter((row) => row.textContent?.toLowerCase().includes(normalizedQuery));
    const nextTotalPages = Math.max(1, Math.ceil(matchedRows.length / pageSize));
    const normalizedPage = Math.min(page, nextTotalPages);
    const start = (normalizedPage - 1) * pageSize;
    const end = start + pageSize;

    rows.forEach((row) => {
      row.hidden = true;
    });

    matchedRows.slice(start, end).forEach((row) => {
      row.hidden = false;
    });

    setMatchedCount(matchedRows.length);
    if (normalizedPage !== page) {
      setPage(normalizedPage);
    }
  }, [page, pageSize, query, tableId, rowCount]);

  const rangeLabel = useMemo(() => {
    if (matchedCount === 0) return "0 of 0";
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, matchedCount);
    return `${start}-${end} of ${matchedCount}`;
  }, [matchedCount, page, pageSize]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border-b border-outline-variant pb-4 md:flex-row md:items-center md:justify-between">
        <label className="flex min-h-10 w-full items-center gap-2 rounded-md border border-outline-variant bg-surface px-3 text-sm text-on-surface-variant md:max-w-sm">
          <Search className="h-4 w-4 shrink-0" />
          <span className="sr-only">Filter {title}</span>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder={`Filter ${title.toLowerCase()}`}
            className="min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2 text-sm text-on-surface-variant">
          <span>{rangeLabel}</span>
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            className="h-10 rounded-md border border-outline-variant bg-surface px-2 text-sm text-on-surface"
            aria-label="Rows per page"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option} rows
              </option>
            ))}
          </select>
        </div>
      </div>

      {children}

      <div className="flex flex-col gap-3 border-t border-outline-variant pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-on-surface-variant">
          Page {Math.min(page, totalPages)} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            aria-label="Next page"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {matchedCount === 0 ? (
        <div className="rounded-md border border-dashed border-outline-variant bg-surface-container-lowest p-6 text-center text-sm text-on-surface-variant">
          No rows match the current filter.
        </div>
      ) : null}
    </div>
  );
}
