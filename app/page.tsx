import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6">
        <header className="flex items-center justify-between border-b border-slate-200 pb-5">
          <Link href="/" className="text-lg font-semibold tracking-tight text-slate-950">
            Feedback TN
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
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-blue-700">Tunisia shares. Tunisia learns.</p>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Share real experiences about shops, jobs, services, and everyday problems in Tunisia.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Post a review, warning, question, or recommendation about something you bought, a company you dealt with, a call center you want to join, or any service you experienced. Write in Tounsi, Arabic, French, or English.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="rounded-md bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                Share an experience
              </Link>
              <Link href="/feedback?public=1" className="rounded-md border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-400 hover:bg-slate-100">
                Browse posts
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Community examples</p>
                <h2 className="text-xl font-semibold text-slate-950">Latest experience posts</h2>
              </div>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">Tunisia</span>
            </div>
            <div className="space-y-3">
              {[
                ['Is this call center good for students?', 'Call Centers', 'Question'],
                ['Online order arrived broken', 'Online Shopping', 'Bad Experience'],
                ['Internet outage in Ariana', 'Telecom & Internet', 'Warning'],
                ['Fast delivery in Sousse', 'Delivery & Couriers', 'Recommendation'],
              ].map(([title, category, type]) => (
                <div key={title} className="rounded-md border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">{title}</h3>
                      <p className="mt-1 text-sm text-slate-500">{category}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {type}
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
