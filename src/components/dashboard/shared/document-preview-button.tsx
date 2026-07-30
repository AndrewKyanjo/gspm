"use client";

import { useEffect, useState } from "react";
import { Download, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type PreviewPayload = {
  kind: "pdf" | "office" | "image" | "text" | "unsupported";
  fileName: string;
  previewHtml: string | null;
  inlineUrl: string | null;
  downloadUrl: string;
  metadata: {
    title?: string | null;
    subject?: string | null;
    author?: string | null;
    createdAt?: string | null;
    modifiedAt?: string | null;
    pageCount?: number | null;
    wordCount?: number | null;
    slideCount?: number | null;
    sheetCount?: number | null;
    mimeType?: string | null;
  };
};

type Props = {
  bucket: string;
  path: string;
  label?: string;
  title?: string | null;
  size?: "sm" | "default";
};

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString();
}

function metadataRows(payload: PreviewPayload) {
  const metadata = payload.metadata ?? {};
  return [
    ["Author", metadata.author],
    ["Created", formatDate(metadata.createdAt)],
    ["Modified", formatDate(metadata.modifiedAt)],
    ["Pages", metadata.pageCount],
    ["Words", metadata.wordCount],
    ["Slides", metadata.slideCount],
    ["Sheets", metadata.sheetCount],
    ["Type", metadata.mimeType],
  ].filter(([, value]) => value !== null && value !== undefined && value !== "");
}

export function DocumentPreviewButton({ bucket, path, label = "Preview", title, size = "sm" }: Props) {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<PreviewPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  async function loadPreview() {
    setOpen(true);
    if (payload || loading) return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ bucket, path });
      const response = await fetch(`/api/documents/preview?${params.toString()}`);
      const body = (await response.json().catch(() => ({}))) as PreviewPayload & { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Preview failed.");
      }
      setPayload(body);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Preview failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button type="button" variant="secondary" size={size} onClick={loadPreview}>
        <Eye className="h-4 w-4" />
        {label}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/40 p-3 backdrop-blur-sm md:p-8" role="dialog" aria-modal="true">
          <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-lg border border-outline-variant bg-surface shadow-xl">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant px-4 py-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-on-surface">
                  {title || payload?.metadata.title || payload?.fileName || "Document preview"}
                </h2>
                <p className="truncate text-xs text-on-surface-variant">{payload?.fileName ?? path}</p>
              </div>
              <div className="flex gap-2">
                {payload?.downloadUrl ? (
                  <Button href={payload.downloadUrl} size="sm">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                ) : null}
                <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)} aria-label="Close preview">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </header>

            <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_280px]">
              <main className="min-h-0 overflow-auto bg-surface-container-lowest">
                {loading ? (
                  <div className="flex h-full items-center justify-center p-8 text-sm text-on-surface-variant">
                    Preparing preview
                  </div>
                ) : error ? (
                  <div className="p-6 text-sm text-error">{error}</div>
                ) : payload?.inlineUrl && payload.kind === "pdf" ? (
                  <iframe
                    src={payload.inlineUrl}
                    title="Document preview"
                    sandbox="allow-same-origin allow-scripts"
                    className="h-full min-h-[70vh] w-full"
                  />
                ) : payload?.inlineUrl && payload.kind === "image" ? (
                  <div className="flex min-h-full items-start justify-center p-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={payload.inlineUrl} alt={payload.fileName} className="max-h-full max-w-full object-contain" />
                  </div>
                ) : payload?.previewHtml ? (
                  <div
                    className="document-preview-content p-6 text-sm leading-7 text-on-surface"
                    dangerouslySetInnerHTML={{ __html: payload.previewHtml }}
                  />
                ) : (
                  <div className="p-6 text-sm text-on-surface-variant">
                    A scrollable preview is not available for this file type. Use Download to open it.
                  </div>
                )}
              </main>

              <aside className="overflow-auto border-t border-outline-variant bg-surface p-4 lg:border-l lg:border-t-0">
                <h3 className="text-sm font-semibold text-on-surface">Document metadata</h3>
                {payload ? (
                  <dl className="mt-3 space-y-3 text-sm">
                    {metadataRows(payload).map(([label, value]) => (
                      <div key={String(label)}>
                        <dt className="text-xs uppercase text-on-surface-variant">{label}</dt>
                        <dd className="break-words text-on-surface">{String(value)}</dd>
                      </div>
                    ))}
                    {metadataRows(payload).length === 0 ? (
                      <p className="text-sm text-on-surface-variant">No embedded metadata was found.</p>
                    ) : null}
                  </dl>
                ) : null}
              </aside>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
