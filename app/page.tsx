import Link from 'next/link'
import { ArrowRight, BadgeCheck, Building2, MapPin, MessageSquareWarning, Search, ShieldCheck, Sparkles } from 'lucide-react'

const examples = [
  { title: 'Is this call center good for students?', category: 'Call Centers', city: 'Tunis', type: 'Question' },
  { title: 'Online order arrived broken', category: 'Online Shopping', city: 'Sfax', type: 'Bad Experience' },
  { title: 'Internet outage in Ariana', category: 'Telecom & Internet', city: 'Ariana', type: 'Warning' },
  { title: 'Fast delivery in Sousse', category: 'Delivery & Couriers', city: 'Sousse', type: 'Recommendation' }
]

const stats = [
  ['Cities', '24+'],
  ['Categories', '15'],
  ['Languages', '4'],
]

export default function HomePage() {
  return (
    <main className="app-shell">
      <div className="app-container flex min-h-screen flex-col py-5 sm:py-6">
        <header className="premium-nav sticky top-4 z-20 flex items-center justify-between px-4 py-3 sm:px-5">
          <Link href="/" className="flex items-center gap-3 text-base font-black tracking-tight text-stone-950">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-sm text-white shadow-lg shadow-teal-900/20">TN</span>
            Feedback TN
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link href="/about" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-white/70 hover:text-stone-950 sm:inline-flex">About</Link>
            <Link href="/rules" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-white/70 hover:text-stone-950 sm:inline-flex">Rules</Link>
            <Link href="/feedback?public=1" className="rounded-lg px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-white/70 hover:text-stone-950">Browse</Link>
            <Link href="/login" className="btn-secondary px-3 py-2 text-sm sm:px-4">Log in</Link>
            <Link href="/signup" className="btn-primary px-3 py-2 text-sm sm:px-4">Sign up</Link>
          </nav>
        </header>

        <section className="grid flex-1 items-center gap-8 py-12 lg:grid-cols-[1.04fr_0.96fr] lg:py-16">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-900/10 bg-white/60 px-3 py-1.5 text-sm font-bold text-teal-800 shadow-[0_8px_24px_rgba(37,31,24,0.06)]">
              <Sparkles className="h-4 w-4" /> Tunisia shares. Tunisia learns.
            </div>
            <h1 className="text-balance max-w-4xl text-5xl font-black leading-[0.98] tracking-tight text-stone-950 sm:text-6xl lg:text-7xl">
              Real Tunisian experiences, easier to trust and share.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600 sm:text-xl">
              Discover warnings, questions, recommendations, and service stories about companies, jobs, shops, banks, delivery, telecom, restaurants, and public services across Tunisia.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="btn-primary px-6 py-3 text-sm">
                Share an experience <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/feedback?public=1" className="btn-secondary px-6 py-3 text-sm">
                Browse public feed
              </Link>
            </div>
            <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
              {stats.map(([label, value]) => (
                <div key={label} className="premium-card px-4 py-3">
                  <p className="text-2xl font-black text-stone-950">{value}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-stone-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="premium-surface overflow-hidden p-4 sm:p-5">
            <div className="rounded-2xl bg-stone-950 p-5 text-white shadow-2xl shadow-stone-900/20">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-teal-200">Public discovery</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight">Find the signal fast</h2>
                </div>
                <Search className="h-6 w-6 text-teal-200" />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-white/10 p-3">
                  <Building2 className="h-5 w-5 text-teal-200" />
                  <p className="mt-2 text-sm font-bold">Company</p>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <MapPin className="h-5 w-5 text-teal-200" />
                  <p className="mt-2 text-sm font-bold">City</p>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <ShieldCheck className="h-5 w-5 text-teal-200" />
                  <p className="mt-2 text-sm font-bold">Moderated</p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {examples.map((item) => (
                <Link key={item.title} href="/feedback?public=1" className="premium-card block p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="pill pill-accent px-2.5 py-1 text-xs">{item.category}</span>
                        <span className="pill px-2.5 py-1 text-xs">{item.city}</span>
                      </div>
                      <h3 className="mt-3 font-black text-stone-950">{item.title}</h3>
                    </div>
                    <span className="pill px-2.5 py-1 text-xs">{item.type}</span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-teal-900/10 bg-teal-50/80 p-4">
                <BadgeCheck className="h-5 w-5 text-teal-700" />
                <p className="mt-2 text-sm font-bold text-teal-950">Accountable anonymity</p>
              </div>
              <div className="rounded-2xl border border-amber-900/10 bg-amber-50/80 p-4">
                <MessageSquareWarning className="h-5 w-5 text-amber-700" />
                <p className="mt-2 text-sm font-bold text-amber-950">Proof-aware moderation</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
