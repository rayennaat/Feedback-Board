'use client'

import Link from 'next/link'
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

  const handleAddComment = async () => {
    if (!requireAuth('Log in to reply.')) return

    const message = commentDraft.trim()
    if (!message) return

    const res = await fetch(`/api/feedback/${post.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message, isAnonymous: anonymousComment })
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
    toast.success('Reply added')
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('Delete this comment?')) return

    const res = await fetch(`/api/comments/${commentId}/delete`, {
      method: 'DELETE',
      credentials: 'include'
    })
    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error || 'Failed to delete comment')
      return
    }

    setComments(prev => prev.filter(comment => comment.id !== commentId))
    setPost(prev => ({ ...prev, commentsCount: Math.max(0, prev.commentsCount - 1) }))
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

  return (
    <article>
      <Toaster position="top-right" />
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">{post.category}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{post.experienceType}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{post.city}</span>
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{post.title}</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">About {post.subject}</p>
        <p className="mt-5 whitespace-pre-wrap text-base leading-7 text-slate-700">{post.message}</p>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>By {post.user}</span>
            <span>{new Date(post.date).toLocaleDateString()}</span>
            {post.isAnonymous && <span>Anonymous post</span>}
          </div>
          <div className="flex flex-wrap gap-3 font-medium">
            <button onClick={handleLike} className={post.isLiked ? 'text-blue-700' : 'text-slate-600 hover:text-blue-700'}>{post.isLiked ? 'Liked' : 'Like'} {post.likes}</button>
            <button onClick={handleSave} className={post.isSaved ? 'text-blue-700' : 'text-slate-600 hover:text-blue-700'}>{post.isSaved ? 'Saved' : 'Save'}</button>
            <button onClick={handleShare} className="text-slate-600 hover:text-slate-950">Share</button>
            <button onClick={() => openReport({ type: 'feedback', id: post.id })} className="text-slate-600 hover:text-slate-950">Report</button>
          </div>
        </div>

        {!currentUser && (
          <div className="mt-4 rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            You can read this post publicly. <Link href="/login" className="font-semibold underline">Log in</Link> to like, reply, or report.
          </div>
        )}
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">Replies ({post.commentsCount})</h2>
        <div className="mt-4 space-y-3">
          {comments.length === 0 ? (
            <p className="text-sm text-slate-500">No replies yet.</p>
          ) : comments.map(comment => (
            <div key={comment.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm leading-6 text-slate-700">{comment.message}</p>
                  <p className="mt-1 text-xs text-slate-500">By {comment.user} on {new Date(comment.date).toLocaleDateString()}{comment.isAnonymous ? ' · anonymous' : ''}</p>
                </div>
                <div className="flex gap-2 text-xs font-medium">
                  <button onClick={() => openReport({ type: 'comment', id: comment.id })} className="text-slate-500 hover:text-slate-950">Report</button>
                  {comment.isCurrentUser && <button onClick={() => handleDeleteComment(comment.id)} className="text-red-600 hover:text-red-800">Delete</button>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          <textarea value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} rows={4} placeholder="Reply with your experience or advice..." className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={anonymousComment} onChange={(e) => setAnonymousComment(e.target.checked)} />
              Reply anonymously
            </label>
            <button onClick={handleAddComment} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Add Reply</button>
          </div>
        </div>
      </section>

      {reportingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-950">Report content</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Reason</label>
                <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                  {REPORT_REASONS.map(reason => <option key={reason}>{reason}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Details</label>
                <textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} rows={4} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Add context for the moderator." />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setReportingTarget(null)} className="rounded-md bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200">Cancel</button>
              <button onClick={handleSubmitReport} className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Submit Report</button>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
