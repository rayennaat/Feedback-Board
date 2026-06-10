import Link from 'next/link'

export default function AboutPage() {
  return (
    <main className="app-shell px-4 py-8 text-stone-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between border-b border-stone-200/80 pb-4">
          <Link href="/" className="text-sm font-semibold text-stone-700 hover:text-stone-950">Feedback TN</Link>
          <Link href="/rules" className="text-sm font-semibold text-teal-700 hover:text-teal-800">Community rules</Link>
        </header>

        <section className="rounded-lg border border-stone-200/80 bg-white p-6 shadow-[0_8px_24px_rgba(37,31,24,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">About Feedback TN</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-stone-950">A public place for real Tunisian experiences.</h1>
          <div className="mt-5 space-y-4 text-base leading-7 text-stone-600">
            <p>Feedback TN helps people in Tunisia share practical experiences about companies, shops, services, jobs, delivery, call centers, restaurants, telecom, banks, public services, and online shopping.</p>
            <p>The goal is discovery and accountability: visitors can read approved posts publicly, search by topic or company, and learn from people who already dealt with a service before making their own decision.</p>
            <p>Posts are moderated before they become public. Anonymous posting is supported for public privacy, while admins still keep accountability to reduce abuse.</p>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-stone-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(37,31,24,0.06)]">
            <h2 className="font-semibold text-stone-950">Public browsing</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">Anyone can read approved posts and share useful links.</p>
          </div>
          <div className="rounded-lg border border-stone-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(37,31,24,0.06)]">
            <h2 className="font-semibold text-stone-950">Moderated posts</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">Admins review reports, comments, proof images, and new posts.</p>
          </div>
          <div className="rounded-lg border border-stone-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(37,31,24,0.06)]">
            <h2 className="font-semibold text-stone-950">Community discussion</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">Members can reply, save, like, report, and follow updates.</p>
          </div>
        </section>
      </div>
    </main>
  )
}
