import { NextRequest, NextResponse } from 'next/server'
import { assertSameOrigin } from '@/lib/security'

export async function POST(req: NextRequest) {
  const csrfError = assertSameOrigin(req)
  if (csrfError) return csrfError

  const response = NextResponse.json({ message: 'Logged out' })

  response.cookies.set('authToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  return response
}
