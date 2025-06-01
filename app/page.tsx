// app/page.tsx
'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
      <h1 className="text-4xl font-bold mb-4 text-center text-gray-800">
        Welcome to Feedback Board
      </h1>
      <p className="text-lg text-gray-600 mb-6 text-center max-w-md">
        Share your feedback or view what others think. Help us improve!
      </p>
      <div className="flex gap-4">
        <Link
          href="/signup"
          className="px-6 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Get Started
        </Link>
        <Link
          href="/login"
          className="px-6 py-2 rounded-xl border border-blue-600 text-blue-600 hover:bg-blue-50 transition"
        >
          View Feedback
        </Link>
      </div>
    </main>
  )
}
