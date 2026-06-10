'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Bell, Bookmark, BookmarkCheck, UserCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { EXPERIENCE_TYPES, SUPPORTED_LANGUAGE_LABELS, TUNISIA_CATEGORIES, TUNISIA_CITIES } from '@/lib/tunisia-context'
import { slugify } from '@/lib/slug'

const REPORT_REASONS = [
  'False or misleading claim',
  'Harassment or insult',
  'Private information',
  'Spam',
  'Other'
]

interface ExperienceFormState {
  title: string
  message: string
  category: string
  subject: string
  city: string
  experienceType: string
  isAnonymous: boolean
  proofImageUrl: string
}

interface FeedbackItem extends ExperienceFormState {
  id: number
  date: string
  user: string
  likes: number
  commentsCount: number
  status: 'pending' | 'approved' | 'rejected'
  isLiked: boolean
  isSaved: boolean
  isCurrentUser?: boolean
}

interface ApiFeedbackItem {
  id: number
  title: string
  message: string
  category?: string
  subject?: string
  city?: string
  experienceType?: string
  isAnonymous?: boolean
  proofImageUrl?: string
  date: string
  user: string
  likes: number
  commentsCount?: number
  status?: 'pending' | 'approved' | 'rejected'
  isCurrentUser?: boolean
  likedByCurrentUser?: boolean
  savedByCurrentUser?: boolean
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

interface CurrentUser {
  id: number
  username: string
  email: string
  isAdmin: boolean
  isSuspended?: boolean
}

interface NotificationItem {
  id: number
  message: string
  link: string
  isRead: boolean
  date: string
}

const emptyPost: ExperienceFormState = {
  title: '',
  message: '',
  category: 'General Question',
  subject: '',
  city: 'Tunis',
  experienceType: 'Question',
  isAnonymous: false,
  proofImageUrl: ''
}

export default function FeedbackPage() {
  const POSTS_PER_PAGE = 10
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'all' | 'mine' | 'saved'>('all')
  const [sortBy, setSortBy] = useState<'latest' | 'most-liked' | 'most-discussed'>('latest')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
  const [subjectQuery, setSubjectQuery] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [publicMode] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('public') === '1')
  const [newFeedback, setNewFeedback] = useState<ExperienceFormState>(emptyPost)
  const [editingFeedbackId, setEditingFeedbackId] = useState<number | null>(null)
  const [editFeedback, setEditFeedback] = useState<ExperienceFormState>(emptyPost)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [openCommentsPostId, setOpenCommentsPostId] = useState<number | null>(null)
  const [commentsByPost, setCommentsByPost] = useState<Record<number, CommentItem[]>>({})
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({})
  const [anonymousCommentDrafts, setAnonymousCommentDrafts] = useState<Record<number, boolean>>({})
  const [replyTargetsByPost, setReplyTargetsByPost] = useState<Record<number, CommentItem | null>>({})
  const [reportingTarget, setReportingTarget] = useState<{ type: 'feedback' | 'comment'; id: number } | null>(null)
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0])
  const [reportDetails, setReportDetails] = useState('')
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [proofUploadTarget, setProofUploadTarget] = useState<'new' | 'edit' | null>(null)

  const activeUser = publicMode ? null : currentUser

  const formatFeedback = useCallback((items: ApiFeedbackItem[]): FeedbackItem[] =>
    items.map(item => ({
      ...item,
      category: item.category || 'General Question',
      subject: item.subject || 'General',
      city: item.city || 'Tunisia',
      experienceType: item.experienceType || 'Question',
      isAnonymous: Boolean(item.isAnonymous),
      proofImageUrl: item.proofImageUrl || '',
      commentsCount: item.commentsCount || 0,
      status: item.status || 'approved',
      isLiked: Boolean(item.likedByCurrentUser),
      isSaved: Boolean(item.savedByCurrentUser)
    })), [])

  const fetchFeedback = useCallback(async (mode: 'all' | 'mine' | 'saved', options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true)
    setErrorMessage('')

    try {
      const endpoint = mode === 'mine' ? '/api/feedback/mine' : mode === 'saved' ? '/api/feedback/saved' : '/api/feedback'
      const res = await fetch(endpoint, {
        method: 'GET',
        credentials: 'include'
      })

      if (!res.ok) {
        const data = await res.json()
        const message = data.error || 'Could not load posts.'
        if (!options?.silent) {
          setErrorMessage(message)
          toast.error(message)
          setFeedback([])
        }
        return
      }

      const data: ApiFeedbackItem[] = await res.json()
      setFeedback(formatFeedback(data))
    } catch (err) {
      console.error('Error loading posts:', err)
      const message = 'Could not load posts. Please try again.'
      if (!options?.silent) {
        setErrorMessage(message)
        toast.error(message)
        setFeedback([])
      }
    } finally {
      if (!options?.silent) setLoading(false)
    }
  }, [formatFeedback])

  useEffect(() => {
    fetchFeedback('all')
  }, [fetchFeedback])

  useEffect(() => {
    if (publicMode) return

    const fetchCurrentUser = async () => {
      const res = await fetch('/api/me', { credentials: 'include' })
      const data = await res.json()
      setCurrentUser(data.user)
    }

    fetchCurrentUser()
  }, [publicMode])

  const fetchNotifications = useCallback(async () => {
    if (!activeUser) {
      setNotifications([])
      return
    }

    const res = await fetch('/api/notifications', { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      setNotifications(data.notifications || [])
    }
  }, [activeUser])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    if (!activeUser) return

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') fetchNotifications()
    }, 4000)

    return () => window.clearInterval(interval)
  }, [activeUser, fetchNotifications])

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible' && editingFeedbackId === null) {
        fetchFeedback(viewMode, { silent: true })
      }
    }, 5000)

    return () => window.clearInterval(interval)
  }, [editingFeedbackId, fetchFeedback, viewMode])


  useEffect(() => {
    setCurrentPage(1)
    setEditingFeedbackId(null)
  }, [viewMode, sortBy, categoryFilter, typeFilter, cityFilter, subjectQuery, searchQuery])

  const requireAuth = (message: string) => {
    if (activeUser) return true
    toast.error(message)
    return false
  }

  const handleViewChange = (mode: 'all' | 'mine' | 'saved') => {
    if (mode === 'mine' && !requireAuth('Log in to see your posts.')) return
    if (mode === 'saved' && !requireAuth('Log in to see saved posts.')) return
    setViewMode(mode)
    fetchFeedback(mode)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } finally {
      window.location.href = '/login'
    }
  }

  const handleProofImageUpload = async (
    file: File | null,
    target: 'new' | 'edit',
    value: ExperienceFormState,
    onChange: (next: ExperienceFormState) => void
  ) => {
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    setProofUploadTarget(target)

    try {
      const res = await fetch('/api/uploads/proof', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to upload proof image')
        return
      }

      onChange({ ...value, proofImageUrl: data.url })
      toast.success('Proof image uploaded')
    } catch (err) {
      console.error('Proof upload error:', err)
      toast.error('Failed to upload proof image')
    } finally {
      setProofUploadTarget(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!requireAuth('Log in to share an experience.')) return
    if (!newFeedback.title || !newFeedback.message || !newFeedback.subject) return

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newFeedback)
      })

      if (!res.ok) {
        const errorData = await res.json()
        toast.error(errorData.error || 'Failed to submit post')
        return
      }

      toast.success('Post submitted for admin approval!')
      setNewFeedback(emptyPost)
      setShowFeedbackForm(false)

      if (viewMode === 'mine') fetchFeedback('mine')
    } catch (err) {
      console.error(err)
      toast.error('Failed to submit post. Please try again.')
    }
  }

  const handleStartEdit = (item: FeedbackItem) => {
    setEditingFeedbackId(item.id)
    setEditFeedback({
      title: item.title,
      message: item.message,
      category: item.category,
      subject: item.subject,
      city: item.city,
      experienceType: item.experienceType,
      isAnonymous: item.isAnonymous,
      proofImageUrl: item.proofImageUrl
    })
  }

  const handleCancelEdit = () => {
    setEditingFeedbackId(null)
    setEditFeedback(emptyPost)
  }

  const handleUpdateFeedback = async (id: number) => {
    if (!editFeedback.title || !editFeedback.message || !editFeedback.subject) return

    try {
      const res = await fetch(`/api/feedback/${id}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editFeedback)
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to update post')
        return
      }

      toast.success('Post updated')
      setEditingFeedbackId(null)
      setFeedback(prev => prev.map(item => (item.id === id ? { ...item, ...formatFeedback([data])[0] } : item)))
    } catch (err) {
      console.error('Update post error:', err)
      toast.error('Failed to update post')
    }
  }

  const handleDeleteFeedback = async (id: number) => {
    if (!window.confirm('Delete this pending post?')) return

    try {
      const res = await fetch(`/api/feedback/${id}/delete`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to delete post')
        return
      }

      toast.success('Post deleted')
      setFeedback(prev => prev.filter(item => item.id !== id))
    } catch (err) {
      console.error('Delete post error:', err)
      toast.error('Failed to delete post')
    }
  }

  const handleSave = async (id: number) => {
    if (!requireAuth('Log in to save posts.')) return

    setFeedback(prev => prev.map(item => item.id === id ? { ...item, isSaved: !item.isSaved } : item))

    try {
      const res = await fetch(`/api/feedback/${id}/save`, {
        method: 'POST',
        credentials: 'include'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save post')
      setFeedback(prev => prev.map(item => item.id === id ? { ...item, isSaved: Boolean(data.saved) } : item))
      if (viewMode === 'saved' && !data.saved) setFeedback(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error toggling save:', error)
      setFeedback(prev => prev.map(item => item.id === id ? { ...item, isSaved: !item.isSaved } : item))
      toast.error('Something went wrong.')
    }
  }

  const openNotifications = async () => {
    setShowNotifications(prev => !prev)
    if (notifications.some(item => !item.isRead)) {
      setNotifications(prev => prev.map(item => ({ ...item, isRead: true })))
      await fetch('/api/notifications/read', { method: 'PATCH', credentials: 'include' })
    }
  }

  const handleLike = async (id: number) => {
    if (!requireAuth('Log in to like posts.')) return
    setFeedback(prev => prev.map(item => item.id === id ? { ...item, likes: item.isLiked ? item.likes - 1 : item.likes + 1, isLiked: !item.isLiked } : item))

    try {
      const res = await fetch(`/api/feedback/${id}/like`, {
        method: 'POST',
        credentials: 'include'
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to toggle like')
    } catch (error) {
      console.error('Error toggling like:', error)
      setFeedback(prev => prev.map(item => item.id === id ? { ...item, likes: item.isLiked ? item.likes - 1 : item.likes + 1, isLiked: !item.isLiked } : item))
      toast.error('Something went wrong.')
    }
  }

  const fetchComments = useCallback(async (postId: number, options?: { silent?: boolean }) => {
    const res = await fetch(`/api/feedback/${postId}/comments`, { credentials: 'include' })
    const data = await res.json()

    if (!res.ok) {
      if (!options?.silent) toast.error(data.error || 'Failed to load comments')
      return
    }

    setCommentsByPost(prev => ({ ...prev, [postId]: data }))
    setFeedback(prev => prev.map(item => item.id === postId ? { ...item, commentsCount: data.length } : item))
  }, [])

  useEffect(() => {
    if (!openCommentsPostId) return

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') fetchComments(openCommentsPostId, { silent: true })
    }, 5000)

    return () => window.clearInterval(interval)
  }, [fetchComments, openCommentsPostId])

  const toggleComments = async (postId: number) => {
    const isOpening = openCommentsPostId !== postId
    setOpenCommentsPostId(isOpening ? postId : null)

    if (isOpening && !commentsByPost[postId]) {
      await fetchComments(postId)
    }
  }

  const handleAddComment = async (postId: number, parentId?: number) => {
    if (!requireAuth('Log in to reply.')) return
    const message = commentDrafts[postId]?.trim()
    if (!message) return

    const res = await fetch(`/api/feedback/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message, isAnonymous: Boolean(anonymousCommentDrafts[postId]), parentId })
    })
    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error || 'Failed to add comment')
      return
    }

    setCommentsByPost(prev => ({ ...prev, [postId]: [...(prev[postId] || []), data] }))
    setFeedback(prev => prev.map(item => item.id === postId ? { ...item, commentsCount: item.commentsCount + 1 } : item))
    setCommentDrafts(prev => ({ ...prev, [postId]: '' }))
    setAnonymousCommentDrafts(prev => ({ ...prev, [postId]: false }))
    setReplyTargetsByPost(prev => ({ ...prev, [postId]: null }))
    toast.success('Comment added')
  }

  const handleDeleteComment = async (postId: number, commentId: number) => {
    if (!window.confirm('Delete this comment?')) return

    const comments = commentsByPost[postId] || []
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

    setCommentsByPost(prev => ({ ...prev, [postId]: (prev[postId] || []).filter(comment => !idsToRemove.has(comment.id)) }))
    setFeedback(prev => prev.map(item => item.id === postId ? { ...item, commentsCount: Math.max(0, item.commentsCount - idsToRemove.size) } : item))
    setReplyTargetsByPost(prev => prev[postId] && idsToRemove.has(prev[postId].id) ? { ...prev, [postId]: null } : prev)
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

  const filteredFeedback = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const subject = subjectQuery.trim().toLowerCase()

    return feedback
      .filter(item => categoryFilter === 'all' || item.category === categoryFilter)
      .filter(item => typeFilter === 'all' || item.experienceType === typeFilter)
      .filter(item => cityFilter === 'all' || item.city === cityFilter)
      .filter(item => !subject || item.subject.toLowerCase().includes(subject))
      .filter(item => {
        if (!query) return true
        const combined = [item.title, item.message, item.subject, item.city, item.category, item.experienceType, item.user].join(' ').toLowerCase()
        return query.split(/\s+/).every(term => combined.includes(term))
      })
  }, [feedback, categoryFilter, typeFilter, cityFilter, subjectQuery, searchQuery])

  const sortedFeedback = [...filteredFeedback].sort((a, b) => {
    if (sortBy === 'latest') return new Date(b.date).getTime() - new Date(a.date).getTime()
    if (sortBy === 'most-discussed') return b.commentsCount - a.commentsCount
    return b.likes - a.likes
  })

  const unreadCount = notifications.filter(item => !item.isRead).length
  const totalPages = Math.ceil(sortedFeedback.length / POSTS_PER_PAGE)
  const paginatedFeedback = sortedFeedback.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE)

  const getStatusClass = (status: FeedbackItem['status']) => {
    if (status === 'approved') return 'bg-green-100 text-green-800'
    if (status === 'pending') return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const renderPostFields = (value: ExperienceFormState, onChange: (next: ExperienceFormState) => void) => (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-medium text-stone-700">Category</label>
          <select id="category" value={value.category} onChange={(e) => onChange({ ...value, category: e.target.value })} className="w-full rounded-xl border border-stone-300/80 px-3 py-2 text-stone-700 shadow-[0_8px_24px_rgba(37,31,24,0.06)] outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
            {TUNISIA_CATEGORIES.map(category => <option key={category}>{category}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="experienceType" className="mb-1 block text-sm font-medium text-stone-700">Type</label>
          <select id="experienceType" value={value.experienceType} onChange={(e) => onChange({ ...value, experienceType: e.target.value })} className="w-full rounded-xl border border-stone-300/80 px-3 py-2 text-stone-700 shadow-[0_8px_24px_rgba(37,31,24,0.06)] outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
            {EXPERIENCE_TYPES.map(type => <option key={type}>{type}</option>)}
          </select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="city" className="mb-1 block text-sm font-medium text-stone-700">City</label>
          <select id="city" value={value.city} onChange={(e) => onChange({ ...value, city: e.target.value })} className="w-full rounded-xl border border-stone-300/80 px-3 py-2 text-stone-700 shadow-[0_8px_24px_rgba(37,31,24,0.06)] outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
            {TUNISIA_CITIES.map(city => <option key={city}>{city}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="subject" className="mb-1 block text-sm font-medium text-stone-700">Company, shop, service, or topic</label>
          <input type="text" id="subject" className="w-full rounded-xl border border-stone-300/80 px-3 py-2 text-stone-700 shadow-[0_8px_24px_rgba(37,31,24,0.06)] outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" value={value.subject} onChange={(e) => onChange({ ...value, subject: e.target.value })} placeholder="Example: Teleperformance, Jumia, delivery company" required />
        </div>
      </div>
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-stone-700">Title</label>
        <input type="text" id="title" className="w-full rounded-xl border border-stone-300/80 px-3 py-2 text-stone-700 shadow-[0_8px_24px_rgba(37,31,24,0.06)] outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} placeholder="Example: Is this call center good for students?" required />
      </div>
      <div>
        <label htmlFor="message" className="mb-1 block text-sm font-medium text-stone-700">Details</label>
        <textarea id="message" rows={5} className="w-full rounded-xl border border-stone-300/80 px-3 py-2 text-stone-700 shadow-[0_8px_24px_rgba(37,31,24,0.06)] outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" value={value.message} onChange={(e) => onChange({ ...value, message: e.target.value })} placeholder="Share what happened, what you want to know, or what others should watch out for." required />
      </div>
      <div className="rounded-xl border border-stone-200/80 bg-stone-50/70 p-3">
        <label className="mb-1 block text-sm font-medium text-stone-700">Proof image</label>
        <p className="mb-3 text-xs leading-5 text-stone-500">Optional screenshot or photo. Blur private information before uploading. JPG, PNG, WebP, or GIF up to 5 MB.</p>
        {value.proofImageUrl ? (
          <div className="space-y-3">
            <Image src={value.proofImageUrl} alt="Uploaded proof preview" width={900} height={520} className="max-h-56 w-full rounded-xl border border-stone-200/80 bg-white object-contain" />
            <button type="button" onClick={() => onChange({ ...value, proofImageUrl: '' })} className="rounded-xl bg-stone-200 px-3 py-1.5 text-sm font-semibold text-stone-800 hover:bg-stone-300">Remove image</button>
          </div>
        ) : (
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={proofUploadTarget !== null} onChange={(e) => handleProofImageUpload(e.target.files?.[0] || null, value === newFeedback ? 'new' : 'edit', value, onChange)} className="w-full rounded-xl border border-stone-300/80 bg-white px-3 py-2 text-sm text-stone-700" />
        )}
        {proofUploadTarget !== null && <p className="mt-2 text-xs font-medium text-teal-700">Uploading image...</p>}
      </div>
      <label className="flex items-center gap-3 rounded-xl border border-stone-200/80 bg-stone-50/70 px-3 py-2 text-sm font-medium text-stone-700">
        <input type="checkbox" checked={value.isAnonymous} onChange={(e) => onChange({ ...value, isAnonymous: e.target.checked })} className="h-4 w-4 rounded border-stone-300" />
        Post anonymously
      </label>
    </>
  )

  return (
    <div className="app-shell px-4 py-6 text-stone-950 sm:px-6 lg:px-8">
      <Toaster position="top-right" />
      <div className="app-container">
        <div className="premium-surface mb-8 p-6 sm:flex sm:items-start sm:justify-between sm:gap-6">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-black tracking-tight text-stone-950">Feedback TN</h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-stone-600">Share reviews, warnings, questions, and recommendations from real experiences in Tunisia.</p>
          </div>
          {activeUser ? (
            <div className="mt-4 flex items-center justify-center gap-2 sm:mt-0">
              <div className="relative">
                <button onClick={openNotifications} title="Notifications" className="relative btn-secondary p-2 text-stone-700">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{unreadCount}</span>}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-stone-200/80 bg-white p-3 text-left shadow-xl">
                    <h3 className="text-sm font-semibold text-stone-950">Notifications</h3>
                    <div className="mt-2 max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="py-3 text-sm text-stone-500">No notifications yet.</p>
                      ) : notifications.map(notification => (
                        <Link key={notification.id} href={notification.link} className="block rounded-xl px-2 py-2 text-sm text-stone-700 hover:bg-stone-50/70">
                          <span className="block font-medium text-stone-900">{notification.message}</span>
                          <span className="text-xs text-stone-500">{new Date(notification.date).toLocaleDateString()}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Link href={`/user/${slugify(activeUser.username)}`} title="Profile" className="btn-secondary p-2 text-stone-700">
                <UserCircle className="h-5 w-5" />
              </Link>
              <button onClick={handleLogout} className="btn-secondary px-4 py-2 text-sm">Logout</button>
            </div>
          ) : (
            <div className="mt-4 flex justify-center gap-2 sm:mt-0">
              <Link href="/login" className="btn-secondary px-4 py-2 text-sm">Log in</Link>
              <Link href="/signup" className="btn-primary px-4 py-2 text-sm">Sign up</Link>
            </div>
          )}
        </div>

        <div className="mb-6 flex justify-end">
          {activeUser ? (
            <button onClick={() => setShowFeedbackForm(!showFeedbackForm)} className="btn-primary px-5 py-2.5 text-sm">{showFeedbackForm ? 'Cancel' : 'Share Experience'}</button>
          ) : (
            <Link href="/login" className="btn-primary px-5 py-2.5 text-sm">Log in to share</Link>
          )}
        </div>

        {showFeedbackForm && (
          <div className="premium-surface mb-8 p-6 animate-fade-in">
            <h2 className="mb-2 text-xl font-semibold text-stone-950">Create a Post</h2>
            <p className="mb-4 text-sm text-stone-600">Share your experience in {SUPPORTED_LANGUAGE_LABELS.join(', ')}.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {renderPostFields(newFeedback, setNewFeedback)}
              <button type="submit" className="w-full rounded-xl bg-teal-700 px-4 py-2 text-white hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2">Submit for Review</button>
            </form>
          </div>
        )}

        <div className="premium-surface mb-6 p-4">
          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.9fr_auto_auto_auto_auto]">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search: Teleperformance Sousse, Jumia delivery..." className="rounded-xl border border-stone-300/80 px-3 py-2 text-sm text-stone-950 placeholder:text-stone-500 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
            <input type="text" value={subjectQuery} onChange={(e) => setSubjectQuery(e.target.value)} placeholder="Company/service" className="rounded-xl border border-stone-300/80 px-3 py-2 text-sm text-stone-950 placeholder:text-stone-500 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
            <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="rounded-xl border border-stone-300/80 px-3 py-2 text-sm text-stone-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
              <option value="all">All cities</option>
              {TUNISIA_CITIES.map(city => <option key={city}>{city}</option>)}
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-xl border border-stone-300/80 px-3 py-2 text-sm text-stone-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
              <option value="all">All categories</option>
              {TUNISIA_CATEGORIES.map(category => <option key={category}>{category}</option>)}
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-xl border border-stone-300/80 px-3 py-2 text-sm text-stone-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
              <option value="all">All types</option>
              {EXPERIENCE_TYPES.map(type => <option key={type}>{type}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="rounded-xl border border-stone-300/80 px-3 py-2 text-sm text-stone-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
              <option value="latest">Latest</option>
              <option value="most-liked">Most liked</option>
              <option value="most-discussed">Most discussed</option>
            </select>
          </div>
        </div>

        <div className="premium-surface overflow-hidden">
          <div className="border-b border-stone-200/70 bg-white/45 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <h2 className="text-lg font-black text-stone-950">{viewMode === 'mine' ? 'My Posts' : viewMode === 'saved' ? 'Saved Posts' : 'Latest Experiences'}</h2>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handleViewChange('all')} className={`rounded-xl px-3 py-1.5 text-sm font-medium ${viewMode === 'all' ? 'bg-teal-100 text-teal-800' : 'bg-white/70 text-stone-700 hover:bg-white'}`}>Latest Experiences</button>
              <button onClick={() => handleViewChange('mine')} className={`rounded-xl px-3 py-1.5 text-sm font-medium ${viewMode === 'mine' ? 'bg-teal-100 text-teal-800' : 'bg-white/70 text-stone-700 hover:bg-white'}`}>My Posts</button>
              <button onClick={() => handleViewChange('saved')} className={`rounded-xl px-3 py-1.5 text-sm font-medium ${viewMode === 'saved' ? 'bg-teal-100 text-teal-800' : 'bg-white/70 text-stone-700 hover:bg-white'}`}>Saved Posts</button>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-center text-stone-500">Loading posts...</div>
          ) : errorMessage ? (
            <div className="p-6 text-center">
              <p className="font-medium text-red-600">Could not load posts</p>
              <p className="mt-1 text-sm text-stone-600">{errorMessage}</p>
              <button onClick={() => fetchFeedback(viewMode)} className="mt-4 rounded-xl bg-teal-700 px-4 py-2 text-white transition-colors hover:bg-teal-800">Try Again</button>
            </div>
          ) : sortedFeedback.length === 0 ? (
            <div className="p-6 text-center text-stone-500">{viewMode === 'mine' ? 'You have not shared any posts yet.' : viewMode === 'saved' ? 'No saved posts yet.' : 'No posts match these filters yet.'}</div>
          ) : (
            <ul className="divide-y divide-stone-200/70">
              {paginatedFeedback.map((item) => {
                const isEditing = editingFeedbackId === item.id
                const isCommentsOpen = openCommentsPostId === item.id
                const comments = commentsByPost[item.id] || []
                const replyTarget = replyTargetsByPost[item.id] || null
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
                      <div className="rounded-xl bg-white p-3 shadow-[0_8px_24px_rgba(37,31,24,0.06)]">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm text-stone-700">{comment.message}</p>
                            <p className="mt-1 text-xs text-stone-500">By {comment.user} on {new Date(comment.date).toLocaleDateString()}{comment.isAnonymous ? ' · anonymous' : ''}</p>
                          </div>
                          <div className="flex gap-2 text-xs font-medium">
                            <button onClick={() => setReplyTargetsByPost(prev => ({ ...prev, [item.id]: comment }))} className="text-teal-700 hover:text-teal-800">Reply</button>
                            <button onClick={() => openReport({ type: 'comment', id: comment.id })} className="text-stone-500 hover:text-stone-950">Report</button>
                            {comment.isCurrentUser && <button onClick={() => handleDeleteComment(item.id, comment.id)} className="text-red-600 hover:text-red-800">Delete</button>}
                          </div>
                        </div>
                      </div>
                      {childReplies.length > 0 && <div className="mt-3 space-y-3">{childReplies.map(reply => renderComment(reply, depth + 1))}</div>}
                    </div>
                  )
                }

                return (
                  <li key={item.id} className="p-5 transition-colors hover:bg-white/45">
                    {isEditing ? (
                      <div className="space-y-4">
                        {renderPostFields(editFeedback, setEditFeedback)}
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateFeedback(item.id)} className="rounded-xl bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">Save</button>
                          <button onClick={handleCancelEdit} className="rounded-xl bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-800 hover:bg-stone-200">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="pill pill-accent px-2.5 py-1 text-xs">{item.category}</span>
                              <span className="pill px-2.5 py-1 text-xs">{item.experienceType}</span>
                              <span className="pill px-2.5 py-1 text-xs">{item.city}</span>
                              {viewMode === 'mine' && <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusClass(item.status)}`}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</span>}
                            </div>
                            <Link href={`/post/${item.id}`} className="mt-3 block text-lg font-black text-stone-950 hover:text-teal-700">{item.title}</Link>
                            <p className="mt-1 text-sm font-medium text-stone-500">About <Link href={`/company/${slugify(item.subject)}`} className="text-teal-700 hover:text-teal-800">{item.subject}</Link></p>
                            <p className="mt-2 text-stone-600">{item.message}</p>
                            {item.proofImageUrl && <Image src={item.proofImageUrl} alt="Proof attached to this post" width={900} height={520} className="mt-3 max-h-72 w-full rounded-xl border border-stone-200/80 bg-white object-contain" />}
                          </div>
                          {item.status === 'approved' && (
                            <button onClick={() => handleLike(item.id)} className={`flex items-center gap-1 self-start transition-all duration-200 ${item.isLiked ? 'scale-110 text-teal-700' : 'text-stone-500 hover:text-teal-600'}`}>
                              <span>{item.isLiked ? 'Liked' : 'Like'}</span>
                              <span>{item.likes}</span>
                            </button>
                          )}
                        </div>
                        <div className="mt-3 flex flex-col gap-2 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            {item.isAnonymous ? <span>By Anonymous</span> : <span>By <Link href={`/user/${slugify(item.user)}`} className="font-medium text-teal-700 hover:text-teal-800">{item.user}</Link></span>}
                            <span>{new Date(item.date).toLocaleDateString()}</span>
                            {item.isAnonymous && <span>Anonymous post</span>}
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {item.status === 'approved' && <button onClick={() => handleSave(item.id)} className={`inline-flex items-center gap-1 font-medium ${item.isSaved ? 'text-teal-700' : 'text-stone-600 hover:text-teal-700'}`}>{item.isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}{item.isSaved ? 'Saved' : 'Save'}</button>}
                            {item.status === 'approved' && <Link href={`/post/${item.id}`} className="font-medium text-teal-700 hover:text-teal-800">View post</Link>}
                            {item.status === 'approved' && <button onClick={() => toggleComments(item.id)} className="font-medium text-teal-700 hover:text-teal-800">{isCommentsOpen ? 'Hide replies' : `${item.commentsCount} replies`}</button>}
                            {item.status === 'approved' && <button onClick={() => openReport({ type: 'feedback', id: item.id })} className="font-medium text-stone-600 hover:text-stone-950">Report</button>}
                            {viewMode === 'mine' && item.status === 'pending' && <button onClick={() => handleStartEdit(item)} className="font-medium text-teal-700 hover:text-teal-800">Edit</button>}
                            {viewMode === 'mine' && item.status === 'pending' && <button onClick={() => handleDeleteFeedback(item.id)} className="font-medium text-red-600 hover:text-red-800">Delete</button>}
                          </div>
                        </div>

                        {isCommentsOpen && (
                          <div className="mt-5 rounded-xl border border-stone-200/80 bg-stone-50/70 p-4">
                            <div className="space-y-3">
                              {comments.length === 0 ? (
                                <p className="text-sm text-stone-500">No replies yet.</p>
                              ) : topLevelComments.map(comment => renderComment(comment))}
                            </div>
                            <div className="mt-4 space-y-2">
                              {replyTarget && (
                                <div className="flex items-center justify-between rounded-xl border border-teal-100 bg-teal-50 px-3 py-2 text-sm text-teal-900">
                                  <span>Replying to {replyTarget.user}</span>
                                  <button onClick={() => setReplyTargetsByPost(prev => ({ ...prev, [item.id]: null }))} className="font-semibold hover:text-teal-700">Cancel</button>
                                </div>
                              )}
                              <textarea value={commentDrafts[item.id] || ''} onChange={(e) => setCommentDrafts(prev => ({ ...prev, [item.id]: e.target.value }))} rows={3} placeholder={replyTarget ? `Reply to ${replyTarget.user}...` : 'Reply with your experience or advice...'} className="w-full rounded-xl border border-stone-300/80 px-3 py-2 text-sm text-stone-700 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <label className="flex items-center gap-2 text-sm text-stone-600">
                                  <input type="checkbox" checked={Boolean(anonymousCommentDrafts[item.id])} onChange={(e) => setAnonymousCommentDrafts(prev => ({ ...prev, [item.id]: e.target.checked }))} />
                                  Reply anonymously
                                </label>
                                {activeUser ? (
                                  <button onClick={() => handleAddComment(item.id, replyTarget?.id)} className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">{replyTarget ? 'Reply' : 'Add Reply'}</button>
                                ) : (
                                  <Link href="/login" className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">Log in to reply</Link>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 border-t border-stone-200/80 p-4">
              {Array.from({ length: totalPages }, (_, index) => {
                const pageNumber = index + 1
                return <button key={pageNumber} onClick={() => setCurrentPage(pageNumber)} className={currentPage === pageNumber ? 'rounded-xl bg-teal-700 px-3 py-1.5 text-sm font-medium text-white transition-colors' : 'rounded-xl bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-800 transition-colors hover:bg-stone-200'}>{pageNumber}</button>
              })}
            </div>
          )}
        </div>
      </div>

      {reportingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h2 className="text-lg font-black text-stone-950">Report content</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Reason</label>
                <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="w-full rounded-xl border border-stone-300/80 px-3 py-2 text-sm text-stone-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
                  {REPORT_REASONS.map(reason => <option key={reason}>{reason}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Details</label>
                <textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} rows={4} className="w-full rounded-xl border border-stone-300/80 px-3 py-2 text-sm text-stone-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" placeholder="Add context for the moderator." />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setReportingTarget(null)} className="rounded-xl bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-200">Cancel</button>
              <button onClick={handleSubmitReport} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Submit Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
