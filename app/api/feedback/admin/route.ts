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

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const feedback = await prisma.feedback.findMany({
      orderBy: { date: 'desc' },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
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
      status: item.status
    }))

    return NextResponse.json(formatted)
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    )
  }
}
