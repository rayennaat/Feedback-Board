import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

interface JwtPayload { id: number; username: string }

const getIds = (req: NextRequest) => {
  const token = req.cookies.get('authToken')?.value
  if (!token) return null
  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
  const url = new URL(req.url)
  const idParam = url.pathname.split('/').at(-2)
  return { userId: decoded.id, feedbackId: parseInt(idParam || '') }
}

export async function POST(req: NextRequest) {
  try {
    const ids = getIds(req)
    if (!ids) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (isNaN(ids.feedbackId)) return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { id: ids.userId }, include: { saved: { select: { id: true } } } })
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (user.isSuspended) return NextResponse.json({ error: 'Account suspended' }, { status: 403 })

    const post = await prisma.feedback.findUnique({ where: { id: ids.feedbackId }, select: { status: true } })
    if (!post || post.status !== 'approved') return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    const alreadySaved = user.saved.some(post => post.id === ids.feedbackId)
    await prisma.user.update({
      where: { id: ids.userId },
      data: {
        saved: alreadySaved ? { disconnect: { id: ids.feedbackId } } : { connect: { id: ids.feedbackId } }
      }
    })

    return NextResponse.json({ saved: !alreadySaved })
  } catch (err) {
    console.error('Save post error:', err)
    return NextResponse.json({ error: 'Failed to save post' }, { status: 500 })
  }
}
