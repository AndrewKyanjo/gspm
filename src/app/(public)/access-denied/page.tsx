export default function AccessDeniedPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-on-surface">Access denied</h1>
        <p className="mt-3 text-sm text-on-surface-variant">
          Your account is signed in, but it does not currently have an active approved assignment for
          this area of the portal.
        </p>
        <a href="/login" className="mt-6 inline-flex text-sm font-medium text-primary hover:underline">
          Back to sign in
        </a>
      </div>
    </div>
  );
}
