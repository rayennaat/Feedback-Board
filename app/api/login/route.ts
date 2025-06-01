import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(req: Request) {
  const { email, password } = await req.json()

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  // ✅ Create JWT token
  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET!, // Make sure this is defined in .env
    { expiresIn: '7d' }
  )

  // ✅ Set token as cookie
  const response = NextResponse.json(
    { message: 'Login successful', user: { id: user.id, username: user.username, email: user.email, isAdmin: user.isAdmin } }
  )
  response.cookies.set('authToken', token, {
    httpOnly: false, // 🔒 In production, make this `true`
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  return response
}
