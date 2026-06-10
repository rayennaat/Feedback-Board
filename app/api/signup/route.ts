import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { Prisma } from '@/app/generated/prisma'
import { assertSameOrigin, rateLimit } from '@/lib/security'

const normalizeText = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

export async function POST(req: NextRequest) {
  const csrfError = assertSameOrigin(req)
  if (csrfError) return csrfError

  const limited = rateLimit(req, 'signup', 5, 60 * 60 * 1000)
  if (limited) return limited

  const body = await req.json()
  const username = normalizeText(body.username)
  const email = normalizeText(body.email).toLowerCase()
  const password = typeof body.password === 'string' ? body.password : ''

  if (!username || !email || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
    return NextResponse.json({ error: 'Username must be 3-24 letters, numbers, or underscores' }, { status: 400 })
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  if (password.length < 10) {
    return NextResponse.json({ error: 'Password must be at least 10 characters' }, { status: 400 })
  }

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true, username: true }
  })

  if (existingUser?.email === email) {
    return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
  }

  if (existingUser?.username === username) {
    return NextResponse.json({ error: 'Username already exists' }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword },
      select: { id: true, username: true, email: true }
    })

    return NextResponse.json({ message: 'User created', user })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    console.error('Signup error:', err)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
