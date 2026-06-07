import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

interface JwtPayload { id: number; username: string }

const getFeedbackId = (req: NextRequest) => {
  const url = new URL(req.url)
  const idParam = url.pathname.split('/').at(-2)
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

const formatComment = (comment: {
  id: number
  message: string
  date: Date
  isAnonymous: boolean
  isHidden: boolean
  hiddenReason: string
  parentId: number | null
  userId: number
  user: { username: string }
}, currentUserId: number | null, canSeeHidden = false) => ({
  id: comment.id,
  parentId: comment.parentId,
  message: comment.isHidden && !canSeeHidden ? 'This comment was hidden by moderation.' : comment.message,
  date: comment.date.toISOString(),
  isAnonymous: comment.isAnonymous,
  isHidden: comment.isHidden,
  hiddenReason: canSeeHidden ? comment.hiddenReason : '',
  user: comment.isAnonymous ? 'Anonymous' : comment.user.username,
  isCurrentUser: currentUserId === comment.userId
})

export async function GET(req: NextRequest) {
  const feedbackId = getFeedbackId(req)
  if (isNaN(feedbackId)) return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 })

  const currentUserId = getCurrentUserId(req)
  const currentUser = currentUserId ? await prisma.user.findUnique({ where: { id: currentUserId } }) : null
  const canSeeHidden = Boolean(currentUser?.isAdmin)

  const comments = await prisma.comment.findMany({
    where: {
      feedbackId,
      feedback: { status: 'approved' },
      ...(canSeeHidden ? {} : { isHidden: false })
    },
    orderBy: { date: 'asc' },
    include: { user: { select: { username: true } } }
  })

  return NextResponse.json(comments.map(comment => formatComment(comment, currentUserId, canSeeHidden)))
}

export async function POST(req: NextRequest) {
  const feedbackId = getFeedbackId(req)
  if (isNaN(feedbackId)) return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 })

  const token = req.cookies.get('authToken')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let userId: number
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    userId = decoded.id
  } catch (err) {
    console.error('Token error:', err)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user?.isSuspended) return NextResponse.json({ error: 'Account suspended' }, { status: 403 })

  const body = await req.json()
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const isAnonymous = Boolean(body.isAnonymous)
  const parentId = body.parentId === undefined || body.parentId === null ? null : Number(body.parentId)
  if (!message) return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 })
  if (parentId !== null && !Number.isInteger(parentId)) return NextResponse.json({ error: 'Invalid parent reply ID' }, { status: 400 })

  const feedback = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    include: {
      comments: { where: { isHidden: false }, select: { userId: true } }
    }
  })

  if (!feedback || feedback.status !== 'approved') return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  const parentComment = parentId === null ? null : await prisma.comment.findFirst({
    where: {
      id: parentId,
      feedbackId,
      isHidden: false
    },
    select: {
      id: true,
      userId: true,
      user: { select: { username: true } }
    }
  })

  if (parentId !== null && !parentComment) {
    return NextResponse.json({ error: 'Parent reply not found' }, { status: 404 })
  }

  const comment = await prisma.comment.create({
    data: {
      message,
      isAnonymous,
      ...(parentId === null ? {} : { parent: { connect: { id: parentId } } }),
      feedback: { connect: { id: feedbackId } },
      user: { connect: { id: userId } }
    },
    include: { user: { select: { username: true } } }
  })

  const notifyUserIds = new Set<number>()
  if (feedback.userId !== userId) notifyUserIds.add(feedback.userId)
  if (parentComment && parentComment.userId !== userId) notifyUserIds.add(parentComment.userId)
  feedback.comments.forEach(existingComment => {
    if (existingComment.userId !== userId) notifyUserIds.add(existingComment.userId)
  })

  if (notifyUserIds.size > 0) {
    await prisma.notification.createMany({
      data: Array.from(notifyUserIds).map(targetUserId => ({
        userId: targetUserId,
        type: targetUserId === feedback.userId ? 'comment' : 'reply',
        message: parentComment && targetUserId === parentComment.userId
          ? `New reply to your reply: ${feedback.title}`
          : targetUserId === feedback.userId
            ? `New reply on your post: ${feedback.title}`
            : `New reply in a discussion: ${feedback.title}`,
        link: `/post/${feedback.id}`
      }))
    })
  }

  return NextResponse.json(formatComment(comment, userId))
}
