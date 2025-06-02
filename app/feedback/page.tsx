// app/feedback/page.tsx
'use client'; // Mark as a Client Component
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

interface FeedbackItem {
  id: number;
  title: string;
  message: string;
  date: string;
  user: string;
  likes: number;
  isLiked: boolean;
  isCurrentUser?: boolean; // if you plan to use this for filtering 'mine'
}


export default function FeedbackPage() {

  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);

  useEffect(() => {
  const fetchFeedback = async () => {
    try {
      const res = await fetch('/api/feedback', {
        method: 'GET',
        credentials: 'include'
      });

      if (!res.ok) {
        console.error('Failed to fetch feedback');
        return;
      }

      const data = await res.json();
      setFeedback(data.map((item: any): FeedbackItem => ({
  ...item,
  isLiked: item.likedByCurrentUser
})));
 // Make sure your API returns an array of feedback objects
    } catch (err) {
      console.error('Error loading feedback:', err);
    }
  };

  fetchFeedback();
}, []);


  const [sortBy, setSortBy] = useState<'latest' | 'most-liked' | 'mine'>('latest');
  const [newFeedback, setNewFeedback] = useState({
    title: '',
    message: ''
  });
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newFeedback.title || !newFeedback.message) return;

  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(newFeedback)
    });

    if (!res.ok) {
      const errorData = await res.json();
      toast.error(errorData.error || 'Failed to submit feedback');
      return;
    }

    // Success notification
    toast.success('Feedback submitted for admin approval!', {
      duration: 4000,
      style: {
        background: '#4BB543',
        color: '#fff',
      },
    });
    
    setNewFeedback({ title: '', message: '' });
    setShowFeedbackForm(false);
    
  } catch (err) {
    toast.error('Failed to submit feedback. Please try again.', {
      duration: 4000,
      style: {
        background: '#FF3333',
        color: '#fff',
      },
    });
    console.error(err);
  }
};

const handleLike = async (id: number) => {
  // Optimistically update the UI
  setFeedback(prev =>
    prev.map(item =>
      item.id === id
        ? {
            ...item,
            likes: item.isLiked ? item.likes - 1 : item.likes + 1,
            isLiked: !item.isLiked,
          }
        : item
    )
  );

  try {
    const res = await fetch(`/api/feedback/${id}/like`, {
      method: 'POST',
      credentials: 'include',
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to toggle like');
    }

    // Optionally sync state with backend result if needed
  } catch (error) {
    console.error('Error toggling like:', error);
    // Revert like on failure
    setFeedback(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              likes: item.isLiked ? item.likes - 1 : item.likes + 1,
              isLiked: !item.isLiked,
            }
          : item
      )
    );
    alert('Something went wrong.');
  }
};


  const sortedFeedback = [...feedback]
  .filter((item) => {
    if (sortBy === 'mine') {
      return item.isCurrentUser // You should ideally compare with the current user ID from session
    }
    return true;
  })
  .sort((a, b) => {
    if (sortBy === 'latest') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortBy === 'most-liked') {
      return b.likes - a.likes;
    }
    return 0;
  });


  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-right" />
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Feedback Board</h1>
          <p className="mt-2 text-lg text-gray-600">
            Share your thoughts and see what others are saying
          </p>
        </div>

        {/* Write Feedback Button */}
        <div className="mb-6 text-center">
          <button
            onClick={() => setShowFeedbackForm(!showFeedbackForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
          >
            {showFeedbackForm ? 'Cancel' : 'Write Feedback'}
          </button>
        </div>

        {/* Feedback Form (Conditional) */}
        {showFeedbackForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-8 animate-fade-in">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Submit Feedback</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={newFeedback.title}
                  onChange={(e) => setNewFeedback({...newFeedback, title: e.target.value})}
                  placeholder="Brief description of your feedback"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={newFeedback.message}
                  onChange={(e) => setNewFeedback({...newFeedback, message: e.target.value})}
                  placeholder="Detailed feedback or suggestions"
                  required
                ></textarea>
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

        {/* Feedback List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-800">All Feedback</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setSortBy('latest')}
                className={`px-3 py-1 text-sm rounded-md ${sortBy === 'latest' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
              >
                Latest
              </button>
              <button
                onClick={() => setSortBy('most-liked')}
                className={`px-3 py-1 text-sm rounded-md ${sortBy === 'most-liked' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
              >
                Most Liked
              </button>
              <button
                onClick={() => setSortBy('mine')}
                className={`px-3 py-1 text-sm rounded-md ${sortBy === 'mine' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
              >
                My Feedback
              </button>
            </div>
          </div>

          {sortedFeedback.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No feedback submitted yet. Be the first to share your thoughts!
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {sortedFeedback.map((item) => (
                <li key={item.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between">
                    <h3 className="text-lg font-medium text-gray-800">{item.title}</h3>
                    <button
                      onClick={() => handleLike(item.id)}
                      className={`flex items-center gap-1 transition-all duration-200 ${
                        item.isLiked ? 'text-blue-600 scale-110' : 'text-gray-500 hover:text-blue-500'
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
                  </div>
                  <p className="text-gray-600 mt-1">{item.message}</p>
                  <div className="mt-2 flex justify-between text-sm text-gray-500">
                    <span>By {item.user}</span>
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Logout
          </Link>
        </div>
      </div>
    </div>
  );
}