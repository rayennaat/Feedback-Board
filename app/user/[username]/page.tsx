import type { Metadata } from 'next'
import Image from 'next/image'
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
    <main className="app-shell px-4 py-6 text-stone-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center justify-between border-b border-stone-200/80 pb-4">
          <Link href="/feedback?public=1" className="text-sm font-semibold text-teal-700 hover:text-teal-800">Back to public feed</Link>
          <Link href="/" className="text-sm font-semibold text-stone-700 hover:text-stone-950">Feedback TN</Link>
        </header>

        <section className="mb-6 rounded-lg border border-stone-200/80 bg-white p-6 shadow-[0_8px_24px_rgba(37,31,24,0.06)]">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-xl font-bold text-teal-800">
              {user.username.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-stone-950">{user.username}</h1>
              <p className="mt-1 text-sm text-stone-500">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-md bg-stone-100 px-3 py-2"><p className="text-xs font-medium text-stone-500">Public posts</p><p className="text-lg font-semibold text-stone-950">{user.feedbacks.length}</p></div>
            <div className="rounded-md bg-stone-100 px-3 py-2"><p className="text-xs font-medium text-stone-500">Public replies</p><p className="text-lg font-semibold text-stone-950">{user.comments.length}</p></div>
            <div className="rounded-md bg-stone-100 px-3 py-2"><p className="text-xs font-medium text-stone-500">Likes received</p><p className="text-lg font-semibold text-stone-950">{totalLikes}</p></div>
            <div className="rounded-md bg-stone-100 px-3 py-2"><p className="text-xs font-medium text-stone-500">Reputation</p><p className="text-lg font-semibold text-stone-950">{reputation}</p></div>
          </div>
        </section>

        <section className="mb-6 overflow-hidden rounded-lg border border-stone-200/80 bg-white shadow-[0_8px_24px_rgba(37,31,24,0.06)]">
          <div className="border-b border-stone-200/80 bg-white/45 px-5 py-4">
            <h2 className="text-lg font-semibold text-stone-950">Public posts</h2>
          </div>
          {user.feedbacks.length === 0 ? (
            <div className="p-5 text-sm text-stone-500">No public posts yet.</div>
          ) : (
            <ul className="divide-y divide-stone-200/80">
              {user.feedbacks.map(post => (
                <li key={post.id} className="p-5 hover:bg-white/55">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-800">{post.category}</span>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-700">{post.city}</span>
                  </div>
                  <Link href={`/post/${post.id}`} className="mt-3 block text-lg font-semibold text-stone-950 hover:text-teal-700">{post.title}</Link>
                  <p className="mt-1 text-sm font-medium text-stone-500">About {post.subject}</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">{post.message}</p>
                  {post.proofImageUrl && <Image src={post.proofImageUrl} alt="Proof attached to this post" width={760} height={430} className="mt-3 max-h-48 w-full rounded-md border border-stone-200/80 bg-white object-contain" />}
                  <p className="mt-3 text-sm text-stone-500">{post.likes} likes · {post._count.comments} replies</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="overflow-hidden rounded-lg border border-stone-200/80 bg-white shadow-[0_8px_24px_rgba(37,31,24,0.06)]">
          <div className="border-b border-stone-200/80 bg-white/45 px-5 py-4">
            <h2 className="text-lg font-semibold text-stone-950">Recent public replies</h2>
          </div>
          {user.comments.length === 0 ? (
            <div className="p-5 text-sm text-stone-500">No public replies yet.</div>
          ) : (
            <ul className="divide-y divide-stone-200/80">
              {user.comments.slice(0, 20).map(comment => (
                <li key={comment.id} className="p-5 hover:bg-white/55">
                  <p className="text-sm leading-6 text-stone-700">{comment.message}</p>
                  <p className="mt-2 text-sm text-stone-500">On <Link href={`/post/${comment.feedback.id}`} className="font-medium text-teal-700 hover:text-teal-800">{comment.feedback.title}</Link> · {comment.feedback.subject}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
