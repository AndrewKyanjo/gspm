export default function ArchdioceseLoading() {
  return (
    <div className="space-y-6 px-6 py-8">
      <div className="space-y-3">
        <div className="h-4 w-40 animate-pulse rounded bg-surface-container" />
        <div className="h-10 w-72 animate-pulse rounded bg-surface-container" />
        <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-surface-container" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-lg border border-outline-variant bg-surface-container-lowest"
          />
        ))}
      </div>
    </div>
  );
}
