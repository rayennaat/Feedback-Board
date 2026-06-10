import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/security'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  try {
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
