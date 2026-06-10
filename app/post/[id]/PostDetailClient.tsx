'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'

const REPORT_REASONS = [
  'False or misleading claim',
  'Harassment or insult',
  'Private information',
  'Spam',
  'Other'
]

interface UserState {
  id: number
  username: string
  email: string
  isAdmin: boolean
}

interface PostState {
  id: number
  title: string
  message: string
  category: string
  subject: string
  city: string
  experienceType: string
  isAnonymous: boolean
  proofImageUrl: string
  likes: number
  commentsCount: number
  date: string
  user: string
  status: 'pending' | 'approved' | 'rejected'
  isLiked: boolean
  isSaved?: boolean
}

interface CommentItem {
  id: number
  parentId: number | null
  message: string
  date: string
  user: string
  isAnonymous: boolean
  isCurrentUser?: boolean
}

export default function PostDetailClient({ initialPost }: { initialPost: PostState }) {
  const [post, setPost] = useState(initialPost)
  const [currentUser, setCurrentUser] = useState<UserState | null>(null)
  const [comments, setComments] = useState<CommentItem[]>([])
  const [commentDraft, setCommentDraft] = useState('')
  const [replyTarget, setReplyTarget] = useState<CommentItem | null>(null)
  const [anonymousComment, setAnonymousComment] = useState(false)
  const [reportingTarget, setReportingTarget] = useState<{ type: 'feedback' | 'comment'; id: number } | null>(null)
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0])
  const [reportDetails, setReportDetails] = useState('')

  const requireAuth = (message: string) => {
    if (currentUser) return true
    toast.error(message)
    return false
  }

  const refreshPostAndComments = useCallback(async () => {
    const [postRes, commentsRes] = await Promise.all([
      fetch(`/api/feedback/${initialPost.id}`, { credentials: 'include' }),
      fetch(`/api/feedback/${initialPost.id}/comments`, { credentials: 'include' })
    ])

    if (postRes.ok) {
      const postData = await postRes.json()
      setPost({ ...postData, isLiked: Boolean(postData.likedByCurrentUser), isSaved: Boolean(postData.savedByCurrentUser) })
    }

    if (commentsRes.ok) {
      const nextComments = await commentsRes.json()
      setComments(nextComments)
      setPost(prev => ({ ...prev, commentsCount: nextComments.length }))
    }
  }, [initialPost.id])

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') refreshPostAndComments()
    }, 5000)

    return () => window.clearInterval(interval)
  }, [refreshPostAndComments])

  useEffect(() => {
    const loadUserAndPost = async () => {
      const [meRes, postRes, commentsRes] = await Promise.all([
        fetch('/api/me', { credentials: 'include' }),
        fetch(`/api/feedback/${initialPost.id}`, { credentials: 'include' }),
        fetch(`/api/feedback/${initialPost.id}/comments`, { credentials: 'include' })
      ])

      const meData = await meRes.json()
      setCurrentUser(meData.user)

      if (postRes.ok) {
        const postData = await postRes.json()
        setPost({ ...postData, isLiked: Boolean(postData.likedByCurrentUser), isSaved: Boolean(postData.savedByCurrentUser) })
      }

      if (commentsRes.ok) {
        const nextComments = await commentsRes.json()
        setComments(nextComments)
        setPost(prev => ({ ...prev, commentsCount: nextComments.length }))
      }
    }

    loadUserAndPost()
  }, [initialPost.id])

  const handleSave = async () => {
    if (!requireAuth('Log in to save posts.')) return

    setPost(prev => ({ ...prev, isSaved: !prev.isSaved }))

    const res = await fetch(`/api/feedback/${post.id}/save`, {
      method: 'POST',
      credentials: 'include'
    })
    const data = await res.json()

    if (!res.ok) {
      setPost(prev => ({ ...prev, isSaved: !prev.isSaved }))
      toast.error(data.error || 'Failed to save post')
      return
    }

    setPost(prev => ({ ...prev, isSaved: Boolean(data.saved) }))
  }

  const handleLike = async () => {
    if (!requireAuth('Log in to like posts.')) return

    setPost(prev => ({ ...prev, likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1, isLiked: !prev.isLiked }))

    const res = await fetch(`/api/feedback/${post.id}/like`, {
      method: 'POST',
      credentials: 'include'
    })
    const data = await res.json()

    if (!res.ok) {
      setPost(prev => ({ ...prev, likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1, isLiked: !prev.isLiked }))
      toast.error(data.error || 'Failed to update like')
    }
  }

  const handleAddComment = async (parentId?: number) => {
    if (!requireAuth('Log in to reply.')) return

    const message = commentDraft.trim()
    if (!message) return

    const res = await fetch(`/api/feedback/${post.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message, isAnonymous: anonymousComment, parentId })
    })
    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error || 'Failed to add reply')
      return
    }

    setComments(prev => [...prev, data])
    setPost(prev => ({ ...prev, commentsCount: prev.commentsCount + 1 }))
    setCommentDraft('')
    setAnonymousComment(false)
    setReplyTarget(null)
    toast.success('Reply added')
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('Delete this comment?')) return

    const idsToRemove = new Set<number>()
    const collectBranch = (id: number) => {
      idsToRemove.add(id)
      comments.filter(comment => comment.parentId === id).forEach(comment => collectBranch(comment.id))
    }
    collectBranch(commentId)

    const res = await fetch(`/api/comments/${commentId}/delete`, {
      method: 'DELETE',
      credentials: 'include'
    })
    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error || 'Failed to delete comment')
      return
    }

    setComments(prev => prev.filter(comment => !idsToRemove.has(comment.id)))
    setPost(prev => ({ ...prev, commentsCount: Math.max(0, prev.commentsCount - idsToRemove.size) }))
    if (replyTarget && idsToRemove.has(replyTarget.id)) setReplyTarget(null)
    toast.success('Comment deleted')
  }

  const openReport = (target: { type: 'feedback' | 'comment'; id: number }) => {
    if (!requireAuth('Log in to report content.')) return
    setReportingTarget(target)
    setReportReason(REPORT_REASONS[0])
    setReportDetails('')
  }

  const handleSubmitReport = async () => {
    if (!reportingTarget) return

    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        targetType: reportingTarget.type,
        targetId: reportingTarget.id,
        reason: reportReason,
        details: reportDetails
      })
    })
    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error || 'Failed to submit report')
      return
    }

    setReportingTarget(null)
    toast.success('Report submitted for moderation')
  }

  const handleShare = async () => {
    const url = window.location.href

    if (navigator.share) {
      await navigator.share({ title: post.title, text: post.message, url })
      return
    }

    await navigator.clipboard.writeText(url)
    toast.success('Share link copied')
  }


  const topLevelComments = comments.filter(comment => comment.parentId === null)
  const repliesByParent = comments.reduce<Record<number, CommentItem[]>>((acc, comment) => {
    if (comment.parentId === null) return acc
    acc[comment.parentId] = [...(acc[comment.parentId] || []), comment]
    return acc
  }, {})

  const renderComment = (comment: CommentItem, depth = 0): ReactNode => {
    const childReplies = repliesByParent[comment.id] || []

    return (
      <div key={comment.id} className={depth > 0 ? 'ml-4 border-l border-stone-200/80 pl-4 sm:ml-6' : ''}>
        <div className="rounded-md border border-stone-200/80 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm leading-6 text-stone-700">{comment.message}</p>
              <p className="mt-1 text-xs text-stone-500">By {comment.user} on {new Date(comment.date).toLocaleDateString()}{comment.isAnonymous ? ' · anonymous' : ''}</p>
            </div>
            <div className="flex gap-2 text-xs font-medium">
              <button onClick={() => setReplyTarget(comment)} className="text-teal-700 hover:text-teal-800">Reply</button>
              <button onClick={() => openReport({ type: 'comment', id: comment.id })} className="text-stone-500 hover:text-stone-950">Report</button>
              {comment.isCurrentUser && <button onClick={() => handleDeleteComment(comment.id)} className="text-red-600 hover:text-red-800">Delete</button>}
            </div>
          </div>
        </div>
        {childReplies.length > 0 && <div className="mt-3 space-y-3">{childReplies.map(reply => renderComment(reply, depth + 1))}</div>}
      </div>
    )
  }

  return (
    <article>
      <Toaster position="top-right" />
      <div className="rounded-lg border border-stone-200/80 bg-white p-6 shadow-[0_8px_24px_rgba(37,31,24,0.06)]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-800">{post.category}</span>
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-700">{post.experienceType}</span>
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-700">{post.city}</span>
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-stone-950">{post.title}</h1>
        <p className="mt-2 text-sm font-medium text-stone-500">About {post.subject}</p>
        <p className="mt-5 whitespace-pre-wrap text-base leading-7 text-stone-700">{post.message}</p>
        {post.proofImageUrl && <Image src={post.proofImageUrl} alt="Proof attached to this post" width={1100} height={720} className="mt-5 max-h-[520px] w-full rounded-md border border-stone-200/80 bg-white object-contain" />}

        <div className="mt-6 flex flex-col gap-3 border-t border-stone-200/80 pt-4 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>By {post.user}</span>
            <span>{new Date(post.date).toLocaleDateString()}</span>
            {post.isAnonymous && <span>Anonymous post</span>}
          </div>
          <div className="flex flex-wrap gap-3 font-medium">
            <button onClick={handleLike} className={post.isLiked ? 'text-teal-700' : 'text-stone-600 hover:text-teal-700'}>{post.isLiked ? 'Liked' : 'Like'} {post.likes}</button>
            <button onClick={handleSave} className={post.isSaved ? 'text-teal-700' : 'text-stone-600 hover:text-teal-700'}>{post.isSaved ? 'Saved' : 'Save'}</button>
            <button onClick={handleShare} className="text-stone-600 hover:text-stone-950">Share</button>
            <button onClick={() => openReport({ type: 'feedback', id: post.id })} className="text-stone-600 hover:text-stone-950">Report</button>
          </div>
        </div>

        {!currentUser && (
          <div className="mt-4 rounded-md border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-900">
            You can read this post publicly. <Link href="/login" className="font-semibold underline">Log in</Link> to like, reply, or report.
          </div>
        )}
      </div>

      <section className="mt-6 rounded-lg border border-stone-200/80 bg-white p-6 shadow-[0_8px_24px_rgba(37,31,24,0.06)]">
        <h2 className="text-xl font-semibold text-stone-950">Replies ({post.commentsCount})</h2>
        <div className="mt-4 space-y-3">
          {comments.length === 0 ? (
            <p className="text-sm text-stone-500">No replies yet.</p>
          ) : topLevelComments.map(comment => renderComment(comment))}
        </div>

        <div className="mt-5 space-y-3">
          {replyTarget && (
            <div className="flex items-center justify-between rounded-md border border-teal-100 bg-teal-50 px-3 py-2 text-sm text-teal-900">
              <span>Replying to {replyTarget.user}</span>
              <button onClick={() => setReplyTarget(null)} className="font-semibold hover:text-teal-700">Cancel</button>
            </div>
          )}
          <textarea value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} rows={4} placeholder={replyTarget ? `Reply to ${replyTarget.user}...` : 'Reply with your experience or advice...'} className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-700 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-sm text-stone-600">
              <input type="checkbox" checked={anonymousComment} onChange={(e) => setAnonymousComment(e.target.checked)} />
              Reply anonymously
            </label>
            <button onClick={() => handleAddComment(replyTarget?.id)} className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">{replyTarget ? 'Reply' : 'Add Reply'}</button>
          </div>
        </div>
      </section>

      {reportingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-stone-950">Report content</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Reason</label>
                <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
                  {REPORT_REASONS.map(reason => <option key={reason}>{reason}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Details</label>
                <textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} rows={4} className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" placeholder="Add context for the moderator." />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setReportingTarget(null)} className="rounded-md bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-200">Cancel</button>
              <button onClick={handleSubmitReport} className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Submit Report</button>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
