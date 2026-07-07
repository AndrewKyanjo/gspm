"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  uploadDeaneryDocument,
  type DeaneryDocumentUploadState,
} from "@/features/deanery/documents/actions";
import { Button } from "@/components/ui/button";

const initialState: DeaneryDocumentUploadState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Uploading..." : "Upload document"}
    </Button>
  );
}

export function DeaneryDocumentUploadForm() {
  const [state, action] = useActionState(uploadDeaneryDocument, initialState);

  return (
    <form action={action} className="space-y-6">
      {state.error ? (
        <div className="rounded-md bg-error-container p-3 text-sm text-on-error-container">
          {state.error}
        </div>
      ) : null}

      <label className="space-y-2">
        <span className="block text-sm font-medium text-on-surface">Title</span>
        <input
          type="text"
          name="title"
          required
          className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
          placeholder="e.g. Deanery finance policy 2025"
        />
      </label>

      <label className="space-y-2">
        <span className="block text-sm font-medium text-on-surface">Category</span>
        <select
          name="category"
          defaultValue="general"
          className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
        >
          <option value="general">General</option>
          <option value="minutes">Minutes</option>
          <option value="bulletins">Bulletins</option>
          <option value="policies">Policies</option>
          <option value="reports">Reports</option>
          <option value="finance">Finance</option>
        </select>
      </label>

      <label className="space-y-2">
        <span className="block text-sm font-medium text-on-surface">Description (optional)</span>
        <input
          type="text"
          name="description"
          className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
          placeholder="Brief summary of the document"
        />
      </label>

      <label className="space-y-2">
        <span className="block text-sm font-medium text-on-surface">File</span>
        <input
          type="file"
          name="file"
          required
          className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
        />
      </label>

      <SubmitButton />
    </form>
  );
}
