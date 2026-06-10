import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/security'

export async function GET(req: NextRequest) {
  const auth = await requireUser(req)
  if (!auth.ok) return auth.response

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      include: {
        saved: {
          where: { status: 'approved' },
          orderBy: { date: 'desc' },
          include: {
            user: { select: { id: true, username: true } },
            likedBy: { select: { id: true } },
            savedBy: { select: { id: true } },
            _count: { select: { comments: true } }
          }
        }
      }
    })

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    return NextResponse.json(user.saved.map(item => ({
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
      date: item.date.toISOString(),
      user: item.isAnonymous ? 'Anonymous' : item.user.username,
      userId: item.user.id,
      isCurrentUser: auth.user.id === item.user.id,
      likedByCurrentUser: item.likedBy.some(user => user.id === auth.user.id),
      savedByCurrentUser: item.savedBy.some(user => user.id === auth.user.id)
    })))
  } catch (err) {
    console.error('Fetch saved posts error:', err)
    return NextResponse.json({ error: 'Failed to fetch saved posts' }, { status: 500 })
  }
}
