'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, ImagePlus, LockKeyhole, MessageSquareText } from 'lucide-react'

export default function SignupPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }

      window.location.href = '/login'
    } catch (err) {
      console.error('Signup error:', err)
      setError('Failed to sign up. Please try again.')
    }
  }

  return (
    <main className="app-shell px-4 py-6">
      <div className="app-container flex min-h-[calc(100vh-3rem)] items-center justify-center">
        <div className="grid w-full max-w-6xl gap-5 lg:grid-cols-[430px_1fr]">
          <section className="premium-surface p-6 sm:p-8">
            <Link href="/" className="inline-flex items-center gap-3 text-sm font-black text-stone-950">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-xs text-white">TN</span>
              Feedback TN
            </Link>
            <p className="eyebrow mt-9">Join the community</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-stone-950">Create your account</h1>
            <p className="mt-2 text-sm leading-6 text-stone-600">Share real experiences and receive updates when people reply.</p>

            <form onSubmit={handleSignup} className="mt-7 space-y-5">
              <div>
                <label className="block text-sm font-bold text-stone-700">Username</label>
                <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="field mt-1 px-4 py-3" />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field mt-1 px-4 py-3" />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700">Password</label>
                <div className="relative mt-1">
                  <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="field px-4 py-3 pr-12" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} title={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-950">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p>}
              <button type="submit" className="btn-primary w-full px-4 py-3 text-sm">
                Sign up <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-stone-600">
              Already have an account?{' '}
              <Link href="/login" className="font-black text-teal-700 hover:text-teal-800">Log in</Link>
            </p>
          </section>

          <section className="premium-surface hidden overflow-hidden p-8 lg:block">
            <div className="flex h-full flex-col justify-between rounded-2xl bg-stone-950 p-8 text-white shadow-2xl shadow-stone-900/20">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-200">Built for real stories</p>
                <h2 className="mt-4 max-w-xl text-5xl font-black leading-tight tracking-tight">Ask, warn, recommend, and document what happened.</h2>
                <p className="mt-5 max-w-xl text-lg leading-8 text-stone-300">Post publicly or anonymously, attach proof images, and keep sensitive information protected before moderation.</p>
              </div>
              <div className="mt-10 grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-5"><MessageSquareText className="h-5 w-5 text-teal-200" /><p className="mt-3 font-black">Questions and discussions</p></div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-5"><ImagePlus className="h-5 w-5 text-teal-200" /><p className="mt-3 font-black">Optional proof images</p></div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-5"><LockKeyhole className="h-5 w-5 text-teal-200" /><p className="mt-3 font-black">Anonymous public identity</p></div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
