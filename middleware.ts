import { NextRequest, NextResponse } from 'next/server'

const rateLimitStore = globalThis as typeof globalThis & {
  __feedbackTnMiddlewareRateLimits?: Map<string, { count: number; resetAt: number }>
}

const getStore = () => {
  if (!rateLimitStore.__feedbackTnMiddlewareRateLimits) rateLimitStore.__feedbackTnMiddlewareRateLimits = new Map()
  return rateLimitStore.__feedbackTnMiddlewareRateLimits
}

const getClientIp = (req: NextRequest) => {
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() || 'unknown'
  return req.headers.get('x-real-ip') || 'unknown'
}

const getLimit = (pathname: string) => {
  if (pathname === '/api/login') return { limit: 10, windowMs: 15 * 60 * 1000 }
  if (pathname === '/api/signup') return { limit: 5, windowMs: 60 * 60 * 1000 }
  if (pathname === '/api/uploads/proof') return { limit: 20, windowMs: 60 * 60 * 1000 }
  if (pathname.includes('/comments')) return { limit: 40, windowMs: 10 * 60 * 1000 }
  if (pathname === '/api/reports') return { limit: 20, windowMs: 60 * 60 * 1000 }
  if (pathname.endsWith('/like') || pathname.endsWith('/save')) return { limit: 120, windowMs: 10 * 60 * 1000 }
  return { limit: 120, windowMs: 10 * 60 * 1000 }
}

const checkRateLimit = (req: NextRequest) => {
  const { limit, windowMs } = getLimit(req.nextUrl.pathname)
  const store = getStore()
  const now = Date.now()
  const key = req.method + ':' + req.nextUrl.pathname + ':' + getClientIp(req)
  const current = store.get(key)

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }

  if (current.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000))
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  current.count += 1
  store.set(key, current)
  return null
}

const checkSameOrigin = (req: NextRequest) => {
  const secFetchSite = req.headers.get('sec-fetch-site')
  if (secFetchSite === 'cross-site') {
    return NextResponse.json({ error: 'Cross-site request blocked' }, { status: 403 })
  }

  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')
  const expectedOrigin = req.nextUrl.origin

  if (origin && origin !== expectedOrigin) {
    return NextResponse.json({ error: 'Cross-site request blocked' }, { status: 403 })
  }

  if (!origin && referer) {
    try {
      if (new URL(referer).origin !== expectedOrigin) {
        return NextResponse.json({ error: 'Cross-site request blocked' }, { status: 403 })
      }
    } catch {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    }
  }

  return null
}

export function middleware(req: NextRequest) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return NextResponse.next()

  const csrfError = checkSameOrigin(req)
  if (csrfError) return csrfError

  const rateLimitError = checkRateLimit(req)
  if (rateLimitError) return rateLimitError

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*'
}
