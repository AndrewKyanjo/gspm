// src/features/notifications/queries.ts
import { createAdminClient } from "@/lib/supabase/admin";
import type { NotificationItem } from "./types";

function mapNotification(row: Record<string, unknown>): NotificationItem {
  return {
    id: row.id as string,
    recipientId: row.recipient_id as string,
    type: row.type as NotificationItem["type"],
    title: row.title as string,
    body: (row.body as string) ?? null,
    linkUrl: (row.link_url as string) ?? null,
    relatedTaskId: (row.related_task_id as string) ?? null,
    relatedFeedPostId: (row.related_feed_post_id as string) ?? null,
    readAt: (row.read_at as string) ?? null,
    emailedAt: (row.emailed_at as string) ?? null,
    createdAt: row.created_at as string,
  };
}

/**
 * Fetch notifications for the current user, newest first.
 */
export async function getMyNotifications(
  userId: string,
  limit = 50
): Promise<NotificationItem[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((r) => mapNotification(r as Record<string, unknown>));
}

/**
 * Get unread notification count for the current user.
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = createAdminClient();

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .is("read_at", null);

  return count ?? 0;
}
