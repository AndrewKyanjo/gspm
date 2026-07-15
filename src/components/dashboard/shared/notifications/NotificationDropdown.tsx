"use client";

// src/components/dashboard/shared/notifications/NotificationDropdown.tsx

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getRecentNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/features/notifications/actions";
import { Button } from "@/components/ui/button";
import type { NotificationItem } from "@/features/notifications/types";
import { CheckCheck, ExternalLink } from "lucide-react";

export function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    try {
      const data = await getRecentNotifications(8);
      setItems(data);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function handleMarkRead(id: string) {
    await markNotificationAsRead(id);
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, readAt: new Date().toISOString() } : item
      )
    );
  }

  async function handleMarkAllRead() {
    await markAllNotificationsAsRead();
    setItems((prev) =>
      prev.map((item) => ({ ...item, readAt: new Date().toISOString() }))
    );
  }

  const unreadCount = items.filter((i) => !i.readAt).length;

  const typeIcon = (type: NotificationItem["type"]) => {
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
  };

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
        <h3 className="text-sm font-semibold text-on-surface">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 text-xs text-on-surface-variant">
              ({unreadCount} new)
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-on-surface-variant">
            Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <span className="material-symbols-outlined text-3xl text-outline mb-2">
              notifications_off
            </span>
            <p className="text-sm text-on-surface-variant">
              No notifications yet
            </p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {items.map((item) => (
              <div
                key={item.id}
                className={`px-4 py-3 hover:bg-surface-container transition-colors ${
                  !item.readAt ? "bg-primary-container/10" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="material-symbols-outlined text-lg mt-0.5 shrink-0"
                    style={{
                      color: !item.readAt ? "var(--color-primary, #002045)" : "var(--color-outline, #74777f)",
                    }}
                  >
                    {typeIcon(item.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">
                      {item.title}
                    </p>
                    {item.body && (
                      <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">
                        {item.body}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-outline">
                        {timeAgo(item.createdAt)}
                      </span>
                      {!item.readAt && (
                        <button
                          onClick={() => handleMarkRead(item.id)}
                          className="text-xs text-primary hover:underline"
                        >
                          Mark read
                        </button>
                      )}
                      {item.linkUrl && (
                        <Link
                          href={item.linkUrl}
                          onClick={onClose}
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-outline-variant px-4 py-2">
        <Link
          href="/dashboard/notifications"
          onClick={onClose}
          className="block text-center text-xs font-medium text-primary hover:underline py-1"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
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
