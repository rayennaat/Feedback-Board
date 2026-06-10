import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { assertSameOrigin, rateLimit } from '@/lib/security'

const JWT_SECRET = process.env.JWT_SECRET!

export async function POST(req: NextRequest) {
  const csrfError = assertSameOrigin(req)
  if (csrfError) return csrfError

  const limited = rateLimit(req, 'login', 8, 15 * 60 * 1000)
  if (limited) return limited

  const { email, password } = await req.json()

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  )

  const response = NextResponse.json({
    message: 'Login successful',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin
    }
  })

  response.cookies.set('authToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  })

  return response
}
