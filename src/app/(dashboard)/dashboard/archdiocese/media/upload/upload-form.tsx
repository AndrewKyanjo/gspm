"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  archdioceseId: string;
  userId: string;
  parishes: Array<{ id: string; name: string; deaneryId: string; vicariateId: string }>;
};

export function MediaUploadForm({ archdioceseId, parishes, userId }: Props) {
  const router = useRouter();
  const [parishId, setParishId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files ?? []);
    setFiles(selectedFiles);
    setPreviews([]);

    for (const selectedFile of selectedFiles.slice(0, 6)) {
      if (!selectedFile.type.startsWith("image/")) {
        continue;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setPreviews((current) => [...current, reader.result as string]);
      };
      reader.readAsDataURL(selectedFile);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) { setError("Title is required."); return; }
    if (!parishId) { setError("Please select a parish."); return; }
    if (files.length === 0) { setError("Please select at least one image file."); return; }
    for (const selectedFile of files) {
      if (!selectedFile.type.startsWith("image/")) { setError("Only image files are supported."); return; }
      if (selectedFile.size > 10 * 1024 * 1024) { setError("Each file must be under 10 MB."); return; }
    }

    setLoading(true);

    try {
      for (const [index, selectedFile] of files.entries()) {
        const formData = new FormData();
        const itemTitle = files.length > 1 ? `${title.trim()} - ${index + 1}` : title.trim();
        formData.append("file", selectedFile);
        formData.append("title", itemTitle);
        formData.append("description", description.trim());
        formData.append("archdioceseId", archdioceseId);
        formData.append("parishId", parishId);
        formData.append("uploadedBy", userId);

        const res = await fetch("/api/archdiocese/media/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: "Upload failed" }));
          throw new Error(body.error ?? "Upload failed");
        }
      }

      setSuccess(true);
      setTimeout(() => router.push("/dashboard/archdiocese/media"), 1500);
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
        <h3 className="text-lg font-semibold text-on-surface mt-3">Media uploaded</h3>
        <p className="text-sm text-on-surface-variant mt-2">Redirecting to media library…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
      {error && (
        <div className="rounded-lg bg-error-container p-3 text-sm text-on-error-container">{error}</div>
      )}

      <div className="space-y-1">
        <label htmlFor="title" className="text-sm font-medium text-on-surface block">Title</label>
        <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Parish Outreach Event 2025" required className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
      </div>

      <div className="space-y-1">
        <label htmlFor="parish" className="text-sm font-medium text-on-surface block">Parish</label>
        <select id="parish" value={parishId} onChange={(e) => setParishId(e.target.value)} required className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none">
          <option value="" disabled>Select a parish</option>
          {parishes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="description" className="text-sm font-medium text-on-surface block">Description <span className="text-on-surface-variant font-normal">(optional)</span></label>
        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this image…" rows={2} className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
      </div>

      <div className="space-y-1">
        <label htmlFor="file" className="text-sm font-medium text-on-surface block">Image File</label>
        <input id="file" type="file" accept="image/*" multiple onChange={handleFileChange} required className="w-full text-sm text-on-surface file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-on-primary hover:file:bg-primary-container" />
        <p className="text-xs text-on-surface-variant mt-1">Max 10 MB. JPEG, PNG, WebP supported.</p>
      </div>

      {previews.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {previews.map((preview, index) => (
            <div key={`${preview}-${index}`} className="rounded-xl border border-outline-variant overflow-hidden">
              <img src={preview} alt={`Preview ${index + 1}`} className="w-full object-cover max-h-64" />
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading} className="flex-1">{loading ? "Uploading…" : "Upload Media"}</Button>
        <Button href="/dashboard/archdiocese/media" variant="secondary">Cancel</Button>
      </div>
    </form>
  );
}
