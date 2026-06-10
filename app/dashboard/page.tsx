'use client'

import { useEffect, useMemo, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { TUNISIA_CATEGORIES } from '@/lib/tunisia-context'

type PostStatus = 'pending' | 'approved' | 'rejected'
type ReportStatus = 'open' | 'reviewed' | 'dismissed'
type Section = 'posts' | 'comments' | 'users'
type PostView = 'pending' | 'approved' | 'reported' | 'hidden' | 'all'

interface Post {
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
  reportsCount: number
  date: string
  user: string
  authorUsername: string
  status: PostStatus
  moderationReason: string
  adminNote: string
}

interface ReportPostSummary {
  id: number
  title: string
  subject: string
  category: string
  status: PostStatus
  reportsCount?: number
  authorUsername?: string
  isAnonymous?: boolean
}

interface Report {
  id: number
  reason: string
  details: string
  targetType: 'feedback' | 'comment'
  status: ReportStatus
  date: string
  reporter: string
  feedback: null | ReportPostSummary
  comment: null | {
    id: number
    message: string
    feedbackId: number
    isHidden: boolean
    hiddenReason: string
    reportsCount: number
    authorUsername: string
    feedback?: ReportPostSummary
  }
}

interface AdminUser {
  id: number
  username: string
  email: string
  createdAt: string
  isAdmin: boolean
  isSuspended: boolean
  postsCount: number
  commentsCount: number
  reportsCount: number
}

const statusClass = (status: PostStatus | ReportStatus) => {
  if (status === 'approved' || status === 'reviewed') return 'bg-green-100 text-green-800'
  if (status === 'pending' || status === 'open') return 'bg-yellow-100 text-yellow-800'
  if (status === 'rejected') return 'bg-red-100 text-red-800'
  return 'bg-stone-100 text-stone-700'
}

export default function DashboardPage() {
  const ITEMS_PER_PAGE = 10
  const [section, setSection] = useState<Section>('posts')
  const [postView, setPostView] = useState<PostView>('pending')
  const [posts, setPosts] = useState<Post[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | ReportStatus>('open')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'latest' | 'most-reported' | 'most-discussed' | 'most-liked'>('latest')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const fetchPosts = async () => {
    const response = await fetch('/api/feedback/admin', { credentials: 'include' })
    if (!response.ok) throw new Error('Failed to fetch posts')
    setPosts(await response.json())
  }

  const fetchReports = async () => {
    const response = await fetch('/api/reports', { credentials: 'include' })
    if (!response.ok) throw new Error('Failed to fetch reports')
    setReports(await response.json())
  }

  const fetchUsers = async () => {
    const response = await fetch('/api/users', { credentials: 'include' })
    if (!response.ok) throw new Error('Failed to fetch users')
    setUsers(await response.json())
  }

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        await Promise.all([fetchPosts(), fetchReports(), fetchUsers()])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [section, postView, reportStatusFilter, categoryFilter, sortBy, searchQuery])

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'include' })
    } finally {
      window.location.href = '/login'
    }
  }

  const deletePost = async (id: number) => {
    if (!window.confirm('Delete this post permanently?')) return

    try {
      const response = await fetch(`/api/feedback/${id}/delete`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete post')
      }

      toast.success('Post deleted')
      setPosts(prev => prev.filter(item => item.id !== id))
      setReports(prev => prev.filter(report => report.feedback?.id !== id && report.comment?.feedbackId !== id))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete post')
    }
  }

  const deleteComment = async (id: number) => {
    if (!window.confirm('Delete this comment permanently?')) return

    try {
      const response = await fetch(`/api/comments/${id}/delete`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete comment')
      }

      toast.success('Comment deleted')
      setReports(prev => prev.filter(report => report.comment?.id !== id))
      setPosts(prev => prev.map(post => ({ ...post, commentsCount: Math.max(0, post.commentsCount - 1) })))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete comment')
    }
  }

  const updatePostStatus = async (id: number, status: PostStatus) => {
    const moderationReason = status === 'rejected' ? window.prompt('Why hide/reject this post?', 'Needs moderation review')?.trim() || '' : ''
    if (status === 'rejected' && !moderationReason) return
    const adminNote = status === 'rejected' ? window.prompt('Optional admin note for internal context:', '')?.trim() || '' : ''

    try {
      const response = await fetch(`/api/feedback/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, moderationReason, adminNote })
      })

      if (!response.ok) throw new Error('Failed to update post status')

      setPosts(prev => prev.map(item => (item.id === id ? { ...item, status, moderationReason, adminNote } : item)))
      setReports(prev => prev.map(report => {
        if (report.feedback?.id === id) return { ...report, feedback: { ...report.feedback, status } }
        if (report.comment?.feedback?.id === id) return { ...report, comment: { ...report.comment, feedback: { ...report.comment.feedback, status } } }
        return report
      }))
      toast.success(status === 'rejected' ? 'Post hidden' : 'Post status updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update post status')
    }
  }

  const updateReportStatus = async (id: number, status: ReportStatus) => {
    try {
      const response = await fetch(`/api/reports/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status })
      })

      if (!response.ok) throw new Error('Failed to update report')

      setReports(prev => prev.map(report => (report.id === id ? { ...report, status } : report)))
      toast.success('Report updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update report')
    }
  }

  const toggleUserSuspension = async (userId: number, isSuspended: boolean) => {
    if (!window.confirm(isSuspended ? 'Suspend this user?' : 'Unsuspend this user?')) return

    try {
      const response = await fetch(`/api/users/${userId}/suspend`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isSuspended })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update user')
      }

      setUsers(prev => prev.map(user => user.id === userId ? { ...user, isSuspended } : user))
      toast.success(isSuspended ? 'User suspended' : 'User unsuspended')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update user')
    }
  }

  const query = searchQuery.trim().toLowerCase()
  const reportedPostIds = useMemo(() => new Set(reports.filter(report => report.targetType === 'feedback').map(report => report.feedback?.id).filter(Boolean)), [reports])

  const visiblePosts = useMemo(() => {
    const matchesSearch = (post: Post) => {
      if (categoryFilter !== 'all' && post.category !== categoryFilter) return false
      if (!query) return true
      return [post.title, post.message, post.user, post.authorUsername, post.category, post.subject, post.city, post.experienceType]
        .some(value => value.toLowerCase().includes(query))
    }

    const filtered = posts
      .filter(post => {
        if (postView === 'pending') return post.status === 'pending'
        if (postView === 'approved') return post.status === 'approved'
        if (postView === 'reported') return reportedPostIds.has(post.id)
        if (postView === 'hidden') return post.status === 'rejected'
        return true
      })
      .filter(matchesSearch)

    return [...filtered].sort((a, b) => {
      if (sortBy === 'most-reported') return b.reportsCount - a.reportsCount
      if (sortBy === 'most-discussed') return b.commentsCount - a.commentsCount
      if (sortBy === 'most-liked') return b.likes - a.likes
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
  }, [categoryFilter, postView, posts, query, reportedPostIds, sortBy])

  const visibleCommentReports = useMemo(() => reports
    .filter(report => report.targetType === 'comment')
    .filter(report => reportStatusFilter === 'all' || report.status === reportStatusFilter)
    .filter(report => {
      const post = report.comment?.feedback
      if (categoryFilter !== 'all' && post?.category !== categoryFilter) return false
      if (!query) return true
      return [report.reason, report.details, report.reporter, report.comment?.message || '', report.comment?.authorUsername || '', post?.title || '', post?.subject || '']
        .some(value => value.toLowerCase().includes(query))
    }), [categoryFilter, query, reportStatusFilter, reports])

  const visibleUsers = useMemo(() => users.filter(user => {
    if (!query) return true
    return [user.username, user.email, user.isSuspended ? 'suspended' : 'active', user.isAdmin ? 'admin' : 'user']
      .some(value => value.toLowerCase().includes(query))
  }), [query, users])

  const activeItems = section === 'posts' ? visiblePosts : section === 'comments' ? visibleCommentReports : visibleUsers
  const totalPages = Math.ceil(activeItems.length / ITEMS_PER_PAGE)
  const paginatedItems = activeItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const pendingCount = posts.filter(post => post.status === 'pending').length
  const approvedCount = posts.filter(post => post.status === 'approved').length
  const reportedPostCount = reports.filter(report => report.targetType === 'feedback' && report.status === 'open').length
  const reportedCommentCount = reports.filter(report => report.targetType === 'comment' && report.status === 'open').length
  const suspendedCount = users.filter(user => user.isSuspended).length

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-transparent"><div className="text-xl font-medium text-stone-700">Loading...</div></div>
  }

  if (error) {
    return <div className="flex min-h-screen items-center justify-center bg-transparent"><div className="text-xl font-medium text-red-600">Error: {error}</div></div>
  }

  const renderPostRow = (post: Post) => (
    <tr key={`post-${post.id}`} className="hover:bg-white/55">
      <td className="whitespace-nowrap px-5 py-4"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(post.status)}`}>{post.status}</span></td>
      <td className="px-5 py-4">
        <div className="text-sm font-semibold text-stone-950">{post.title}</div>
        <div className="mt-1 max-w-sm text-sm text-stone-500 line-clamp-2">{post.message}</div>
        {post.proofImageUrl && <a href={post.proofImageUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-teal-700 hover:text-teal-800">View proof image</a>}
        <div className="mt-2 text-xs font-medium text-stone-500">{post.experienceType} / {post.city}</div>
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-sm text-stone-600">{post.subject}</td>
      <td className="whitespace-nowrap px-5 py-4 text-sm text-stone-600">{post.category}</td>
      <td className="whitespace-nowrap px-5 py-4 text-sm text-stone-600">
        <div>{post.user}{post.isAnonymous ? ' (public anonymous)' : ''}</div>
        {post.isAnonymous && <div className="text-xs text-stone-500">Admin: {post.authorUsername}</div>}
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-sm text-stone-600">
        <div>{post.likes} likes / {post.commentsCount} replies / {post.reportsCount} reports</div>
        {post.moderationReason && <div className="mt-1 max-w-xs text-xs text-red-700">Reason: {post.moderationReason}</div>}
        {post.adminNote && <div className="mt-1 max-w-xs text-xs text-stone-500">Note: {post.adminNote}</div>}
      </td>
      <td className="px-5 py-4 text-sm font-medium">
        <div className="flex flex-wrap gap-2">
          {post.status !== 'approved' && <button onClick={() => updatePostStatus(post.id, 'approved')} className="rounded-md bg-green-100 px-3 py-1.5 text-green-800 hover:bg-green-200">Approve</button>}
          {post.status !== 'rejected' && <button onClick={() => updatePostStatus(post.id, 'rejected')} className="rounded-md bg-yellow-100 px-3 py-1.5 text-yellow-900 hover:bg-yellow-200">Hide</button>}
          {post.status !== 'pending' && <button onClick={() => updatePostStatus(post.id, 'pending')} className="rounded-md bg-stone-100 px-3 py-1.5 text-stone-800 hover:bg-stone-200">Move pending</button>}
          <button onClick={() => deletePost(post.id)} className="rounded-md bg-red-100 px-3 py-1.5 text-red-800 hover:bg-red-200">Delete</button>
        </div>
      </td>
    </tr>
  )

  const renderCommentReport = (report: Report) => {
    const comment = report.comment
    const post = comment?.feedback
    if (!comment) return null

    return (
      <li key={`comment-report-${report.id}`} className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(report.status)}`}>{report.status}</span>
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">reported comment</span>
              {post && <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-800">{post.category}</span>}
            </div>
            <h3 className="mt-3 text-base font-semibold text-stone-950">{report.reason}</h3>
            {report.details && <p className="mt-1 text-sm text-stone-600">{report.details}</p>}
            <p className="mt-2 text-sm text-stone-500">Reported by {report.reporter} on {new Date(report.date).toLocaleDateString()}</p>
            <p className="mt-2 text-sm text-stone-700">Comment by {comment.authorUsername}: {comment.message}</p>
            {post && <p className="mt-2 text-sm text-stone-600">On post: {post.title} / {post.subject} / {post.status}</p>}
          </div>
          <div className="flex flex-wrap gap-2 text-sm font-medium">
            {report.status !== 'reviewed' && <button onClick={() => updateReportStatus(report.id, 'reviewed')} className="rounded-md bg-green-100 px-3 py-1.5 text-green-800 hover:bg-green-200">Mark reviewed</button>}
            {report.status !== 'dismissed' && <button onClick={() => updateReportStatus(report.id, 'dismissed')} className="rounded-md bg-stone-100 px-3 py-1.5 text-stone-800 hover:bg-stone-200">Dismiss</button>}
            <button onClick={() => deleteComment(comment.id)} className="rounded-md bg-red-100 px-3 py-1.5 text-red-800 hover:bg-red-200">Delete comment</button>
          </div>
        </div>
      </li>
    )
  }

  const renderUserRow = (user: AdminUser) => (
    <tr key={`user-${user.id}`} className="hover:bg-white/55">
      <td className="px-5 py-4">
        <div className="text-sm font-semibold text-stone-950">{user.username}</div>
        <div className="text-sm text-stone-500">{user.email}</div>
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-sm text-stone-600">{new Date(user.createdAt).toLocaleDateString()}</td>
      <td className="whitespace-nowrap px-5 py-4 text-sm text-stone-600">{user.postsCount} posts / {user.commentsCount} comments / {user.reportsCount} reports</td>
      <td className="whitespace-nowrap px-5 py-4">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${user.isSuspended ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{user.isSuspended ? 'suspended' : 'active'}</span>
        {user.isAdmin && <span className="ml-2 inline-flex rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-800">admin</span>}
      </td>
      <td className="px-5 py-4 text-sm font-medium">
        {!user.isAdmin && <button onClick={() => toggleUserSuspension(user.id, !user.isSuspended)} className={user.isSuspended ? 'rounded-md bg-green-100 px-3 py-1.5 text-green-800 hover:bg-green-200' : 'rounded-md bg-orange-100 px-3 py-1.5 text-orange-900 hover:bg-orange-200'}>{user.isSuspended ? 'Unsuspend' : 'Suspend'}</button>}
      </td>
    </tr>
  )

  return (
    <div className="app-shell px-4 py-6 text-stone-950 sm:px-6 lg:px-8">
      <Toaster position="top-right" />
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 rounded-lg border border-stone-200/80 bg-white p-6 shadow-[0_8px_24px_rgba(37,31,24,0.06)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-stone-950">Admin Dashboard</h1>
            <p className="mt-1 text-stone-600">Posts, reported comments, and users are managed separately.</p>
          </div>
          <button onClick={handleLogout} className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-[0_8px_24px_rgba(37,31,24,0.06)] hover:bg-stone-100">Logout</button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="rounded-lg border border-stone-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(37,31,24,0.06)]"><h3 className="text-sm font-medium text-stone-500">Pending Posts</h3><p className="text-2xl font-semibold text-yellow-600">{pendingCount}</p></div>
          <div className="rounded-lg border border-stone-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(37,31,24,0.06)]"><h3 className="text-sm font-medium text-stone-500">Approved Posts</h3><p className="text-2xl font-semibold text-green-600">{approvedCount}</p></div>
          <div className="rounded-lg border border-stone-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(37,31,24,0.06)]"><h3 className="text-sm font-medium text-stone-500">Reported Posts</h3><p className="text-2xl font-semibold text-red-600">{reportedPostCount}</p></div>
          <div className="rounded-lg border border-stone-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(37,31,24,0.06)]"><h3 className="text-sm font-medium text-stone-500">Reported Comments</h3><p className="text-2xl font-semibold text-red-600">{reportedCommentCount}</p></div>
          <div className="rounded-lg border border-stone-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(37,31,24,0.06)]"><h3 className="text-sm font-medium text-stone-500">Suspended Users</h3><p className="text-2xl font-semibold text-stone-950">{suspendedCount}</p></div>
        </div>

        <div className="mb-6 rounded-lg border border-stone-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(37,31,24,0.06)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {(['posts', 'comments', 'users'] as Section[]).map(item => (
                <button key={item} onClick={() => setSection(item)} className={`rounded-md px-4 py-2 text-sm font-semibold capitalize ${section === item ? 'bg-teal-700 text-white' : 'bg-stone-100 text-stone-800 hover:bg-stone-200'}`}>{item}</button>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              {section !== 'users' && (
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-800 shadow-[0_8px_24px_rgba(37,31,24,0.06)] outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
                  <option value="all">All categories</option>
                  {TUNISIA_CATEGORIES.map(category => <option key={category}>{category}</option>)}
                </select>
              )}
              {section === 'posts' && (
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-800 shadow-[0_8px_24px_rgba(37,31,24,0.06)] outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
                  <option value="latest">Latest</option>
                  <option value="most-reported">Most reported</option>
                  <option value="most-discussed">Most discussed</option>
                  <option value="most-liked">Most liked</option>
                </select>
              )}
              {section === 'comments' && (
                <select value={reportStatusFilter} onChange={(e) => setReportStatusFilter(e.target.value as typeof reportStatusFilter)} className="rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-800 shadow-[0_8px_24px_rgba(37,31,24,0.06)] outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
                  <option value="open">Open reports</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="dismissed">Dismissed</option>
                  <option value="all">All report statuses</option>
                </select>
              )}
              <input type="text" placeholder={section === 'users' ? 'Search users...' : 'Search title, user, city, category...'} className="rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-950 placeholder:text-stone-500 shadow-[0_8px_24px_rgba(37,31,24,0.06)] outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 md:col-span-2" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>

          {section === 'posts' && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-200/80 pt-4">
              {(['pending', 'approved', 'reported', 'hidden', 'all'] as PostView[]).map(item => (
                <button key={item} onClick={() => setPostView(item)} className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize ${postView === item ? 'bg-teal-100 text-teal-800' : 'bg-stone-100 text-stone-800 hover:bg-stone-200'}`}>{item === 'hidden' ? 'Hidden/deleted' : `${item} posts`}</button>
              ))}
            </div>
          )}
        </div>

        {section === 'posts' && (
          <div className="overflow-hidden rounded-lg border border-stone-200/80 bg-white shadow-[0_8px_24px_rgba(37,31,24,0.06)]">
            {paginatedItems.length === 0 ? <div className="p-6 text-center text-stone-500">No posts found.</div> : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-stone-200/80">
                  <thead className="bg-transparent"><tr>{['Status', 'Title', 'Subject', 'Category', 'User', 'Engagement', 'Actions'].map(header => <th key={header} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">{header}</th>)}</tr></thead>
                  <tbody className="divide-y divide-stone-200/80 bg-white">{(paginatedItems as Post[]).map(renderPostRow)}</tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {section === 'comments' && (
          <div className="overflow-hidden rounded-lg border border-stone-200/80 bg-white shadow-[0_8px_24px_rgba(37,31,24,0.06)]">
            {paginatedItems.length === 0 ? <div className="p-6 text-center text-stone-500">No reported comments found.</div> : <ul className="divide-y divide-stone-200/80">{(paginatedItems as Report[]).map(renderCommentReport)}</ul>}
          </div>
        )}

        {section === 'users' && (
          <div className="overflow-hidden rounded-lg border border-stone-200/80 bg-white shadow-[0_8px_24px_rgba(37,31,24,0.06)]">
            {paginatedItems.length === 0 ? <div className="p-6 text-center text-stone-500">No users found.</div> : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-stone-200/80">
                  <thead className="bg-transparent"><tr>{['User', 'Joined', 'Activity', 'Status', 'Actions'].map(header => <th key={header} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">{header}</th>)}</tr></thead>
                  <tbody className="divide-y divide-stone-200/80 bg-white">{(paginatedItems as AdminUser[]).map(renderUserRow)}</tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, index) => {
              const pageNumber = index + 1
              return <button key={pageNumber} onClick={() => setCurrentPage(pageNumber)} className={currentPage === pageNumber ? 'rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white' : 'rounded-md bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-800 hover:bg-stone-200'}>{pageNumber}</button>
            })}
          </div>
        )}
      </div>
    </div>
  )
}
