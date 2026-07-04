// app/page.tsx (or app/public/page.tsx if you want a nested route)

export default function PublicPage() {
  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      {/* Heading */}
      <h1 className="text-4xl font-bold text-center text-blue-600 mb-6">
        Public Page
      </h1>

      {/* Description */}
      <p className="text-lg text-gray-700 text-center mb-8">
        This is a public page accessible to everyone. No authentication required.
      </p>

      {/* Feature list */}
      <section className="bg-gray-50 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          What you can do here:
        </h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Browse public content</li>
          <li>View announcements</li>
          <li>Access documentation</li>
          <li>Contact support</li>
        </ul>
      </section>

      {/* Call to action */}
      <div className="flex justify-center gap-4">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          Get Started
        </button>
        <button className="px-6 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors">
          Learn More
        </button>
      </div>

      {/* Footer note */}
      <footer className="mt-12 text-center text-sm text-gray-500 border-t pt-4">
        © {new Date().getFullYear()} Public Page. All rights reserved.
      </footer>
    </main>
  );
}