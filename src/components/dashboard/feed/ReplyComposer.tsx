"use client";

import { useState } from "react";
import { createReply } from "@/features/feed/actions";
import { Button } from "@/components/ui/button";

export function ReplyComposer({
  parentPostId,
  archdioceseId,
  onSuccess,
}: {
  parentPostId: string;
  archdioceseId: string;
  onSuccess?: () => void;
}) {
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError("Please write a reply.");
      return;
    }
    if (content.length > 2000) {
      setError("Reply must be under 2000 characters.");
      return;
    }

    setPosting(true);
    const result = await createReply({
      parentPostId,
      content: content.trim(),
      archdioceseId,
    });
    if (!result.ok) {
      setError(result.error ?? "Failed to post reply.");
      setPosting(false);
      return;
    }

    setContent("");
    setPosting(false);
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {error && (
        <div className="rounded bg-error-container p-2 text-xs text-on-error-container">
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a reply…"
          maxLength={2000}
          className="flex-1 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
        />
        <Button type="submit" disabled={posting || !content.trim()} size="sm">
          {posting ? "…" : "Reply"}
        </Button>
      </div>
    </form>
  );
}
