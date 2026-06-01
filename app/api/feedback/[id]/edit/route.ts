import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

interface JwtPayload {
  id: number
  username: string
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get('authToken')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let userId: number

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    userId = decoded.id
  } catch (err) {
    console.error('Token error:', err)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const url = new URL(req.url)
  const idParam = url.pathname.split('/').at(-2)
  const feedbackId = parseInt(idParam || '')

  if (isNaN(feedbackId)) {
    return NextResponse.json({ error: 'Invalid feedback ID' }, { status: 400 })
  }

  const { title, message } = await req.json()

  if (!title || !message) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const feedback = await prisma.feedback.findUnique({
    where: { id: feedbackId }
  })

  if (!feedback) {
    return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
  }

  if (feedback.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (feedback.status !== 'pending') {
    return NextResponse.json({ error: 'Only pending feedback can be edited' }, { status: 400 })
  }

  const updated = await prisma.feedback.update({
    where: { id: feedbackId },
    data: { title, message },
    include: {
      user: {
        select: { username: true }
      },
      likedBy: {
        select: { id: true }
      }
    }
  })

  return NextResponse.json({
    id: updated.id,
    title: updated.title,
    message: updated.message,
    likes: updated.likes,
    date: updated.date.toISOString(),
    user: updated.user.username,
    status: updated.status,
    isCurrentUser: true,
    likedByCurrentUser: updated.likedBy.some(user => user.id === userId)
  })
}
