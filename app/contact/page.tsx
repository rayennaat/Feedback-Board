import Link from 'next/link'

export default function ContactPage() {
  return (
    <main className="app-shell px-4 py-8 text-stone-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between border-b border-stone-200/80 pb-4">
          <Link href="/" className="text-sm font-semibold text-stone-700 hover:text-stone-950">Feedback TN</Link>
          <Link href="/feedback?public=1" className="text-sm font-semibold text-teal-700 hover:text-teal-800">Browse posts</Link>
        </header>

        <section className="rounded-lg border border-stone-200/80 bg-white p-6 shadow-[0_8px_24px_rgba(37,31,24,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Contact</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-stone-950">Reach Feedback TN</h1>
          <p className="mt-4 text-base leading-7 text-stone-600">For moderation issues, safety concerns, partnership questions, or product feedback, contact the Feedback TN team.</p>

          <div className="mt-6 space-y-3 rounded-md border border-stone-200/80 bg-white/45 p-4">
            <div>
              <p className="text-sm font-medium text-stone-500">Email</p>
              <a href="mailto:contact@feedback.tn" className="mt-1 inline-block font-semibold text-teal-700 hover:text-teal-800">contact@feedback.tn</a>
            </div>
            <div>
              <p className="text-sm font-medium text-stone-500">Moderation reports</p>
              <p className="mt-1 text-sm leading-6 text-stone-600">Use the Report button on a post or reply when possible. It keeps the report connected to the right content for admins.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
