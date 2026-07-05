export default function ParishLoading() {
  return (
    <div className="min-h-screen bg-surface px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-8 w-56 animate-pulse rounded bg-surface-container" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-lg bg-surface-container" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-lg bg-surface-container" />
      </div>
    </div>
  );
}
