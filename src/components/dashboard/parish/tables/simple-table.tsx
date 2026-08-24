import { useId, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InteractiveTableShell } from "@/components/dashboard/tables/interactive-table-shell";

type Column<T> = {
  header: string;
  cell: (item: T) => ReactNode;
  className?: string;
};

type RowActions<T> = {
  header?: string;
  cell: (item: T) => ReactNode;
  className?: string;
};

export function SimpleTable<T>({
  title,
  description,
  columns,
  rows,
  rowKey,
  actions,
}: {
  title: string;
  description?: string;
  columns: Column<T>[];
  rows: T[];
  rowKey?: (item: T) => string;
  actions?: RowActions<T>;
}) {
  const tableId = useId();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <InteractiveTableShell tableId={tableId} rowCount={rows.length} title={title}>
          <div className="overflow-x-auto">
            <table id={tableId} className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-outline-variant text-xs uppercase tracking-wide text-on-surface-variant">
                  {columns.map((column) => (
                    <th key={column.header} className={`px-3 py-3 font-semibold ${column.className ?? ""}`}>
                      {column.header}
                    </th>
                  ))}
                  {actions ? (
                    <th className={`px-3 py-3 text-right font-semibold ${actions.className ?? ""}`}>
                      {actions.header ?? "Actions"}
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowKey?.(row) ?? rowIndex} data-table-row className="border-b border-outline-variant/70 last:border-b-0">
                    {columns.map((column) => (
                      <td key={column.header} className={`px-3 py-3 align-top text-on-surface ${column.className ?? ""}`}>
                        {column.cell(row)}
                      </td>
                    ))}
                    {actions ? (
                      <td className={`px-3 py-3 align-top text-on-surface ${actions.className ?? ""}`}>
                        {actions.cell(row)}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </InteractiveTableShell>
      </CardContent>
    </Card>
  );
}
