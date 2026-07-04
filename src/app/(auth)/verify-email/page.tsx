type VerifyEmailPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const emailParam = resolvedSearchParams?.email;
  const email = typeof emailParam === "string" ? emailParam : undefined;

  return (
    <div className="w-full max-w-md rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
      <span className="material-symbols-outlined text-4xl text-primary">mark_email_read</span>
      <h1 className="mt-4 text-2xl font-semibold text-on-surface">Verify your email</h1>
      <p className="mt-3 text-sm text-on-surface-variant">
        {email
          ? `We sent a verification link to ${email}. Open that email, confirm your account, then sign in to wait for admin approval.`
          : "We sent a verification link to your email address. Confirm your account, then sign in to wait for admin approval."}
      </p>
      <a href="/login" className="mt-6 inline-flex text-sm font-medium text-primary hover:underline">
        Back to sign in
      </a>
    </div>
  );
}
