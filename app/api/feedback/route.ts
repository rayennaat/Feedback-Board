import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

// POST: Submit feedback
export async function POST(req: NextRequest) {
  const { title, message } = await req.json()

  const token = req.cookies.get('authToken')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let userId: number
  try {
interface JwtPayload {
  id: number;
  username: string;
  // add other properties if needed
}

const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    userId = decoded.id
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  if (!title || !message) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const newFeedback = await prisma.feedback.create({
    data: {
      title,
      message,
      user: {
        connect: { id: userId }
      }
    },
    include: {
      user: true
    }
  })

  return NextResponse.json(newFeedback)
}

// GET: Fetch all approved feedback
export async function GET(req: NextRequest) {
  const token = req.cookies.get('authToken')?.value
  let currentUserId: number | null = null

  if (token) {
    try {
interface JwtPayload {
  id: number;
  username: string;
  // add other properties if needed
}

const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      currentUserId = decoded.id
    } catch {
      currentUserId = null
    }
  }

  try {
    const feedback = await prisma.feedback.findMany({
      where: { status: 'approved' },
      orderBy: { date: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, email: true }
        },
        likedBy: {
          select: { id: true }
        }
      }
    })

    const formatted = feedback.map(item => ({
      id: item.id,
      title: item.title,
      message: item.message,
      likes: item.likes,
      date: item.date.toISOString(),
      user: item.user.username,
      userId: item.user.id,
      isCurrentUser: currentUserId === item.user.id,
      likedByCurrentUser: currentUserId
        ? item.likedBy.some(user => user.id === currentUserId)
        : false
    }))

    return NextResponse.json(formatted)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
  }
}
