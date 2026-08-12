"use client";

import * as React from "react";
import { Trash2, Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────

export type DataTableColumn<T> = {
  header: string;
  /** Accessor key or custom cell renderer */
  cell: (row: T) => React.ReactNode;
  /** Optional className for cells in this column */
  className?: string;
};

export type DataTableAction<T> = {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  variant?: "default" | "secondary" | "ghost" | "destructive" | "warning";
  /** When true, shows a confirmation dialog before executing */
  confirm?: { title: string; message: string };
};

export type DataTableProps<T> = {
  title?: string;
  description?: string;
  rows: T[];
  columns: DataTableColumn<T>[];
  /** Unique key for each row */
  getRowKey: (row: T) => string | number;
  /** Actions to show at the end of each row (edit, delete, etc.) */
  actions?: DataTableAction<T>[];
  /** Text to show when there are no rows */
  emptyMessage?: string;
  /** Optional top-right actions area */
  headerActions?: React.ReactNode;
};

// ── Delete confirmation button ────────────────────────────────────

function ConfirmButton({
  label,
  icon,
  variant = "ghost",
  confirmTitle,
  confirmMessage,
  onConfirm,
}: {
  label: string;
  icon?: React.ReactNode;
  variant?: DataTableAction<unknown>["variant"];
  confirmTitle: string;
  confirmMessage: string;
  onConfirm: () => void;
}) {
  const [pending, setPending] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  if (!showConfirm) {
    return (
      <Button
        variant={variant}
        size="sm"
        onClick={() => setShowConfirm(true)}
        aria-label={label}
      >
        {icon ?? <Trash2 className="h-4 w-4" />}
        <span className="sr-only">{label}</span>
      </Button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <Button
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          try {
            onConfirm();
          } finally {
            setPending(false);
            setShowConfirm(false);
          }
        }}
      >
        {pending ? "Deleting…" : "Confirm"}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setShowConfirm(false)} disabled={pending}>
        Cancel
      </Button>
    </span>
  );
}

// ── Component ──────────────────────────────────────────────────────

export function DataTable<T>({
  title,
  description,
  rows,
  columns,
  getRowKey,
  actions,
  emptyMessage = "No records found.",
  headerActions,
}: DataTableProps<T>) {
  const hasActions = actions && actions.length > 0;

  const table = (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col, i) => (
              <TableHead key={i} className={col.className}>
                {col.header}
              </TableHead>
            ))}
            {hasActions && <TableHead className="w-[100px] text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (hasActions ? 1 : 0)}
                className="py-8 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={getRowKey(row)} data-table-row="">
                {columns.map((col, i) => (
                  <TableCell key={i} className={col.className}>
                    {col.cell(row)}
                  </TableCell>
                ))}
                {hasActions && (
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1">
                      {actions!.map((action, i) =>
                        action.confirm ? (
                          <ConfirmButton
                            key={i}
                            label={action.label}
                            icon={action.icon}
                            variant={action.variant}
                            confirmTitle={action.confirm.title}
                            confirmMessage={action.confirm.message}
                            onConfirm={() => action.onClick(row)}
                          />
                        ) : (
                          <Button
                            key={i}
                            variant={action.variant ?? "ghost"}
                            size="sm"
                            onClick={() => action.onClick(row)}
                            aria-label={action.label}
                          >
                            {action.icon ?? <Pencil className="h-4 w-4" />}
                            <span className="sr-only">{action.label}</span>
                          </Button>
                        ),
                      )}
                    </span>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (title) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {headerActions}
        </CardHeader>
        <CardContent className="p-0">{table}</CardContent>
      </Card>
    );
  }

  return table;
}
