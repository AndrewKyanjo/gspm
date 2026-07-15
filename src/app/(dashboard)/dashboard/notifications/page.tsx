// src/app/(dashboard)/dashboard/notifications/page.tsx
//
// Full notifications page — role-agnostic, shows all notifications for the
// current user with mark-read and mark-all-read actions.

import Link from "next/link";
import { ArrowLeft, BellOff } from "lucide-react";
import { requireApprovedUser } from "@/lib/auth/requireApprovedUser";
import { getMyNotifications } from "@/features/notifications/queries";
import { NotificationBell } from "@/components/dashboard/shared/notifications/NotificationBell";
import { MarkAllReadButton } from "./mark-all-read-button";
import { NotificationRow } from "./notification-row";

export default async function NotificationsPage() {
  const result = await requireApprovedUser();
  if (result.status !== "ok") return null;
  const ctx = result.context;

  const notifications = await getMyNotifications(ctx.userId, 50);
  const unreadCount = notifications.filter((n) => !n.readAt).length;

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
                Notifications
              </p>
              <h1 className="text-2xl font-semibold text-on-surface">
                Your notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-base font-normal text-on-surface-variant">
                    ({unreadCount} unread)
                  </span>
                )}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && <MarkAllReadButton />}
            <NotificationBell />
            <Link
              href="/dashboard/feed"
              className="text-sm text-primary hover:underline"
            >
              Ministry Feed
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 md:px-8">
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <BellOff className="h-12 w-12 text-outline mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-on-surface mb-2">
              No notifications
            </h2>
            <p className="text-sm text-on-surface-variant">
              You&apos;ll see notifications here when there are announcements,
              replies, or reminders.
            </p>
          </div>
        ) : (
          <div className="space-y-1 rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden divide-y divide-outline-variant">
            {notifications.map((item) => (
              <NotificationRow key={item.id} item={item} />
            ))}
          </div>
        )}

        {notifications.length >= 50 && (
          <p className="mt-6 text-center text-xs text-on-surface-variant">
            Showing the 50 most recent notifications.
          </p>
        )}
      </main>
    </div>
  );
}
