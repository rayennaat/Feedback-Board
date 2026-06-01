import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

interface JwtPayload {
  id: number
  username: string
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('authToken')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let userId: number

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    userId = decoded.id
  } catch (err) {
    console.error('Token decode error:', err)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  try {
    const feedback = await prisma.feedback.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      include: {
        user: {
          select: { username: true }
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
      status: item.status,
      isCurrentUser: true,
      likedByCurrentUser: item.likedBy.some(user => user.id === userId)
    }))

    return NextResponse.json(formatted)
  } catch (err) {
    console.error('Fetch user feedback error:', err)
    return NextResponse.json({ error: 'Failed to fetch your feedback' }, { status: 500 })
  }
}
