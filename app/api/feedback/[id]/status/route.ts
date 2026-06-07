import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

interface JwtPayload { id: number; username: string }

const allowedStatuses = ['pending', 'approved', 'rejected'] as const
type FeedbackStatus = (typeof allowedStatuses)[number]

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get('authToken')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let userId: number
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    userId = decoded.id
  } catch (err) {
    console.error('Token verification failed:', err)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url = new URL(req.url)
  const idParam = url.pathname.split('/').at(-2)
  const feedbackId = parseInt(idParam || '')
  if (isNaN(feedbackId)) return NextResponse.json({ error: 'Invalid feedback ID' }, { status: 400 })

  const body = await req.json()
  const status = body.status
  const moderationReason = typeof body.moderationReason === 'string' ? body.moderationReason.trim() : ''
  const adminNote = typeof body.adminNote === 'string' ? body.adminNote.trim() : ''

  if (!allowedStatuses.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

  try {
    const updated = await prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        status: status as FeedbackStatus,
        moderationReason: status === 'rejected' ? moderationReason : '',
        adminNote
      }
    })

    await prisma.notification.create({
      data: {
        userId: updated.userId,
        type: 'status',
        message: status === 'approved'
          ? `Your post was approved: ${updated.title}`
          : status === 'rejected'
            ? `Your post was hidden: ${updated.title}${moderationReason ? ` - ${moderationReason}` : ''}`
            : `Your post was moved back to pending: ${updated.title}`,
        link: `/post/${updated.id}`
      }
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('Update failed:', err)
    return NextResponse.json({ error: 'Feedback not found or update failed' }, { status: 500 })
  }
}
