import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { matchesSlug } from '@/lib/slug'

interface PageProps {
  params: Promise<{ slug: string }>
}

const getCompanyPosts = async (slug: string) => {
  const posts = await prisma.feedback.findMany({
    where: { status: 'approved' },
    orderBy: { date: 'desc' },
    include: {
      user: { select: { username: true } },
      _count: { select: { comments: true } }
    }
  })

  return posts.filter(post => matchesSlug(post.subject, slug))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const posts = await getCompanyPosts(slug)
  const subject = posts[0]?.subject

  if (!subject) return { title: 'Company not found | Feedback TN' }

  return {
    title: `${subject} experiences | Feedback TN`,
    description: `Reviews, questions, warnings, and recommendations about ${subject} in Tunisia.`
  }
}

export default async function CompanyPage({ params }: PageProps) {
  const { slug } = await params
  const posts = await getCompanyPosts(slug)

  if (posts.length === 0) notFound()

  const subject = posts[0].subject
  const totalLikes = posts.reduce((sum, post) => sum + post.likes, 0)
  const totalReplies = posts.reduce((sum, post) => sum + post._count.comments, 0)

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <Link href="/feedback?public=1" className="text-sm font-semibold text-blue-700 hover:text-blue-800">Back to public feed</Link>
          <Link href="/" className="text-sm font-semibold text-slate-700 hover:text-slate-950">Feedback TN</Link>
        </header>

        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Company / Service</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{subject}</h1>
          <p className="mt-3 max-w-2xl text-slate-600">All approved experiences, questions, warnings, and recommendations shared about {subject}.</p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
            <span className="rounded-md bg-slate-100 px-3 py-1.5">{posts.length} posts</span>
            <span className="rounded-md bg-slate-100 px-3 py-1.5">{totalLikes} likes</span>
            <span className="rounded-md bg-slate-100 px-3 py-1.5">{totalReplies} replies</span>
          </div>
        </section>

        <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {posts.map(post => (
            <li key={post.id} className="p-5 hover:bg-slate-50">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">{post.category}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{post.experienceType}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{post.city}</span>
              </div>
              <Link href={`/post/${post.id}`} className="mt-3 block text-lg font-semibold text-slate-950 hover:text-blue-700">{post.title}</Link>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{post.message}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                <span>By {post.isAnonymous ? 'Anonymous' : post.user.username}</span>
                <span>{new Date(post.date).toLocaleDateString()}</span>
                <span>{post.likes} likes</span>
                <span>{post._count.comments} replies</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
