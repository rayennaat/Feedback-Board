import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

interface JwtPayload {
  id: number
  username: string
}

const getFeedbackId = (req: NextRequest) => {
  const url = new URL(req.url)
  const idParam = url.pathname.split('/').at(-1)
  return parseInt(idParam || '')
}

const getCurrentUserId = (req: NextRequest) => {
  const token = req.cookies.get('authToken')?.value
  if (!token) return null

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    return decoded.id
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const feedbackId = getFeedbackId(req)

  if (isNaN(feedbackId)) {
    return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 })
  }

  const currentUserId = getCurrentUserId(req)

  const feedback = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    include: {
      user: { select: { id: true, username: true, isAdmin: true } },
      likedBy: { select: { id: true } },
      savedBy: { select: { id: true } },
      _count: { select: { comments: true } }
    }
  })

  if (!feedback) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  let currentUserIsAdmin = false
  if (currentUserId) {
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { isAdmin: true }
    })
    currentUserIsAdmin = Boolean(currentUser?.isAdmin)
  }

  const canView = feedback.status === 'approved' || feedback.userId === currentUserId || currentUserIsAdmin

  if (!canView) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: feedback.id,
    title: feedback.title,
    message: feedback.message,
    category: feedback.category,
    subject: feedback.subject,
    city: feedback.city,
    experienceType: feedback.experienceType,
    isAnonymous: feedback.isAnonymous,
    likes: feedback.likes,
    commentsCount: feedback._count.comments,
    date: feedback.date.toISOString(),
    user: feedback.isAnonymous ? 'Anonymous' : feedback.user.username,
    userId: feedback.user.id,
    status: feedback.status,
    isCurrentUser: currentUserId === feedback.user.id,
    likedByCurrentUser: currentUserId ? feedback.likedBy.some(user => user.id === currentUserId) : false,
    savedByCurrentUser: currentUserId ? feedback.savedBy.some(user => user.id === currentUserId) : false,
    moderationReason: feedback.moderationReason
  })
}
