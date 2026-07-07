// src/app/(public)/contact/page.tsx
import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="w-full max-w-md">
      {/* Mobile branding */}
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
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-on-surface mb-2">
            Contact Us
          </h1>
          <p className="text-on-surface-variant leading-relaxed">
            Reach out to the Good Samaritans & Prisons Ministry coordination
            team at the Kampala Archdiocese.
          </p>
        </div>

        <div className="space-y-6">
          {/* Email */}
          <div className="flex items-start gap-4">
            <span className="material-symbols-outlined text-primary text-2xl mt-0.5">
              mail
            </span>
            <div>
              <h3 className="text-sm font-medium text-on-surface">Email</h3>
              <a
                href="mailto:gspm@kampalaarchdiocese.org"
                className="text-sm text-primary hover:underline"
              >
                gspm@kampalaarchdiocese.org
              </a>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-start gap-4">
            <span className="material-symbols-outlined text-primary text-2xl mt-0.5">
              call
            </span>
            <div>
              <h3 className="text-sm font-medium text-on-surface">Phone</h3>
              <a
                href="tel:+256700000000"
                className="text-sm text-primary hover:underline"
              >
                +256 700 000000
              </a>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-4">
            <span className="material-symbols-outlined text-primary text-2xl mt-0.5">
              location_on
            </span>
            <div>
              <h3 className="text-sm font-medium text-on-surface">
                Office
              </h3>
              <p className="text-sm text-on-surface-variant">
                Kampala Archdiocese Chancery
                <br />
                Lubaga, Kampala, Uganda
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-outline-variant" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-surface-container-lowest px-3 text-on-surface-variant">
              portal access
            </span>
          </div>
        </div>

        {/* Portal access links */}
        <div className="space-y-3">
          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-medium text-on-primary shadow-sm transition-all hover:bg-primary-container hover:shadow-md active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg">login</span>
            <span>Sign In</span>
          </Link>

          <Link
            href="/signup"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary py-3 text-sm font-medium text-primary transition-all hover:bg-primary-container/20 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            <span>Request Access</span>
          </Link>
        </div>

        {/* Back home */}
        <p className="mt-6 text-center text-sm text-on-surface-variant">
          <Link href="/" className="text-primary font-medium hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>

      <p className="mt-8 text-center text-xs text-outline">
        © {new Date().getFullYear()} Kampala Archdiocese GSPM.
      </p>
    </div>
  );
}
