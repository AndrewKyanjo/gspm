"use client";

import { AuthorBadge } from "./AuthorBadge";
import { Button } from "@/components/ui/button";
import { deleteFeedPost } from "@/features/feed/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FeedPost } from "@/features/feed/types";

export function FeedReplyCard({
  reply,
  currentUserId,
  canDelete,
}: {
  reply: FeedPost;
  currentUserId: string;
  canDelete: boolean;
}) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this reply?")) return;
    setDeleting(true);
    await deleteFeedPost(reply.id);
    router.refresh();
    setDeleting(false);
  }

  const timeAgo = getRelativeTime(reply.createdAt);

  return (
    <div className="bg-feed-reply border border-feed-reply-border rounded-lg p-3 ml-0 sm:ml-8">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <AuthorBadge
              authorName={reply.authorName}
              authorRole={reply.authorRole}
              authorLevel={reply.authorLevel}
            />
            <span className="text-xs text-on-surface-variant">{timeAgo}</span>
          </div>
          <p className="mt-2 text-sm text-on-surface whitespace-pre-wrap leading-relaxed">
            {reply.content}
          </p>
        </div>
        {canDelete && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="shrink-0 text-xs"
          >
            {deleting ? "…" : "Del"}
          </Button>
        )}
      </div>
    </div>
  );
}

function getRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
