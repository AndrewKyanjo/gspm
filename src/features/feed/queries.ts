// src/features/feed/queries.ts
import { createAdminClient } from "@/lib/supabase/admin";
import type { FeedPost, FeedPostWithReplies } from "./types";

async function resolveAuthors(
  supabase: ReturnType<typeof createAdminClient>,
  authorIds: string[]
) {
  const uniqueIds = [...new Set(authorIds)];
  if (!uniqueIds.length) return { nameMap: new Map<string, string>(), roleMap: new Map<string, string>(), levelMap: new Map<string, string>() };

  const [profilesResult, assignmentsResult] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", uniqueIds),
    supabase
      .from("user_assignments")
      .select("user_id, role, level")
      .in("user_id", uniqueIds)
      .eq("is_primary", true)
      .eq("is_active", true),
  ]);

  const nameMap = new Map((profilesResult.data ?? []).map((p) => [p.id, p.full_name as string | null]));
  const roleMap = new Map((assignmentsResult.data ?? []).map((a) => [a.user_id, a.role as string]));
  const levelMap = new Map((assignmentsResult.data ?? []).map((a) => [a.user_id, a.level as string]));

  return { nameMap, roleMap, levelMap };
}

function mapPost(
  row: Record<string, unknown>,
  nameMap: Map<string, string | null>,
  roleMap: Map<string, string>,
  levelMap: Map<string, string>,
  replyCount = 0
): FeedPost {
  const authorId = row.author_id as string;
  return {
    id: row.id as string,
    parentPostId: (row.parent_post_id as string) ?? null,
    authorId,
    authorName: nameMap.get(authorId) ?? null,
    authorRole: roleMap.get(authorId) ?? null,
    authorLevel: levelMap.get(authorId) ?? null,
    content: row.content as string,
    archdioceseId: row.archdiocese_id as string,
    isPinned: (row.is_pinned as boolean) ?? false,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    deletedAt: (row.deleted_at as string) ?? null,
    replyCount,
  };
}

/**
 * Fetch root posts (parent_post_id IS NULL, not deleted).
 * Ordered: pinned first, then newest first.
 */
export async function getFeedPosts(archdioceseId: string): Promise<FeedPost[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("feed_posts")
    .select("id, parent_post_id, author_id, content, archdiocese_id, is_pinned, created_at, updated_at, deleted_at")
    .eq("archdiocese_id", archdioceseId)
    .is("parent_post_id", null)
    .is("deleted_at", null)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(30);

  if (!data) return [];

  // Reply counts per root post
  const postIds = data.map((p) => p.id);
  const { data: replyRows } = postIds.length
    ? await supabase
        .from("feed_posts")
        .select("parent_post_id")
        .in("parent_post_id", postIds)
        .is("deleted_at", null)
    : { data: [] };
  const countMap = new Map<string, number>();
  for (const r of replyRows ?? []) {
    const pid = r.parent_post_id as string;
    countMap.set(pid, (countMap.get(pid) ?? 0) + 1);
  }

  const authorIds = data.map((p) => p.author_id);
  const { nameMap, roleMap, levelMap } = await resolveAuthors(supabase, authorIds);

  return data.map((p) =>
    mapPost(p as Record<string, unknown>, nameMap, roleMap, levelMap, countMap.get(p.id) ?? 0)
  );
}

/**
 * Fetch replies for a root post, oldest first.
 */
export async function getRepliesForPost(rootPostId: string): Promise<FeedPost[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("feed_posts")
    .select("id, parent_post_id, author_id, content, archdiocese_id, is_pinned, created_at, updated_at, deleted_at")
    .eq("parent_post_id", rootPostId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(100);

  if (!data) return [];

  const authorIds = data.map((r) => r.author_id);
  const { nameMap, roleMap, levelMap } = await resolveAuthors(supabase, authorIds);

  return data.map((r) =>
    mapPost(r as Record<string, unknown>, nameMap, roleMap, levelMap, 0)
  );
}

/**
 * Fetch a single root post with its replies (for linked notifications).
 */
export async function getFeedPostWithReplies(
  postId: string
): Promise<FeedPostWithReplies | null> {
  const supabase = createAdminClient();

  const { data: post } = await supabase
    .from("feed_posts")
    .select("id, parent_post_id, author_id, content, archdiocese_id, is_pinned, created_at, updated_at, deleted_at")
    .eq("id", postId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!post) return null;

  const authorIds = [post.author_id];
  const { nameMap, roleMap, levelMap } = await resolveAuthors(supabase, authorIds);

  const replies = await getRepliesForPost(postId);

  return {
    ...mapPost(post as Record<string, unknown>, nameMap, roleMap, levelMap, replies.length),
    replies,
  };
}
