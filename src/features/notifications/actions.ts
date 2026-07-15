"use server";

// src/features/notifications/actions.ts

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NotificationItem } from "./types";

/**
 * Get unread notification count — usable from client components as a server action.
 */
export async function getUnreadCount(): Promise<number> {
  const ctx = await requireAuth();

  const supabase = createAdminClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", ctx.userId)
    .is("read_at", null);

  return count ?? 0;
}

/**
 * Get recent notifications for the dropdown — usable from client components.
 */
export async function getRecentNotifications(
  limit = 8
): Promise<NotificationItem[]> {
  const ctx = await requireAuth();

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", ctx.userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    recipientId: r.recipient_id as string,
    type: r.type as NotificationItem["type"],
    title: r.title as string,
    body: (r.body as string) ?? null,
    linkUrl: (r.link_url as string) ?? null,
    relatedTaskId: (r.related_task_id as string) ?? null,
    relatedFeedPostId: (r.related_feed_post_id as string) ?? null,
    readAt: (r.read_at as string) ?? null,
    emailedAt: (r.emailed_at as string) ?? null,
    createdAt: r.created_at as string,
  }));
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await requireAuth();

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("recipient_id", ctx.userId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/notifications");
  return { ok: true };
}

/**
 * Mark all notifications for the current user as read.
 */
export async function markAllNotificationsAsRead(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const ctx = await requireAuth();

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", ctx.userId)
    .is("read_at", null);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/notifications");
  return { ok: true };
}
