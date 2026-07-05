import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type Column<T> = {
  header: string;
  cell: (item: T) => ReactNode;
  className?: string;
};

export function SimpleTable<T>({
  title,
  description,
  columns,
  rows,
}: {
  title: string;
  description?: string;
  columns: Column<T>[];
  rows: T[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-outline-variant text-xs uppercase tracking-wide text-on-surface-variant">
                {columns.map((column) => (
                  <th key={column.header} className={`px-3 py-3 font-semibold ${column.className ?? ""}`}>
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-outline-variant/70 last:border-b-0">
                  {columns.map((column) => (
                    <td key={column.header} className={`px-3 py-3 align-top text-on-surface ${column.className ?? ""}`}>
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
