export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-on-surface">Password reset</h1>
      <p className="mt-3 text-sm text-on-surface-variant">
        Password recovery has not been wired into the portal yet. For now, ask an administrator to
        trigger a reset from Supabase or contact support.
      </p>
      <a href="/login" className="mt-6 inline-flex text-sm font-medium text-primary hover:underline">
        Back to sign in
      </a>
    </div>
  );
}
