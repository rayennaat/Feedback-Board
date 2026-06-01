import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6">
        <header className="flex items-center justify-between border-b border-slate-200 pb-5">
          <Link href="/" className="text-lg font-semibold tracking-tight text-slate-950">
            Feedback Board
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white hover:text-slate-950">
              Log in
            </Link>
            <Link href="/signup" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
              Sign up
            </Link>
          </nav>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-blue-700">Collect. Review. Improve.</p>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Feedback Board for product ideas, requests, and approvals.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Let users submit feedback, vote on approved ideas, and track their own suggestions while admins moderate every submission from one dashboard.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="rounded-md bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                Create account
              </Link>
              <Link href="/login" className="rounded-md border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-400 hover:bg-slate-100">
                Open board
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Admin overview</p>
                <h2 className="text-xl font-semibold text-slate-950">Moderation queue</h2>
              </div>
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">Pending</span>
            </div>
            <div className="space-y-3">
              {[
                ['Add categories', 'Feature Request', 'Pending'],
                ['Improve mobile layout', 'Improvement', 'Approved'],
                ['Show submission status', 'UX', 'Pending'],
              ].map(([title, type, status]) => (
                <div key={title} className="rounded-md border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">{title}</h3>
                      <p className="mt-1 text-sm text-slate-500">{type}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
