"use client";

import { Button } from "@/components/ui/button";

export default function ArchdioceseError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-on-surface">Archdiocese workspace error</h2>
        <p className="mt-3 text-sm text-on-surface-variant">
          We hit a problem while loading the executive console.
        </p>
        <p className="mt-2 text-sm text-on-surface-variant">{error.message}</p>
        <div className="mt-6">
          <Button onClick={reset}>Try again</Button>
        </div>
      </div>
    </div>
  );
}
