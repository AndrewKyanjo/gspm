"use client";

import { useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type RowActionResult = { error?: string | null } | void;

type ServerRowAction = (formData: FormData) => Promise<RowActionResult>;

type EditDeleteRowActionsProps = {
  recordId: string;
  initialName: string;
  editAction: ServerRowAction;
  deleteAction: ServerRowAction;
  recordType?: string;
  nameLabel?: string;
  deleteDescription?: string;
  hiddenFields?: Record<string, string>;
};

export function EditDeleteRowActions({
  recordId,
  initialName,
  editAction,
  deleteAction,
  recordType,
  nameLabel = "Name",
  deleteDescription,
  hiddenFields = {},
}: EditDeleteRowActionsProps) {
  const [mode, setMode] = useState<"edit" | "delete" | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function appendHiddenFields(formData: FormData) {
    formData.set("recordId", recordId);
    if (recordType) formData.set("recordType", recordType);
    for (const [key, value] of Object.entries(hiddenFields)) {
      formData.set(key, value);
    }
  }

  async function runAction(action: ServerRowAction, formData: FormData) {
    appendHiddenFields(formData);
    setPending(true);
    setError(null);

    try {
      const result = await action(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setMode(null);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "The action could not be completed.");
    } finally {
      setPending(false);
    }
  }

  if (mode === "edit") {
    return (
      <form
        className="min-w-56 space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          void runAction(editAction, new FormData(event.currentTarget));
        }}
      >
        <label className="block text-xs font-medium text-on-surface-variant">
          {nameLabel}
          <input
            name="name"
            defaultValue={initialName}
            required
            autoFocus
            className="mt-1 w-full rounded-md border border-outline-variant bg-surface px-2 py-1.5 text-sm text-on-surface"
          />
        </label>
        {error ? <p className="text-xs text-error">{error}</p> : null}
        <div className="flex gap-1">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
          <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => setMode(null)}>
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  if (mode === "delete") {
    return (
      <div className="min-w-56 space-y-2">
        <p className="text-xs text-on-surface-variant">
          {deleteDescription ?? `Delete “${initialName}”? This cannot be undone.`}
        </p>
        {error ? <p className="text-xs text-error">{error}</p> : null}
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() => void runAction(deleteAction, new FormData())}
          >
            <Trash2 className="h-4 w-4" />
            {pending ? "Deleting…" : "Delete"}
          </Button>
          <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => setMode(null)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1 whitespace-nowrap">
      <Button type="button" size="sm" variant="ghost" onClick={() => setMode("edit")} aria-label={`Edit ${initialName}`}>
        <Pencil className="h-4 w-4" />
        Edit
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setMode("delete")} aria-label={`Delete ${initialName}`}>
        <Trash2 className="h-4 w-4 text-error" />
        Delete
      </Button>
    </div>
  );
}
