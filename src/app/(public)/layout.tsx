// app/layout.tsx (or app/public/layout.tsx for nested routes)

import type { Metadata } from 'next';
import Link from 'next/link';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Public Page',
  description: 'A public page accessible to everyone.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-blue-600">MyApp</h1>
            <nav>
              <ul className="flex space-x-4 text-gray-700">
                <li><Link href="/" className="hover:text-blue-600">Home</Link></li>
                <li><Link href="/about" className="hover:text-blue-600">About</Link></li>
                <li><Link href="/contact" className="hover:text-blue-600">Contact</Link></li>
              </ul>
            </nav>
          </div>
        </header>

        {/* Main content - this is where your page.tsx renders */}
        <main className="min-h-screen">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-gray-100 border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
            <p>© {new Date().getFullYear()} MyApp. All rights reserved.</p>
            <p className="mt-1">
              <a href="/privacy" className="hover:underline">Privacy</a>
              {' · '}
              <a href="/terms" className="hover:underline">Terms</a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
