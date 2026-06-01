'use client'

import { useCallback, useEffect, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'

interface FeedbackItem {
  id: number
  title: string
  message: string
  date: string
  user: string
  likes: number
  status: 'pending' | 'approved' | 'rejected'
  isLiked: boolean
  isCurrentUser?: boolean
}

interface ApiFeedbackItem {
  id: number
  title: string
  message: string
  date: string
  user: string
  likes: number
  status?: 'pending' | 'approved' | 'rejected'
  isCurrentUser?: boolean
  likedByCurrentUser?: boolean
}

export default function FeedbackPage() {
  const FEEDBACK_PER_PAGE = 10
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'all' | 'mine'>('all')
  const [sortBy, setSortBy] = useState<'latest' | 'most-liked'>('latest')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [newFeedback, setNewFeedback] = useState({
    title: '',
    message: ''
  })
  const [editingFeedbackId, setEditingFeedbackId] = useState<number | null>(null)
  const [editFeedback, setEditFeedback] = useState({
    title: '',
    message: ''
  })
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)

  const formatFeedback = (items: ApiFeedbackItem[]): FeedbackItem[] =>
    items.map(item => ({
      ...item,
      status: item.status || 'approved',
      isLiked: Boolean(item.likedByCurrentUser)
    }))

  const fetchFeedback = useCallback(async (mode: 'all' | 'mine') => {
    setLoading(true)
    setErrorMessage('')

    try {
      const res = await fetch(mode === 'mine' ? '/api/feedback/mine' : '/api/feedback', {
        method: 'GET',
        credentials: 'include'
      })

      if (!res.ok) {
        const data = await res.json()
        const message = data.error || 'Could not load feedback.'
        setErrorMessage(message)
        toast.error(message)
        setFeedback([])
        return
      }

      const data: ApiFeedbackItem[] = await res.json()
      setFeedback(formatFeedback(data))
    } catch (err) {
      console.error('Error loading feedback:', err)
      const message = 'Could not load feedback. Please try again.'
      setErrorMessage(message)
      toast.error(message)
      setFeedback([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFeedback('all')
  }, [fetchFeedback])

  useEffect(() => {
    setCurrentPage(1)
    setEditingFeedbackId(null)
  }, [viewMode, sortBy])

  const handleViewChange = (mode: 'all' | 'mine') => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFeedback.title || !newFeedback.message) return

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(newFeedback)
      })

      if (!res.ok) {
        const errorData = await res.json()
        toast.error(errorData.error || 'Failed to submit feedback')
        return
      }

      toast.success('Feedback submitted for admin approval!', {
        duration: 4000,
        style: {
          background: '#4BB543',
          color: '#fff'
        }
      })

      setNewFeedback({ title: '', message: '' })
      setShowFeedbackForm(false)

      if (viewMode === 'mine') {
        fetchFeedback('mine')
      }
    } catch (err) {
      toast.error('Failed to submit feedback. Please try again.', {
        duration: 4000,
        style: {
          background: '#FF3333',
          color: '#fff'
        }
      })
      console.error(err)
    }
  }

  const handleStartEdit = (item: FeedbackItem) => {
    setEditingFeedbackId(item.id)
    setEditFeedback({ title: item.title, message: item.message })
  }

  const handleCancelEdit = () => {
    setEditingFeedbackId(null)
    setEditFeedback({ title: '', message: '' })
  }

  const handleUpdateFeedback = async (id: number) => {
    if (!editFeedback.title || !editFeedback.message) return

    try {
      const res = await fetch(`/api/feedback/${id}/edit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(editFeedback)
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to update feedback')
        return
      }

      toast.success('Feedback updated')
      setEditingFeedbackId(null)
      setFeedback(prev =>
        prev.map(item => (item.id === id ? { ...item, ...formatFeedback([data])[0] } : item))
      )
    } catch (err) {
      console.error('Update feedback error:', err)
      toast.error('Failed to update feedback')
    }
  }

  const handleDeleteFeedback = async (id: number) => {
    if (!window.confirm('Delete this pending feedback?')) return

    try {
      const res = await fetch(`/api/feedback/${id}/delete`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to delete feedback')
        return
      }

      toast.success('Feedback deleted')
      setFeedback(prev => prev.filter(item => item.id !== id))
    } catch (err) {
      console.error('Delete feedback error:', err)
      toast.error('Failed to delete feedback')
    }
  }

  const handleLike = async (id: number) => {
    setFeedback(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              likes: item.isLiked ? item.likes - 1 : item.likes + 1,
              isLiked: !item.isLiked
            }
          : item
      )
    )

    try {
      const res = await fetch(`/api/feedback/${id}/like`, {
        method: 'POST',
        credentials: 'include'
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to toggle like')
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      setFeedback(prev =>
        prev.map(item =>
          item.id === id
            ? {
                ...item,
                likes: item.isLiked ? item.likes - 1 : item.likes + 1,
                isLiked: !item.isLiked
              }
            : item
        )
      )
      toast.error('Something went wrong.')
    }
  }

  const sortedFeedback = [...feedback].sort((a, b) => {
    if (sortBy === 'latest') {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    }

    return b.likes - a.likes
  })

  const totalPages = Math.ceil(sortedFeedback.length / FEEDBACK_PER_PAGE)
  const paginatedFeedback = sortedFeedback.slice(
    (currentPage - 1) * FEEDBACK_PER_PAGE,
    currentPage * FEEDBACK_PER_PAGE
  )

  const getStatusClass = (status: FeedbackItem['status']) => {
    if (status === 'approved') return 'bg-green-100 text-green-800'
    if (status === 'pending') return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 text-slate-950 sm:px-6 lg:px-8">
      <Toaster position="top-right" />
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:flex sm:items-start sm:justify-between sm:gap-6">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">Feedback Board</h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
              Share your thoughts and see what others are saying
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-100 sm:mt-0"
          >
            Logout
          </button>
        </div>

        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowFeedbackForm(!showFeedbackForm)}
            className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            {showFeedbackForm ? 'Cancel' : 'Write Feedback'}
          </button>
        </div>

        {showFeedbackForm && (
          <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm animate-fade-in">
            <h2 className="mb-4 text-xl font-semibold text-slate-950">Submit Feedback</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-600 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={newFeedback.title}
                  onChange={(e) => setNewFeedback({ ...newFeedback, title: e.target.value })}
                  placeholder="Brief description of your feedback"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-600 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={newFeedback.message}
                  onChange={(e) => setNewFeedback({ ...newFeedback, message: e.target.value })}
                  placeholder="Detailed feedback or suggestions"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Submit Feedback
              </button>
            </form>
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50/70 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <h2 className="text-lg font-semibold text-slate-950">
              {viewMode === 'mine' ? 'My Feedback' : 'All Feedback'}
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleViewChange('all')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${viewMode === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}`}
              >
                All Feedback
              </button>
              <button
                onClick={() => handleViewChange('mine')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${viewMode === 'mine' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}`}
              >
                My Feedback
              </button>
              <button
                onClick={() => setSortBy('latest')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${sortBy === 'latest' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}`}
              >
                Latest
              </button>
              <button
                onClick={() => setSortBy('most-liked')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${sortBy === 'most-liked' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}`}
              >
                Most Liked
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-center text-slate-500">Loading feedback...</div>
          ) : errorMessage ? (
            <div className="p-6 text-center">
              <p className="font-medium text-red-600">Could not load feedback</p>
              <p className="mt-1 text-sm text-slate-600">{errorMessage}</p>
              <button
                onClick={() => fetchFeedback(viewMode)}
                className="mt-4 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : sortedFeedback.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              {viewMode === 'mine'
                ? 'You have not submitted any feedback yet.'
                : 'No feedback submitted yet. Be the first to share your thoughts!'}
            </div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {paginatedFeedback.map((item) => {
                const isEditing = editingFeedbackId === item.id

                return (
                  <li key={item.id} className="p-5 transition-colors hover:bg-slate-50">
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editFeedback.title}
                          onChange={(e) => setEditFeedback({ ...editFeedback, title: e.target.value })}
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        <textarea
                          rows={4}
                          value={editFeedback.message}
                          onChange={(e) => setEditFeedback({ ...editFeedback, message: e.target.value })}
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateFeedback(item.id)}
                            className="rounded-md px-3 py-1.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="rounded-md px-3 py-1.5 text-sm font-medium bg-slate-100 text-slate-800 hover:bg-slate-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
                              {viewMode === 'mine' && (
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusClass(item.status)}`}>
                                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-600 mt-1">{item.message}</p>
                          </div>
                          {item.status === 'approved' && (
                            <button
                              onClick={() => handleLike(item.id)}
                              className={`flex items-center gap-1 self-start transition-all duration-200 ${
                                item.isLiked ? 'text-blue-600 scale-110' : 'text-slate-500 hover:text-blue-500'
                              }`}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill={item.isLiked ? 'currentColor' : 'none'}
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                                />
                              </svg>
                              {item.likes}
                            </button>
                          )}
                        </div>
                        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500">
                          <div className="flex justify-between gap-4 sm:contents">
                            <span>By {item.user}</span>
                            <span>{new Date(item.date).toLocaleDateString()}</span>
                          </div>
                          {viewMode === 'mine' && item.status === 'pending' && (
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleStartEdit(item)}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteFeedback(item.id)}
                                className="text-red-600 hover:text-red-800 font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, index) => {
                const pageNumber = index + 1

                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={currentPage === pageNumber
                      ? 'rounded-md px-3 py-1.5 text-sm font-medium transition-colors bg-blue-600 text-white'
                      : 'rounded-md px-3 py-1.5 text-sm font-medium transition-colors bg-slate-100 text-slate-800 hover:bg-slate-200'
                    }
                  >
                    {pageNumber}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
