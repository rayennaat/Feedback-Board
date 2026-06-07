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
            id: true,
            username: true,
            email: true,
            isSuspended: true
          }
        },
        _count: {
          select: { comments: true, reports: true }
        }
      }
    })

    const formatted = feedback.map(item => ({
      id: item.id,
      title: item.title,
      message: item.message,
      category: item.category,
      subject: item.subject,
      city: item.city,
      experienceType: item.experienceType,
      isAnonymous: item.isAnonymous,
      likes: item.likes,
      commentsCount: item._count.comments,
      reportsCount: item._count.reports,
      date: item.date.toISOString(),
      user: item.isAnonymous ? 'Anonymous' : item.user.username,
      authorId: item.user.id,
      authorUsername: item.user.username,
      authorEmail: item.user.email,
      authorIsSuspended: item.user.isSuspended,
      status: item.status,
      moderationReason: item.moderationReason,
      adminNote: item.adminNote
    }))

    return NextResponse.json(formatted)
  } catch (err) {
    console.error('Admin fetch error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}
