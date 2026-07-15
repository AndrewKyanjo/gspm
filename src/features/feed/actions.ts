"use server";

// src/features/feed/actions.ts
//
// Server actions for the Ministry Feed.  Admins create root announcements;
// any approved user can reply.  Soft-delete is available to the author or admin.

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CreateAnnouncementInput, CreateReplyInput } from "./types";

/**
 * Create a root announcement.  Restricted to archdiocese admins.
 */
export async function createAnnouncement(
  input: CreateAnnouncementInput
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await requireAuth({ roles: ["super_admin", "archdiocese_admin"] });
  if (!ctx.archdioceseId) return { ok: false, error: "No archdiocese context." };

  const content = input.content.trim();
  if (!content || content.length > 2000) {
    return { ok: false, error: "Content must be 1–2000 characters." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("feed_posts").insert({
    author_id: ctx.userId,
    content,
    archdiocese_id: input.archdioceseId,
    parent_post_id: null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/feed");
  return { ok: true };
}

/**
 * Reply to a root post.  Any approved user can reply.
 */
export async function createReply(
  input: CreateReplyInput
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await requireAuth();
  if (!ctx.archdioceseId) return { ok: false, error: "No archdiocese context." };

  const content = input.content.trim();
  if (!content || content.length > 2000) {
    return { ok: false, error: "Content must be 1–2000 characters." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("feed_posts").insert({
    author_id: ctx.userId,
    content,
    archdiocese_id: input.archdioceseId,
    parent_post_id: input.parentPostId,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/feed");
  return { ok: true };
}

/**
 * Soft-delete a post (author or admin).
 */
export async function deleteFeedPost(
  postId: string
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await requireAuth();

  const supabase = createAdminClient();

  // Verify ownership or admin
  const { data: post } = await supabase
    .from("feed_posts")
    .select("author_id")
    .eq("id", postId)
    .maybeSingle();

  if (!post) return { ok: false, error: "Post not found." };

  const isAdmin =
    ctx.role === "super_admin" || ctx.role === "archdiocese_admin";
  const isAuthor = post.author_id === ctx.userId;

  if (!isAdmin && !isAuthor) {
    return { ok: false, error: "Not authorized to delete this post." };
  }

  const { error } = await supabase
    .from("feed_posts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", postId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/feed");
  return { ok: true };
}
