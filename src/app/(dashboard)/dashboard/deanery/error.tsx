"use client";

import { Button } from "@/components/ui/button";

export default function DeaneryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6">
      <div className="max-w-lg space-y-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
        <h2 className="text-2xl font-semibold text-on-surface">Deanery workspace error</h2>
        <p className="text-sm text-on-surface-variant">{error.message || "Something went wrong while loading the deanery module."}</p>
        <Button type="button" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
