import Link from 'next/link'

const rules = [
  {
    title: 'Share your own real experience',
    body: 'Write about something you personally saw, bought, used, applied for, or discussed with a company or service. If you heard it from someone else, say that clearly.'
  },
  {
    title: 'Do not post private information',
    body: 'Remove phone numbers, home addresses, national ID details, bank details, private emails, order tokens, faces, and any personal data that is not needed to explain the issue.'
  },
  {
    title: 'Avoid fake accusations',
    body: 'Do not invent stories, exaggerate facts, or accuse people or businesses of crimes without clear context. Explain what happened and let readers judge the situation.'
  },
  {
    title: 'Keep proof safe and relevant',
    body: 'Screenshots and photos should support the post, not expose someone else. Blur or crop sensitive details before uploading.'
  },
  {
    title: 'Stay respectful',
    body: 'Criticize the experience, service, or business behavior. Do not harass, insult, threaten, or target private individuals.'
  },
  {
    title: 'Moderation decisions',
    body: 'Admins can approve, hide, delete, or request changes when content is unsafe, unverifiable, private, spammy, or outside the purpose of Feedback TN.'
  }
]

export default function RulesPage() {
  return (
    <main className="app-shell px-4 py-8 text-stone-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between border-b border-stone-200/80 pb-4">
          <Link href="/" className="text-sm font-semibold text-stone-700 hover:text-stone-950">Feedback TN</Link>
          <Link href="/feedback?public=1" className="text-sm font-semibold text-teal-700 hover:text-teal-800">Browse posts</Link>
        </header>

        <section className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Trust and safety</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-stone-950">Community rules</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">Feedback TN is for useful Tunisian experiences, questions, warnings, and recommendations. These rules help keep posts helpful, fair, and safe for the people reading and the people being discussed.</p>
        </section>

        <div className="space-y-3">
          {rules.map((rule, index) => (
            <section key={rule.title} className="rounded-lg border border-stone-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(37,31,24,0.06)]">
              <div className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-teal-100 text-sm font-bold text-teal-800">{index + 1}</span>
                <div>
                  <h2 className="text-lg font-semibold text-stone-950">{rule.title}</h2>
                  <p className="mt-2 leading-7 text-stone-600">{rule.body}</p>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
