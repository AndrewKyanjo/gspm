"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, FileSearch, RefreshCw, Trash2, Upload, X } from "lucide-react";
import { DocumentPreviewButton } from "@/components/dashboard/shared/document-preview-button";
import { Button } from "@/components/ui/button";
import {
  clearPastDocumentImportStagingAction,
  publishSelectedPastDocumentImports,
  rejectPastDocumentImport,
  scanPastDocumentImportAction,
  updatePastDocumentImportReview,
} from "@/features/archdiocese/past-documents/actions";
import type { PastDocumentImportItem, PastDocumentScopeLevel } from "@/features/archdiocese/past-documents/types";
import { cn } from "@/lib/utils";

type HierarchyOption = {
  id: string;
  name: string;
  archdioceseId: string;
  vicariateId?: string | null;
  deaneryId?: string | null;
};

type Props = {
  documents: PastDocumentImportItem[];
  vicariates: HierarchyOption[];
  deaneries: HierarchyOption[];
  parishes: HierarchyOption[];
};

const scopeOptions: Array<{ value: PastDocumentScopeLevel; label: string }> = [
  { value: "archdiocese", label: "Archdiocese" },
  { value: "vicariate", label: "Vicariate" },
  { value: "deanery", label: "Deanery" },
  { value: "parish", label: "Parish" },
  { value: "unknown", label: "Needs review" },
];

const categories = [
  "general",
  "report",
  "policy",
  "minutes",
  "budget",
  "correspondence",
  "other",
];

const statusClasses: Record<string, string> = {
  uploaded: "border-outline-variant bg-surface-container-lowest text-on-surface-variant",
  scanning: "border-primary bg-primary-container text-on-primary-container",
  scanned: "border-primary bg-primary-container text-on-primary-container",
  needs_review: "border-secondary bg-secondary-container text-on-secondary-container",
  ready_for_upload: "border-primary bg-primary text-on-primary",
  published: "border-tertiary bg-tertiary-container text-on-tertiary-container",
  failed: "border-error bg-error-container text-on-error-container",
  rejected: "border-outline-variant bg-surface-container text-on-surface-variant",
};

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function scopeLabel(item: PastDocumentImportItem) {
  if (item.scope_level === "parish") return item.parishName ?? "Parish";
  if (item.scope_level === "deanery") return item.deaneryName ?? "Deanery";
  if (item.scope_level === "vicariate") return item.vicariateName ?? "Vicariate";
  if (item.scope_level === "archdiocese") return "Archdiocese";
  return "Needs review";
}

export function PastDocumentImportWorkspace({ documents, vicariates, deaneries, parishes }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const readyIds = useMemo(
    () => new Set(documents.filter((item) => item.review_status === "ready_for_upload").map((item) => item.id)),
    [documents],
  );

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const files = Array.from(fileInputRef.current?.files ?? []);
    if (files.length === 0) {
      setError("Choose at least one document.");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    setUploading(true);

    try {
      const response = await fetch("/api/archdiocese/past-documents/import", {
        method: "POST",
        body: formData,
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        results?: Array<{ status: string }>;
      };

      if (!response.ok) {
        throw new Error(body.error ?? "Import failed.");
      }

      const scanned = body.results?.filter((item) => item.status === "scanned").length ?? 0;
      const needsReview = body.results?.filter((item) => item.status === "needs_review").length ?? 0;
      const failed = body.results?.filter((item) => item.status === "failed").length ?? 0;
      setMessage(
        `Imported ${scanned + needsReview} document${scanned + needsReview === 1 ? "" : "s"}${
          needsReview ? `, ${needsReview} need review` : ""
        }${failed ? `, ${failed} failed` : ""}.`,
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Import failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5">
        <form onSubmit={handleUpload} className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <label htmlFor="documents" className="block text-sm font-medium text-on-surface">
              Bulk document import
            </label>
            <input
              id="documents"
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.xlsx,.pptx,.txt"
              className="w-full text-sm text-on-surface file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-on-primary hover:file:bg-primary-container"
            />
          </div>
          <Button type="submit" disabled={uploading}>
            <Upload className="h-4 w-4" />
            {uploading ? "Importing" : "Import files"}
          </Button>
        </form>
        {message ? <p className="mt-3 text-sm text-primary">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
      </section>

      <section className="rounded-lg border border-outline-variant bg-surface p-4">
        <form action={publishSelectedPastDocumentImports} className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-on-surface">Staging area</h2>
            <p className="text-sm text-on-surface-variant">
              {documents.length} staged, {readyIds.size} ready
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">
              Clear removes staging records and temporary files only; published library files remain.
            </p>
          </div>
          {selectedIds.map((id) => (
            <input key={id} type="hidden" name="importId" value={id} />
          ))}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={selectedIds.length === 0}>
              <Check className="h-4 w-4" />
              Publish selected
            </Button>
            <Button
              type="submit"
              variant="ghost"
              disabled={documents.length === 0}
              formAction={clearPastDocumentImportStagingAction}
            >
              <Trash2 className="h-4 w-4" />
              Clear staging area
            </Button>
          </div>
        </form>
      </section>

      <div className="space-y-4">
        {documents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center">
            <FileSearch className="mx-auto h-8 w-8 text-on-surface-variant" />
            <h2 className="mt-3 text-base font-semibold text-on-surface">No staged documents</h2>
          </div>
        ) : (
          documents.map((item) => (
            <article key={item.id} className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    disabled={!readyIds.has(item.id)}
                    onChange={() => toggleSelected(item.id)}
                    className="mt-1 h-4 w-4 rounded border-outline-variant text-primary"
                    aria-label={`Select ${item.original_filename}`}
                  />
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words text-base font-semibold text-on-surface">
                        {item.title || item.original_filename}
                      </h3>
                      <span
                        className={cn(
                          "rounded-md border px-2 py-1 text-xs font-medium capitalize",
                          statusClasses[item.review_status] ?? statusClasses.uploaded,
                        )}
                      >
                        {formatStatus(item.review_status)}
                      </span>
                    </div>
                    <p className="break-words text-sm text-on-surface-variant">
                      {item.description || "No description yet."}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-on-surface-variant">
                      <span>{item.original_filename}</span>
                      <span>{formatBytes(Number(item.file_size ?? 0))}</span>
                      <span>{scopeLabel(item)}</span>
                      <span>{item.category || "general"}</span>
                      {typeof item.ai_confidence === "number" ? (
                        <span>{Math.round(item.ai_confidence * 100)}% confidence</span>
                      ) : null}
                    </div>
                    {item.error_message ? (
                      <p className="text-sm text-error">{item.error_message}</p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <DocumentPreviewButton
                    bucket="past-document-imports"
                    path={item.staging_storage_path}
                    title={item.title}
                  />
                  <form action={scanPastDocumentImportAction}>
                    <input type="hidden" name="importId" value={item.id} />
                    <Button type="submit" variant="secondary" size="sm">
                      <RefreshCw className="h-4 w-4" />
                      Scan
                    </Button>
                  </form>
                  <form action={rejectPastDocumentImport}>
                    <input type="hidden" name="importId" value={item.id} />
                    <Button type="submit" variant="ghost" size="sm" disabled={item.review_status === "published"}>
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </form>
                </div>
              </div>

              <details className="mt-4 rounded-md border border-outline-variant bg-surface p-4">
                <summary className="cursor-pointer text-sm font-medium text-on-surface">Review metadata</summary>
                <form action={updatePastDocumentImportReview} className="mt-4 grid gap-4">
                  <input type="hidden" name="importId" value={item.id} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-1 text-sm font-medium text-on-surface">
                      <span>Title</span>
                      <input
                        name="title"
                        defaultValue={item.title ?? ""}
                        className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="space-y-1 text-sm font-medium text-on-surface">
                      <span>Category</span>
                      <select
                        name="category"
                        defaultValue={item.category ?? "general"}
                        className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm"
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="space-y-1 text-sm font-medium text-on-surface">
                    <span>Description</span>
                    <textarea
                      name="description"
                      defaultValue={item.description ?? ""}
                      rows={3}
                      className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm"
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-4">
                    <label className="space-y-1 text-sm font-medium text-on-surface">
                      <span>Scope</span>
                      <select
                        name="scopeLevel"
                        defaultValue={item.scope_level}
                        className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm"
                      >
                        {scopeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-sm font-medium text-on-surface">
                      <span>Vicariate</span>
                      <select
                        name="vicariateId"
                        defaultValue={item.vicariate_id ?? ""}
                        className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm"
                      >
                        <option value="">None</option>
                        {vicariates.map((vicariate) => (
                          <option key={vicariate.id} value={vicariate.id}>
                            {vicariate.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-sm font-medium text-on-surface">
                      <span>Deanery</span>
                      <select
                        name="deaneryId"
                        defaultValue={item.deanery_id ?? ""}
                        className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm"
                      >
                        <option value="">None</option>
                        {deaneries.map((deanery) => (
                          <option key={deanery.id} value={deanery.id}>
                            {deanery.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-sm font-medium text-on-surface">
                      <span>Parish</span>
                      <select
                        name="parishId"
                        defaultValue={item.parish_id ?? ""}
                        className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm"
                      >
                        <option value="">None</option>
                        {parishes.map((parish) => (
                          <option key={parish.id} value={parish.id}>
                            {parish.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {item.ai_reasoning ? (
                    <p className="rounded-md bg-surface-container p-3 text-xs text-on-surface-variant">
                      {item.ai_reasoning}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" name="markReady" value="false" variant="secondary">
                      Save review
                    </Button>
                    <Button type="submit" name="markReady" value="true">
                      <Check className="h-4 w-4" />
                      Mark ready
                    </Button>
                  </div>
                </form>
              </details>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
