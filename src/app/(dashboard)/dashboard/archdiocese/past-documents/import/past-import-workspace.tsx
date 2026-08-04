"use client";

import { useState } from "react";
import { FileText, Image as ImageIcon } from "lucide-react";
import { PastDocumentImportWorkspace } from "./import-workspace";
import { PastMediaImportWorkspace } from "./past-media-import-workspace";
import type { PastDocumentImportItem } from "@/features/archdiocese/past-documents/types";
import type { PastMediaImportItem } from "@/features/archdiocese/past-media/types";
import { cn } from "@/lib/utils";

type HierarchyOption = {
  id: string;
  name: string;
  archdioceseId: string;
  vicariateId?: string | null;
  deaneryId?: string | null;
};

type Props = {
  initialMode: "documents" | "media";
  documents: PastDocumentImportItem[];
  media: PastMediaImportItem[];
  vicariates: HierarchyOption[];
  deaneries: HierarchyOption[];
  parishes: HierarchyOption[];
};

export function PastImportWorkspace({ initialMode, documents, media, vicariates, deaneries, parishes }: Props) {
  const [mode, setMode] = useState<"documents" | "media">(initialMode);

  function chooseMode(nextMode: "documents" | "media") {
    setMode(nextMode);
    const url = new URL(window.location.href);
    url.searchParams.set("type", nextMode);
    window.history.replaceState(null, "", url.toString());
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-2 md:grid-cols-2">
        <button
          type="button"
          onClick={() => chooseMode("documents")}
          className={cn(
            "flex items-center gap-3 rounded-md px-4 py-3 text-left transition-colors",
            mode === "documents" ? "bg-primary text-on-primary" : "text-on-surface hover:bg-surface-container",
          )}
        >
          <FileText className="h-5 w-5" />
          <span>
            <span className="block text-sm font-semibold">Document import</span>
            <span className={cn("block text-xs", mode === "documents" ? "text-primary-fixed" : "text-on-surface-variant")}>
              Stage PDFs, Office files, text files, and document metadata.
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => chooseMode("media")}
          className={cn(
            "flex items-center gap-3 rounded-md px-4 py-3 text-left transition-colors",
            mode === "media" ? "bg-primary text-on-primary" : "text-on-surface hover:bg-surface-container",
          )}
        >
          <ImageIcon className="h-5 w-5" />
          <span>
            <span className="block text-sm font-semibold">Media import</span>
            <span className={cn("block text-xs", mode === "media" ? "text-primary-fixed" : "text-on-surface-variant")}>
              Stage historical images, detected dates, scope tags, and gallery metadata.
            </span>
          </span>
        </button>
      </div>

      {mode === "documents" ? (
        <PastDocumentImportWorkspace
          documents={documents}
          vicariates={vicariates}
          deaneries={deaneries}
          parishes={parishes}
        />
      ) : (
        <PastMediaImportWorkspace media={media} vicariates={vicariates} deaneries={deaneries} parishes={parishes} />
      )}
    </div>
  );
}
