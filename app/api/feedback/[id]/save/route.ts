import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireActiveUser } from '@/lib/security'

const getFeedbackId = (req: NextRequest) => {
  const url = new URL(req.url)
  const idParam = url.pathname.split('/').at(-2)
  return parseInt(idParam || '')
}

export async function POST(req: NextRequest) {
  const auth = await requireActiveUser(req)
  if (!auth.ok) return auth.response

  const feedbackId = getFeedbackId(req)
  if (isNaN(feedbackId)) return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 })

  try {
    const user = await prisma.user.findUnique({ where: { id: auth.user.id }, include: { saved: { select: { id: true } } } })
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const post = await prisma.feedback.findUnique({ where: { id: feedbackId }, select: { status: true } })
    if (!post || post.status !== 'approved') return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    const alreadySaved = user.saved.some(post => post.id === feedbackId)
    await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        saved: alreadySaved ? { disconnect: { id: feedbackId } } : { connect: { id: feedbackId } }
      }
    })

    return NextResponse.json({ saved: !alreadySaved })
  } catch (err) {
    console.error('Save post error:', err)
    return NextResponse.json({ error: 'Failed to save post' }, { status: 500 })
  }
}
