// src/app/(public)/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";
import "../globals.css";
import AuthLeftPanel from "@/components/auth/AuthLeftPanel";

export const metadata: Metadata = {
  title: {
    default: "GSPM Portal — Good Samaritans & Prisons Ministry",
    template: "%s | GSPM Portal",
  },
  description:
    "Serving the Good Samaritans and Prisons Ministry across the Kampala Archdiocese.",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — branded, same as auth pages */}
      <AuthLeftPanel />

      {/* Right side — public content */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Top nav bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container-lowest">
          <Link
            href="/"
            className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity"
          >
            <span
              className="material-symbols-outlined text-2xl"
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              church
            </span>
            <span className="font-semibold text-sm tracking-tight hidden sm:inline">
              GSPM Portal
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/"
              className="px-3 py-2 text-sm text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container transition-colors"
            >
              Home
            </Link>
            <Link
              href="/contact"
              className="px-3 py-2 text-sm text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container transition-colors"
            >
              Contact
            </Link>
            <span className="mx-1 h-5 w-px bg-outline-variant hidden sm:block" />
            <Link
              href="/login"
              className="px-3 py-2 text-sm font-medium text-primary hover:bg-primary-container/20 rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-3 py-2 text-sm font-medium bg-primary text-on-primary rounded-lg hover:bg-primary-container hover:shadow-sm transition-all"
            >
              Request Access
            </Link>
          </nav>
        </header>

        {/* Page content */}
        <main className="flex-1 flex items-center justify-center p-4 lg:p-12">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-outline-variant bg-surface-container-lowest px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-outline">
            <p>
              © {new Date().getFullYear()} Kampala Archdiocese GSPM. All rights
              reserved.
            </p>
            <div className="flex gap-4">
              <Link href="/contact" className="hover:text-primary transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
