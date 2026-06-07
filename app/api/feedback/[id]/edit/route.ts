import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

interface JwtPayload {
  id: number
  username: string
}

const trimValue = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
const sanitizeProofImageUrl = (value: unknown) => {
  const proofImageUrl = trimValue(value)
  return proofImageUrl.startsWith('/uploads/proofs/') ? proofImageUrl : ''
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get('authToken')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let userId: number

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    userId = decoded.id
  } catch (err) {
    console.error('Token error:', err)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const url = new URL(req.url)
  const idParam = url.pathname.split('/').at(-2)
  const feedbackId = parseInt(idParam || '')

  if (isNaN(feedbackId)) {
    return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 })
  }

  const body = await req.json()
  const title = trimValue(body.title)
  const message = trimValue(body.message)
  const category = trimValue(body.category)
  const subject = trimValue(body.subject)
  const city = trimValue(body.city)
  const experienceType = trimValue(body.experienceType)
  const isAnonymous = Boolean(body.isAnonymous)
  const proofImageUrl = sanitizeProofImageUrl(body.proofImageUrl)

  if (!title || !message || !category || !subject || !city || !experienceType) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isSuspended: true } })

  if (user?.isSuspended) {
    return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
  }

  const feedback = await prisma.feedback.findUnique({
    where: { id: feedbackId }
  })

  if (!feedback) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  if (feedback.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (feedback.status !== 'pending') {
    return NextResponse.json({ error: 'Only pending posts can be edited' }, { status: 400 })
  }

  const updated = await prisma.feedback.update({
    where: { id: feedbackId },
    data: { title, message, category, subject, city, experienceType, isAnonymous, proofImageUrl },
    include: {
      user: {
        select: { username: true }
      },
      likedBy: {
        select: { id: true }
      }
    }
  })

  return NextResponse.json({
    id: updated.id,
    title: updated.title,
    message: updated.message,
    category: updated.category,
    subject: updated.subject,
    city: updated.city,
    experienceType: updated.experienceType,
    isAnonymous: updated.isAnonymous,
    proofImageUrl: updated.proofImageUrl,
    likes: updated.likes,
    date: updated.date.toISOString(),
    user: updated.isAnonymous ? 'Anonymous' : updated.user.username,
    status: updated.status,
    isCurrentUser: true,
    likedByCurrentUser: updated.likedBy.some(user => user.id === userId)
  })
}
