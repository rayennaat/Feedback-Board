import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slug'

interface PageProps {
  params: Promise<{ username: string }>
}

const getUserProfile = async (usernameParam: string) => {
  const users = await prisma.user.findMany({
    include: {
      feedbacks: {
        where: {
          status: 'approved',
          isAnonymous: false
        },
        orderBy: { date: 'desc' },
        include: { _count: { select: { comments: true } } }
      },
      comments: {
        where: {
          isAnonymous: false,
          feedback: { status: 'approved' }
        },
        orderBy: { date: 'desc' },
        include: {
          feedback: {
            select: {
              id: true,
              title: true,
              subject: true,
              category: true
            }
          }
        }
      }
    }
  })

  return users.find(user => slugify(user.username) === usernameParam)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params
  const user = await getUserProfile(username)

  if (!user) return { title: 'User not found | Feedback TN' }

  return {
    title: `${user.username} profile | Feedback TN`,
    description: `Public posts and replies from ${user.username} on Feedback TN.`
  }
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params
  const user = await getUserProfile(username)

  if (!user) notFound()

  const totalLikes = user.feedbacks.reduce((sum, post) => sum + post.likes, 0)
  const reputation = user.feedbacks.length * 5 + user.comments.length * 2 + totalLikes

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <Link href="/feedback?public=1" className="text-sm font-semibold text-blue-700 hover:text-blue-800">Back to public feed</Link>
          <Link href="/" className="text-sm font-semibold text-slate-700 hover:text-slate-950">Feedback TN</Link>
        </header>

        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-800">
              {user.username.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">{user.username}</h1>
              <p className="mt-1 text-sm text-slate-500">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-md bg-slate-100 px-3 py-2"><p className="text-xs font-medium text-slate-500">Public posts</p><p className="text-lg font-semibold text-slate-950">{user.feedbacks.length}</p></div>
            <div className="rounded-md bg-slate-100 px-3 py-2"><p className="text-xs font-medium text-slate-500">Public replies</p><p className="text-lg font-semibold text-slate-950">{user.comments.length}</p></div>
            <div className="rounded-md bg-slate-100 px-3 py-2"><p className="text-xs font-medium text-slate-500">Likes received</p><p className="text-lg font-semibold text-slate-950">{totalLikes}</p></div>
            <div className="rounded-md bg-slate-100 px-3 py-2"><p className="text-xs font-medium text-slate-500">Reputation</p><p className="text-lg font-semibold text-slate-950">{reputation}</p></div>
          </div>
        </section>

        <section className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Public posts</h2>
          </div>
          {user.feedbacks.length === 0 ? (
            <div className="p-5 text-sm text-slate-500">No public posts yet.</div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {user.feedbacks.map(post => (
                <li key={post.id} className="p-5 hover:bg-slate-50">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">{post.category}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{post.city}</span>
                  </div>
                  <Link href={`/post/${post.id}`} className="mt-3 block text-lg font-semibold text-slate-950 hover:text-blue-700">{post.title}</Link>
                  <p className="mt-1 text-sm font-medium text-slate-500">About {post.subject}</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{post.message}</p>
                  <p className="mt-3 text-sm text-slate-500">{post.likes} likes · {post._count.comments} replies</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Recent public replies</h2>
          </div>
          {user.comments.length === 0 ? (
            <div className="p-5 text-sm text-slate-500">No public replies yet.</div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {user.comments.slice(0, 20).map(comment => (
                <li key={comment.id} className="p-5 hover:bg-slate-50">
                  <p className="text-sm leading-6 text-slate-700">{comment.message}</p>
                  <p className="mt-2 text-sm text-slate-500">On <Link href={`/post/${comment.feedback.id}`} className="font-medium text-blue-700 hover:text-blue-800">{comment.feedback.title}</Link> · {comment.feedback.subject}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
