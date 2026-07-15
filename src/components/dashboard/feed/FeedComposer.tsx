"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAnnouncement } from "@/features/feed/actions";
import { Button } from "@/components/ui/button";

export function FeedComposer({ archdioceseId }: { archdioceseId: string }) {
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError("Please write a message.");
      return;
    }
    if (content.length > 2000) {
      setError("Message must be under 2000 characters.");
      return;
    }

    setPosting(true);
    const result = await createAnnouncement({ content: content.trim(), archdioceseId });
    if (!result.ok) {
      setError(result.error ?? "Failed to post announcement.");
      setPosting(false);
      return;
    }

    setContent("");
    setPosting(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-lg bg-error-container p-3 text-sm text-on-error-container">
          {error}
        </div>
      )}
      <div className="space-y-1">
        <label htmlFor="feed-announcement" className="text-sm font-medium text-on-surface block">
          New Announcement
        </label>
        <textarea
          id="feed-announcement"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share news, encouragement, or a prayer request with the entire Archdiocese…"
          rows={3}
          maxLength={2000}
          className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-y"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-on-surface-variant">
            {content.length}/2000
          </span>
          <Button type="submit" disabled={posting || !content.trim()}>
            {posting ? "Posting…" : "Post Announcement"}
          </Button>
        </div>
      </div>
    </form>
  );
}
