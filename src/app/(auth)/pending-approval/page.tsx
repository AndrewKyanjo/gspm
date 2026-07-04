export default function PendingApprovalPage() {
  return (
    <div className="w-full max-w-md rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
      <span className="material-symbols-outlined text-4xl text-primary">schedule</span>
      <h1 className="mt-4 text-2xl font-semibold text-on-surface">Pending approval</h1>
      <p className="mt-3 text-sm text-on-surface-variant">
        Your email is verified, and your registration request is waiting for Archdiocese review. You
        will be able to enter the dashboard after an administrator approves your assignment.
      </p>
      <a href="/login" className="mt-6 inline-flex text-sm font-medium text-primary hover:underline">
        Return to sign in
      </a>
    </div>
  );
}
