'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

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
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1fr_380px]">
          <section className="hidden rounded-lg border border-slate-200 bg-white p-8 shadow-sm lg:block">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Feedback TN</p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">Sign in to share and review Tunisian experiences.</h1>
            <p className="mt-4 leading-7 text-slate-600">
              People can share reviews, warnings, questions, and recommendations from across Tunisia in Tounsi, Arabic, French, or English. Admins keep the community useful and respectful.
            </p>
            <div className="mt-8 rounded-md border border-blue-100 bg-blue-50 p-4">
              <h2 className="font-semibold text-blue-950">Demo admin</h2>
              <dl className="mt-3 space-y-2 text-sm text-blue-900">
                <div className="flex justify-between gap-4">
                  <dt className="font-medium">Email</dt>
                  <dd className="font-mono">admin@gmail.com</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-medium">Password</dt>
                  <dd className="font-mono">admin</dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@gmail.com')
                  setPassword('admin')
                }}
                className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Fill demo credentials
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-950">Feedback TN</Link>
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">Log in</h1>
            <p className="mt-2 text-sm text-slate-600">Use your account to continue to the community feed.</p>

            <form onSubmit={handleLogin} className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-4 py-2.5 text-slate-950 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-4 py-2.5 pr-16 text-slate-950 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 hover:text-slate-900"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
              <button type="submit" className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                Log in
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-semibold text-blue-700 hover:text-blue-800">Sign up</Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
