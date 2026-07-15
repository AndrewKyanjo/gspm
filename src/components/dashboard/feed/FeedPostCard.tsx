"use client";

// src/components/dashboard/feed/FeedPostCard.tsx
import { useState } from "react";
import { AuthorBadge } from "./AuthorBadge";
import { ReplyComposer } from "./ReplyComposer";
import { FeedReplyCard } from "./FeedReplyCard";
import { Button } from "@/components/ui/button";
import { deleteFeedPost } from "@/features/feed/actions";
import { useRouter } from "next/navigation";
import type { FeedPost } from "@/features/feed/types";
import { Pin } from "lucide-react";

export function FeedPostCard({
  post,
  replies,
  currentUserId,
  canDelete,
}: {
  post: FeedPost;
  replies: FeedPost[];
  currentUserId: string;
  canDelete: boolean;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this announcement? Replies will also be removed.")) return;
    setDeleting(true);
    await deleteFeedPost(post.id);
    router.refresh();
    setDeleting(false);
  }

  const timeAgo = getRelativeTime(post.createdAt);

  return (
    <div className="bg-feed-post border border-feed-post-border rounded-xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {post.isPinned && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-primary">
                <Pin className="h-3 w-3" />
                Pinned
              </span>
            )}
            <AuthorBadge
              authorName={post.authorName}
              authorRole={post.authorRole}
              authorLevel={post.authorLevel}
            />
            <span className="text-xs text-on-surface-variant">{timeAgo}</span>
          </div>
        </div>
        {canDelete && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="shrink-0"
          >
            {deleting ? "…" : "Delete"}
          </Button>
        )}
      </div>

      {/* Content */}
      <p className="mt-3 text-sm text-on-surface whitespace-pre-wrap leading-relaxed">
        {post.content}
      </p>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={() => {
            setShowReplies(!showReplies);
            if (!showReplies) setShowComposer(false);
          }}
          className="text-xs font-medium text-primary hover:underline"
        >
          {post.replyCount > 0
            ? `${post.replyCount} ${post.replyCount === 1 ? "reply" : "replies"}`
            : "Reply"}
        </button>
        <button
          onClick={() => setShowComposer(!showComposer)}
          className="text-xs text-on-surface-variant hover:text-primary transition-colors"
        >
          {showComposer ? "Cancel" : "Write a reply"}
        </button>
      </div>

      {/* Reply composer */}
      {showComposer && (
        <div className="mt-3">
          <ReplyComposer
            parentPostId={post.id}
            archdioceseId={post.archdioceseId}
            onSuccess={() => {
              setShowComposer(false);
              setShowReplies(true);
              router.refresh();
            }}
          />
        </div>
      )}

      {/* Replies (collapsible) */}
      {showReplies && replies.length > 0 && (
        <div className="mt-4 space-y-3">
          {replies.map((reply) => (
            <FeedReplyCard
              key={reply.id}
              reply={reply}
              currentUserId={currentUserId}
              canDelete={canDelete || reply.authorId === currentUserId}
            />
          ))}
        </div>
      )}
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
