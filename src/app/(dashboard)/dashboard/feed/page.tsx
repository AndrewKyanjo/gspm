// src/app/(dashboard)/dashboard/feed/page.tsx
//
// Ministry Feed — shared, role-agnostic page visible to every approved user.
// Archdiocese admins see the announcement composer; everyone sees the feed.

import Link from "next/link";
import { Megaphone, ArrowLeft } from "lucide-react";
import { requireApprovedUser } from "@/lib/auth/requireApprovedUser";
import { getFeedPosts, getRepliesForPost } from "@/features/feed/queries";
import { FeedPostCard } from "@/components/dashboard/feed/FeedPostCard";
import { FeedComposer } from "@/components/dashboard/feed/FeedComposer";
import { NotificationBell } from "@/components/dashboard/shared/notifications/NotificationBell";

export default async function FeedPage() {
  const result = await requireApprovedUser();
  if (result.status !== "ok") return null;
  const ctx = result.context;

  const canPost =
    ctx.role === "super_admin" || ctx.role === "archdiocese_admin";

  const posts = ctx.archdioceseId
    ? await getFeedPosts(ctx.archdioceseId)
    : [];

  // Pre-fetch replies for posts that have any
  const repliesByPost = new Map<string, Awaited<ReturnType<typeof getRepliesForPost>>>();
  await Promise.all(
    posts
      .filter((p) => p.replyCount > 0)
      .map(async (p) => {
        repliesByPost.set(p.id, await getRepliesForPost(p.id));
      })
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar */}
      <header className="border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur px-5 py-4 md:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-on-surface-variant hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Ministry Feed
              </p>
              <h1 className="text-2xl font-semibold text-on-surface">
                Announcements
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link
              href="/dashboard/notifications"
              className="text-sm text-primary hover:underline"
            >
              All notifications
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 md:px-8 space-y-6">
        {/* Composer (admin only) */}
        {canPost && ctx.archdioceseId && (
          <div className="rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-lowest p-5">
            <div className="flex items-center gap-2 mb-4">
              <Megaphone className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-semibold text-on-surface">
                Post an announcement
              </h2>
            </div>
            <FeedComposer archdioceseId={ctx.archdioceseId} />
          </div>
        )}

        {/* Feed posts */}
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-outline mb-4">
              forum
            </span>
            <h2 className="text-xl font-semibold text-on-surface mb-2">
              No announcements yet
            </h2>
            <p className="text-sm text-on-surface-variant">
              Announcements from the Archdiocese will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <FeedPostCard
                key={post.id}
                post={post}
                replies={repliesByPost.get(post.id) ?? []}
                currentUserId={ctx.userId}
                canDelete={
                  ctx.role === "super_admin" ||
                  ctx.role === "archdiocese_admin" ||
                  post.authorId === ctx.userId
                }
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
