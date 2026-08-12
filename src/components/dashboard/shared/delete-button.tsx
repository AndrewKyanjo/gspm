"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type DeleteButtonProps = {
  /** Called when deletion is confirmed */
  onDelete: () => void | Promise<void>;
  /** Optional accessible label */
  label?: string;
  /** Optional description shown in the confirmation prompt */
  description?: string;
  /** Variant for the initial delete button */
  variant?: "default" | "secondary" | "ghost" | "destructive" | "warning";
  /** Optional callback after successful deletion */
  onSuccess?: () => void;
  /** Optional callback on error */
  onError?: (error: unknown) => void;
};

export function DeleteButton({
  onDelete,
  label = "Delete",
  description = "This action cannot be undone.",
  variant = "ghost",
  onSuccess,
  onError,
}: DeleteButtonProps) {
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const handleDelete = async () => {
    setPending(true);
    try {
      await onDelete();
      onSuccess?.();
    } catch (error) {
      onError?.(error);
    } finally {
      setPending(false);
      setShowConfirm(false);
    }
  };

  if (!showConfirm) {
    return (
      <Button
        type="button"
        variant={variant}
        size="sm"
        onClick={() => setShowConfirm(true)}
        aria-label={label}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-xs text-muted-foreground">{description}</span>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={handleDelete}
      >
        {pending ? "Deleting…" : `Delete`}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => setShowConfirm(false)}
      >
        Cancel
      </Button>
    </span>
  );
}
