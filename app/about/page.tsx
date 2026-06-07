import Link from 'next/link'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between border-b border-slate-200 pb-4">
          <Link href="/" className="text-sm font-semibold text-slate-700 hover:text-slate-950">Feedback TN</Link>
          <Link href="/rules" className="text-sm font-semibold text-blue-700 hover:text-blue-800">Community rules</Link>
        </header>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">About Feedback TN</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">A public place for real Tunisian experiences.</h1>
          <div className="mt-5 space-y-4 text-base leading-7 text-slate-600">
            <p>Feedback TN helps people in Tunisia share practical experiences about companies, shops, services, jobs, delivery, call centers, restaurants, telecom, banks, public services, and online shopping.</p>
            <p>The goal is discovery and accountability: visitors can read approved posts publicly, search by topic or company, and learn from people who already dealt with a service before making their own decision.</p>
            <p>Posts are moderated before they become public. Anonymous posting is supported for public privacy, while admins still keep accountability to reduce abuse.</p>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-950">Public browsing</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Anyone can read approved posts and share useful links.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-950">Moderated posts</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Admins review reports, comments, proof images, and new posts.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-950">Community discussion</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Members can reply, save, like, report, and follow updates.</p>
          </div>
        </section>
      </div>
    </main>
  )
}
