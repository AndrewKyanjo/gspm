"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  archdioceseId: string;
  userId: string;
  vicariates: Array<{ id: string; name: string }>;
  deaneries: Array<{ id: string; name: string; vicariateId: string }>;
};

export function DocumentUploadForm({ archdioceseId, userId, vicariates, deaneries }: Props) {
  const router = useRouter();
  const [vicariateId, setVicariateId] = useState("");
  const [deaneryId, setDeaneryId] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const filteredDeaneries = useMemo(
    () => (vicariateId ? deaneries.filter((d) => d.vicariateId === vicariateId) : deaneries),
    [deaneries, vicariateId]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) { setError("Document title is required."); return; }
    if (!deaneryId) { setError("Please select a deanery."); return; }
    if (!file) { setError("Please select a file to upload."); return; }
    if (file.size > 20 * 1024 * 1024) { setError("File size must be under 20 MB."); return; }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());
      formData.append("category", category || "general");
      formData.append("description", description.trim());
      formData.append("archdioceseId", archdioceseId);
      formData.append("vicariateId", vicariateId);
      formData.append("deaneryId", deaneryId);
      formData.append("uploadedBy", userId);

      const res = await fetch("/api/archdiocese/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(body.error ?? "Upload failed");
      }

      setSuccess(true);
      setTimeout(() => router.push("/dashboard/archdiocese/documents"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-center max-w-lg">
        <span className="material-symbols-outlined text-4xl text-primary mb-2">cloud_upload</span>
        <h3 className="text-lg font-semibold text-on-surface mt-3">Document uploaded</h3>
        <p className="text-sm text-on-surface-variant mt-2">Redirecting to document library…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
      {error && (
        <div className="rounded-lg bg-error-container p-3 text-sm text-on-error-container">{error}</div>
      )}

      <div className="space-y-1">
        <label htmlFor="title" className="text-sm font-medium text-on-surface block">Document Title</label>
        <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Annual Report 2025" required className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
      </div>

      <div className="space-y-1">
        <label htmlFor="category" className="text-sm font-medium text-on-surface block">Category <span className="text-on-surface-variant font-normal">(optional)</span></label>
        <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none">
          <option value="">Select category</option>
          <option value="report">Report</option>
          <option value="policy">Policy</option>
          <option value="minutes">Meeting Minutes</option>
          <option value="budget">Budget</option>
          <option value="correspondence">Correspondence</option>
          <option value="general">General</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="vicariate" className="text-sm font-medium text-on-surface block">Vicariate <span className="text-on-surface-variant font-normal">(optional)</span></label>
          <select id="vicariate" value={vicariateId} onChange={(e) => { setVicariateId(e.target.value); setDeaneryId(""); }} className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none">
            <option value="">All vicariates</option>
            {vicariates.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="deanery" className="text-sm font-medium text-on-surface block">Deanery</label>
          <select id="deanery" value={deaneryId} onChange={(e) => setDeaneryId(e.target.value)} required className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none">
            <option value="" disabled>Select deanery</option>
            {filteredDeaneries.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="description" className="text-sm font-medium text-on-surface block">Description <span className="text-on-surface-variant font-normal">(optional)</span></label>
        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this document…" rows={3} className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
      </div>

      <div className="space-y-1">
        <label htmlFor="file" className="text-sm font-medium text-on-surface block">File</label>
        <input id="file" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required className="w-full text-sm text-on-surface file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-on-primary hover:file:bg-primary-container" />
        <p className="text-xs text-on-surface-variant mt-1">Max 20 MB. PDF, DOCX, XLSX, and images supported.</p>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading} className="flex-1">{loading ? "Uploading…" : "Upload Document"}</Button>
        <Button href="/dashboard/archdiocese/documents" variant="secondary">Cancel</Button>
      </div>
    </form>
  );
}
