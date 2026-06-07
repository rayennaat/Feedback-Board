import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!
interface JwtPayload { id: number; username: string }

export async function POST(req: NextRequest) {
  const token = req.cookies.get('authToken')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let userId: number
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    userId = decoded.id
  } catch (err) {
    console.error('Error:', err)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user?.isSuspended) return NextResponse.json({ error: 'Account suspended' }, { status: 403 })

  const url = new URL(req.url)
  const idParam = url.pathname.split('/').at(-2)
  const feedbackId = parseInt(idParam || '')
  if (isNaN(feedbackId)) return NextResponse.json({ error: 'Invalid feedback ID' }, { status: 400 })

  const feedback = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    include: { likedBy: true }
  })

  if (!feedback || feedback.status !== 'approved') return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })

  const alreadyLiked = feedback.likedBy.some(user => user.id === userId)
  const updatedFeedback = await prisma.feedback.update({
    where: { id: feedbackId },
    data: alreadyLiked
      ? { likes: { decrement: 1 }, likedBy: { disconnect: { id: userId } } }
      : { likes: { increment: 1 }, likedBy: { connect: { id: userId } } },
    include: { likedBy: true }
  })

  return NextResponse.json({
    message: alreadyLiked ? 'Unliked' : 'Liked',
    likes: updatedFeedback.likes,
    likedBy: updatedFeedback.likedBy.map(user => user.id)
  })
}
