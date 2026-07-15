"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markAllNotificationsAsRead } from "@/features/notifications/actions";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";

export function MarkAllReadButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    await markAllNotificationsAsRead();
    router.refresh();
    setLoading(false);
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="gap-1"
    >
      <CheckCheck className="h-4 w-4" />
      <span className="hidden sm:inline">Mark all read</span>
    </Button>
  );
}
