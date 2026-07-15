// src/features/notifications/types.ts

export type NotificationItem = {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  linkUrl: string | null;
  relatedTaskId: string | null;
  relatedFeedPostId: string | null;
  readAt: string | null;
  emailedAt: string | null;
  createdAt: string;
};

export type NotificationType =
  | "task_assigned"
  | "task_due_soon"
  | "task_overdue"
  | "report_period_open"
  | "report_overdue"
  | "feed_post_new"
  | "feed_reply_new";
