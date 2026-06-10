'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      router.push(data.user.isAdmin ? '/dashboard' : '/feedback')
    } catch (err) {
      console.error('Login error:', err)
      setError('Something went wrong. Please try again.')
    }
  }

  return (
    <main className="app-shell px-4 py-6">
      <div className="app-container flex min-h-[calc(100vh-3rem)] items-center justify-center">
        <div className="grid w-full max-w-6xl gap-5 lg:grid-cols-[1fr_430px]">
          <section className="premium-surface hidden overflow-hidden p-8 lg:block">
            <div className="flex h-full flex-col justify-between rounded-2xl bg-stone-950 p-8 text-white shadow-2xl shadow-stone-900/20">
              <div>
                <Link href="/" className="inline-flex items-center gap-3 text-sm font-black text-white">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-xs">TN</span>
                  Feedback TN
                </Link>
                <p className="mt-12 text-sm font-bold uppercase tracking-[0.2em] text-teal-200">Trust and safety first</p>
                <h1 className="mt-4 max-w-xl text-5xl font-black leading-tight tracking-tight">Moderated community feedback for Tunisia.</h1>
                <p className="mt-5 max-w-xl text-lg leading-8 text-stone-300">
                  Sign in to share experiences, follow replies, save useful posts, and help keep public discovery clean through reports and moderation.
                </p>
              </div>

              <div className="mt-10 rounded-2xl border border-white/10 bg-white/10 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 h-5 w-5 text-teal-200" />
                  <div>
                    <h2 className="font-black">Demo admin</h2>
                    <p className="mt-1 text-sm text-stone-300">Use this account to inspect the moderation dashboard.</p>
                  </div>
                </div>
                <dl className="mt-4 grid gap-3 text-sm text-stone-200">
                  <div className="flex justify-between gap-4 rounded-xl bg-white/10 px-3 py-2"><dt>Email</dt><dd className="font-mono">admin@gmail.com</dd></div>
                  <div className="flex justify-between gap-4 rounded-xl bg-white/10 px-3 py-2"><dt>Password</dt><dd className="font-mono">admin</dd></div>
                </dl>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@gmail.com')
                    setPassword('admin')
                  }}
                  className="mt-4 w-full rounded-xl bg-white px-4 py-2.5 text-sm font-black text-stone-950 hover:bg-teal-50"
                >
                  Fill demo credentials
                </button>
              </div>
            </div>
          </section>

          <section className="premium-surface p-6 sm:p-8">
            <Link href="/" className="inline-flex items-center gap-3 text-sm font-black text-stone-950">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-xs text-white">TN</span>
              Feedback TN
            </Link>
            <p className="eyebrow mt-9">Welcome back</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-stone-950">Log in to your account</h1>
            <p className="mt-2 text-sm leading-6 text-stone-600">Continue to your feed, saved posts, notifications, or admin dashboard.</p>

            <form onSubmit={handleLogin} className="mt-7 space-y-5">
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
                Log in <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-stone-600">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-black text-teal-700 hover:text-teal-800">Sign up</Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
