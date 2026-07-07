// src/app/(public)/page.tsx — Public landing page
import Link from "next/link";

export default function PublicHomePage() {
  return (
    <div className="w-full max-w-md">
      {/* Mobile branding — visible only on small screens */}
      <div className="flex flex-col items-center mb-8 lg:hidden">
        <span
          className="material-symbols-outlined text-primary text-5xl mb-2"
          style={{ fontVariationSettings: '"FILL" 1' }}
        >
          church
        </span>
        <h2 className="font-headline-md text-headline-md text-primary">
          GSPM Portal
        </h2>
      </div>

      {/* Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-on-surface mb-2">
            Good Samaritans & Prisons Ministry
          </h1>
          <p className="text-on-surface-variant leading-relaxed">
            Serving the Kampala Archdiocese through coordinated pastoral care,
            prison ministry outreach, and community support.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="space-y-4">
          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-primary py-4 text-sm font-medium text-on-primary shadow-sm transition-all hover:bg-primary-container hover:shadow-md active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg">login</span>
            <span>Sign In to Your Account</span>
          </Link>

          <Link
            href="/signup"
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-primary py-4 text-sm font-medium text-primary transition-all hover:bg-primary-container/20 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            <span>Request Portal Access</span>
          </Link>
        </div>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-outline-variant" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-surface-container-lowest px-3 text-on-surface-variant">
              or learn more
            </span>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid gap-3">
          <div className="flex items-start gap-3 rounded-lg border border-outline-variant bg-surface-container p-4">
            <span className="material-symbols-outlined text-primary mt-0.5 text-xl">
              volunteer_activism
            </span>
            <div>
              <h3 className="text-sm font-medium text-on-surface">
                Prison Ministry
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Coordinating pastoral visits, rehabilitation support, and
                reintegration programs across the Archdiocese.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-outline-variant bg-surface-container p-4">
            <span className="material-symbols-outlined text-primary mt-0.5 text-xl">
              groups
            </span>
            <div>
              <h3 className="text-sm font-medium text-on-surface">
                Community Outreach
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Connecting parishes, deaneries, and vicariates in shared
                mission through the Good Samaritans movement.
              </p>
            </div>
          </div>
        </div>

        {/* Contact link */}
        <p className="mt-6 text-center text-sm text-on-surface-variant">
          Need help?{" "}
          <Link
            href="/contact"
            className="text-primary font-medium hover:underline"
          >
            Contact us
          </Link>
        </p>
      </div>

      {/* Footer note */}
      <p className="mt-8 text-center text-xs text-outline">
        © {new Date().getFullYear()} Kampala Archdiocese GSPM. Authorized
        Personnel Only.
      </p>
    </div>
  );
}
