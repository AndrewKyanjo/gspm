"use client";

/* eslint-disable react-hooks/set-state-in-effect */

// src/components/dashboard/shared/notifications/NotificationBell.tsx
//
// Bell icon with unread badge count.  Polls via server action every 60s.

import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUnreadCount } from "@/features/notifications/actions";
import { NotificationDropdown } from "./NotificationDropdown";

const POLL_INTERVAL = 60_000;

export function NotificationBell() {
  const [count, setCount] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const fetchCount = useCallback(async () => {
    try {
      const c = await getUnreadCount();
      setCount(c);
    } catch {
      // Silently fail — the bell just won't show a badge
    }
  }, []);

  useEffect(() => {
    fetchCount();
    const timer = setInterval(fetchCount, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchCount]);

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        className="gap-2 relative"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-4 w-4" />
        {count !== null && count > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-error text-on-error text-xs font-bold">
            {count > 99 ? "99+" : count}
          </span>
        )}
        <span className="hidden sm:inline">Notifications</span>
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96">
            <NotificationDropdown onClose={() => setOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}
