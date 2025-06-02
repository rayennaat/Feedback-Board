import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export async function POST(req: NextRequest) {
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
  } catch (err) {
  console.error('Error:', err);
  return NextResponse.json({ error: 'invalid token' }, { status: 500 });
}


  const url = new URL(req.url)
  const idParam = url.pathname.split('/').at(-2) // extract [id] from `/api/feedback/[id]/like`
  const feedbackId = parseInt(idParam || '')

  if (isNaN(feedbackId)) {
    return NextResponse.json({ error: 'Invalid feedback ID' }, { status: 400 })
  }

  const feedback = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    include: { likedBy: true },
  })

  if (!feedback) {
    return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
  }

  const alreadyLiked = feedback.likedBy.some((user) => user.id === userId)

  let updatedFeedback

  if (alreadyLiked) {
    // Unlike
    updatedFeedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        likes: { decrement: 1 },
        likedBy: {
          disconnect: { id: userId },
        },
      },
      include: {
        likedBy: true,
      },
    })
  } else {
    // Like
    updatedFeedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        likes: { increment: 1 },
        likedBy: {
          connect: { id: userId },
        },
      },
      include: {
        likedBy: true,
      },
    })
  }

  return NextResponse.json({
    message: alreadyLiked ? 'Unliked' : 'Liked',
    likes: updatedFeedback.likes,
    likedBy: updatedFeedback.likedBy.map((user) => user.id),
  })
}
