export default function ParishNotFound() {
  return (
    <div className="min-h-screen bg-surface px-6 py-10">
      <div className="mx-auto max-w-2xl rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
        <h2 className="text-xl font-semibold text-on-surface">Parish view not found</h2>
        <p className="mt-3 text-sm text-on-surface-variant">
          The parish resource you requested is not available in this workspace yet.
        </p>
      </div>
    </div>
  );
}
