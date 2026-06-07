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
    const admin = await prisma.user.findUnique({ where: { id: decoded.id } })

    if (!admin?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        isAdmin: true,
        isSuspended: true,
        _count: {
          select: {
            feedbacks: true,
            comments: true,
            reports: true
          }
        }
      }
    })

    return NextResponse.json(users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      isAdmin: user.isAdmin,
      isSuspended: user.isSuspended,
      postsCount: user._count.feedbacks,
      commentsCount: user._count.comments,
      reportsCount: user._count.reports
    })))
  } catch (err) {
    console.error('Fetch users error:', err)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
