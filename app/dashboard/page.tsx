// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

interface Feedback {
  id: number;
  title: string;
  message: string;
  likes: number;
  date: string;
  user: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function DashboardPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const FEEDBACK_PER_PAGE = 10;
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch feedback data
  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await fetch('/api/feedback/admin');
        if (!response.ok) {
          throw new Error('Failed to fetch feedback');
        }
        const data = await response.json();
        setFeedback(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, []);

  const deleteFeedback = async (id: number) => {
  try {
    const response = await fetch(`/api/feedback/${id}/delete`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete feedback');
    }

    // Show success toast
    toast.success('Feedback deleted successfully', {
      position: 'top-right',
      duration: 3000,
      style: {
        background: '#4BB543',
        color: '#white',
      },
    });

    // Update local state to remove the deleted feedback
    setFeedback(prev => prev.filter(item => item.id !== id));
    
  } catch (err) {
    // Show error toast
    toast.error(err instanceof Error ? err.message : 'Failed to delete feedback', {
      position: 'top-right',
      duration: 3000,
      style: {
        background: '#FF3333',
        color: '#white',
      },
    });
  }
};

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } finally {
      window.location.href = '/login';
    }
  };

  const updateStatus = async (id: number, newStatus: 'pending' | 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/feedback/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update feedback status');
      }

      // Update local state with the new status
      setFeedback(prev =>
        prev.map(item => (item.id === id ? { ...item, status: newStatus } : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update feedback status');
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  const filteredFeedback = feedback
    .filter(item => filter === 'all' || item.status === filter)
    .filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const totalPages = Math.ceil(filteredFeedback.length / FEEDBACK_PER_PAGE);
  const paginatedFeedback = filteredFeedback.slice(
    (currentPage - 1) * FEEDBACK_PER_PAGE,
    currentPage * FEEDBACK_PER_PAGE
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-xl font-medium text-slate-700">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-xl font-medium text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 text-slate-950 sm:px-6 lg:px-8">
      <Toaster position="top-right" />
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">Admin Dashboard</h1>
            <p className="mt-1 text-slate-600">Manage user feedback</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-100"
          >
            Logout
          </button>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0">
              <button
                onClick={() => setFilter('all')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap ${filter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}`}
              >
                All Feedback
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap ${filter === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-800'}`}
              >
                Pending Review
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap ${filter === 'approved' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}
              >
                Approved
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap ${filter === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'}`}
              >
                Rejected
              </button>
            </div>
            <div className="w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search feedback..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm text-slate-950 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500">Total Feedback</h3>
            <p className="text-2xl font-semibold text-slate-950">{feedback.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500">Pending</h3>
            <p className="text-2xl font-semibold text-yellow-600">
              {feedback.filter(f => f.status === 'pending').length}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500">Approved</h3>
            <p className="text-2xl font-semibold text-green-600">
              {feedback.filter(f => f.status === 'approved').length}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500">Rejected</h3>
            <p className="text-2xl font-semibold text-red-600">
              {feedback.filter(f => f.status === 'rejected').length}
            </p>
          </div>
        </div>

        {/* Feedback Table */}
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {filteredFeedback.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              No feedback found matching your criteria
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Title
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Likes
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {paginatedFeedback.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.status === 'approved' 
                            ? 'bg-green-100 text-green-800' 
                            : item.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm font-medium text-slate-950">{item.title}</div>
                        <div className="text-sm text-slate-500 line-clamp-1 max-w-xs">{item.message}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                        {item.user}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                        {new Date(item.date).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                        {item.likes}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {item.status !== 'approved' && (
                            <button
                              onClick={() => updateStatus(item.id, 'approved')}
                              className="text-green-600 hover:text-green-900"
                              title="Approve"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                          {item.status !== 'pending' && (
                            <button
                              onClick={() => updateStatus(item.id, 'pending')}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Mark as Pending"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                          {item.status !== 'rejected' && (
                            <button
                              onClick={() => updateStatus(item.id, 'rejected')}
                              className="text-red-600 hover:text-red-900"
                              title="Reject"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => deleteFeedback(item.id)}
                            className="text-slate-600 hover:text-slate-950"
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, index) => {
                const pageNumber = index + 1;

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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}