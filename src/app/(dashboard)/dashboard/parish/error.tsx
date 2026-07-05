"use client";

export default function ParishError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-surface px-6 py-10">
      <div className="mx-auto max-w-2xl rounded-lg border border-error bg-error-container p-6 text-on-error-container">
        <h2 className="text-xl font-semibold">We hit a problem loading the parish workspace.</h2>
        <p className="mt-3 text-sm">{error.message}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 rounded-md bg-error px-4 py-2 text-sm font-medium text-on-error"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
