"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { markNotificationAsRead } from "@/features/notifications/actions";
import type { NotificationItem } from "@/features/notifications/types";
import { ExternalLink } from "lucide-react";

export function NotificationRow({ item }: { item: NotificationItem }) {
  const router = useRouter();

  async function handleClick() {
    if (!item.readAt) {
      await markNotificationAsRead(item.id);
      router.refresh();
    }
  }

  const icon = typeIcon(item.type);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 hover:bg-surface-container transition-colors cursor-pointer ${
        !item.readAt ? "bg-primary-container/10" : ""
      }`}
      onClick={handleClick}
    >
      <span
        className="material-symbols-outlined text-xl mt-0.5 shrink-0"
        style={{
          fontVariationSettings: !item.readAt ? '"FILL" 1' : '"FILL" 0',
          color: !item.readAt ? "var(--color-primary, #002045)" : "var(--color-outline, #74777f)",
        }}
      >
        {icon}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-on-surface">
            {item.title}
          </p>
          {!item.readAt && (
            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
          )}
        </div>
        {item.body && (
          <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">
            {item.body}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-outline">
            {timeAgo(item.createdAt)}
          </span>
          {item.linkUrl && (
            <Link
              href={item.linkUrl}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              View
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function typeIcon(type: NotificationItem["type"]): string {
  switch (type) {
    case "feed_post_new":
      return "campaign";
    case "feed_reply_new":
      return "chat_bubble";
    case "task_assigned":
    case "task_due_soon":
    case "task_overdue":
      return "assignment";
    case "report_period_open":
    case "report_overdue":
      return "description";
    default:
      return "notifications";
  }
}

function timeAgo(iso: string): string {
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
