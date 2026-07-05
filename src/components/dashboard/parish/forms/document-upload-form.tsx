"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { uploadParishDocument, type ParishDocumentUploadState } from "@/features/parish/documents/actions";
import { Button } from "@/components/ui/button";

const initialState: ParishDocumentUploadState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Uploading..." : "Upload document"}</Button>;
}

export function DocumentUploadForm() {
  const [state, action] = useActionState(uploadParishDocument, initialState);

  return (
    <form action={action} className="space-y-6">
      {state.error ? (
        <div className="rounded-md bg-error-container p-3 text-sm text-on-error-container">{state.error}</div>
      ) : null}

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
        </select>
      </label>

      <label className="space-y-2">
        <span className="block text-sm font-medium text-on-surface">File</span>
        <input
          type="file"
          name="file"
          className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
        />
      </label>

      <SubmitButton />
    </form>
  );
}
