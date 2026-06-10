import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET

export interface AuthPayload {
  id: number
  username: string
}

export type AuthUser = {
  id: number
  username: string
  email: string
  isAdmin: boolean
  isSuspended: boolean
}

export type AuthResult =
  | { ok: true; user: AuthUser; payload: AuthPayload }
  | { ok: false; response: NextResponse }

const rateLimitStore = globalThis as typeof globalThis & {
  __feedbackTnRateLimits?: Map<string, { count: number; resetAt: number }>
}

const getRateLimitStore = () => {
  if (!rateLimitStore.__feedbackTnRateLimits) rateLimitStore.__feedbackTnRateLimits = new Map()
  return rateLimitStore.__feedbackTnRateLimits
}

export const getClientIp = (req: NextRequest) => {
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() || 'unknown'
  return req.headers.get('x-real-ip') || 'unknown'
}

export const rateLimit = (req: NextRequest, key: string, limit: number, windowMs: number) => {
  const store = getRateLimitStore()
  const now = Date.now()
  const ip = getClientIp(req)
  const rateKey = key + ':' + ip
  const current = store.get(rateKey)

  if (!current || current.resetAt <= now) {
    store.set(rateKey, { count: 1, resetAt: now + windowMs })
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
  store.set(rateKey, current)
  return null
}

export const assertSameOrigin = (req: NextRequest) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return null

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

export const getAuthPayload = (req: NextRequest): AuthPayload | null => {
  const token = req.cookies.get('authToken')?.value
  if (!token || !JWT_SECRET) return null

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as Partial<AuthPayload>
    const id = decoded.id
    const username = decoded.username
    if (!Number.isInteger(id) || typeof username !== 'string') return null
    return { id: id as number, username }
  } catch {
    return null
  }
}

export const requireUser = async (req: NextRequest): Promise<AuthResult> => {
  const payload = getAuthPayload(req)
  if (!payload) return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, username: true, email: true, isAdmin: true, isSuspended: true }
  })

  if (!user) return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  return { ok: true, user, payload }
}

export const requireActiveUser = async (req: NextRequest): Promise<AuthResult> => {
  const auth = await requireUser(req)
  if (!auth.ok) return auth
  if (auth.user.isSuspended) {
    return { ok: false, response: NextResponse.json({ error: 'Account suspended' }, { status: 403 }) }
  }
  return auth
}

export const requireAdmin = async (req: NextRequest): Promise<AuthResult> => {
  const auth = await requireUser(req)
  if (!auth.ok) return auth
  if (!auth.user.isAdmin) return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return auth
}

export type DetectedImageType = 'jpg' | 'png' | 'webp' | 'gif'

export const detectImageType = (bytes: Buffer): DetectedImageType | null => {
  if (bytes.length < 12) return null

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg'

  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) return 'png'

  const header = bytes.subarray(0, 12).toString('ascii')
  if (header.startsWith('RIFF') && header.slice(8, 12) === 'WEBP') return 'webp'
  if (header.startsWith('GIF87a') || header.startsWith('GIF89a')) return 'gif'

  return null
}
