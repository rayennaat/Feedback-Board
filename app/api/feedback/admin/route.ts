import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/security'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  try {
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
      proofImageUrl: item.proofImageUrl,
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
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}
