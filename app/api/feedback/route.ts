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

// POST: Submit a public experience post
export async function POST(req: NextRequest) {
  const body = await req.json()
  const title = trimValue(body.title)
  const message = trimValue(body.message)
  const category = trimValue(body.category)
  const subject = trimValue(body.subject)
  const city = trimValue(body.city)
  const experienceType = trimValue(body.experienceType)
  const isAnonymous = Boolean(body.isAnonymous)
  const proofImageUrl = sanitizeProofImageUrl(body.proofImageUrl)

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

  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (user?.isSuspended) {
    return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
  }

  if (!title || !message || !category || !subject || !city || !experienceType) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const newFeedback = await prisma.feedback.create({
    data: {
      title,
      message,
      category,
      subject,
      city,
      experienceType,
      isAnonymous,
      proofImageUrl,
      user: {
        connect: { id: userId }
      }
    },
    include: {
      user: true
    }
  })

  return NextResponse.json({
    id: newFeedback.id,
    title: newFeedback.title,
    message: newFeedback.message,
    category: newFeedback.category,
    subject: newFeedback.subject,
    city: newFeedback.city,
    experienceType: newFeedback.experienceType,
    isAnonymous: newFeedback.isAnonymous,
    proofImageUrl: newFeedback.proofImageUrl,
    likes: newFeedback.likes,
    date: newFeedback.date.toISOString(),
    user: newFeedback.isAnonymous ? 'Anonymous' : newFeedback.user.username,
    userId: newFeedback.userId,
    status: newFeedback.status,
    isCurrentUser: true,
    likedByCurrentUser: false
  })
}

// GET: Fetch all approved experience posts
export async function GET(req: NextRequest) {
  const token = req.cookies.get('authToken')?.value
  let currentUserId: number | null = null

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
      currentUserId = decoded.id
    } catch (err) {
      console.error('Token decode error:', err)
      currentUserId = null
    }
  }

  try {
    const feedback = await prisma.feedback.findMany({
      where: { status: 'approved' },
      orderBy: { date: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, email: true }
        },
        likedBy: {
          select: { id: true }
        },
        savedBy: {
          select: { id: true }
        },
        _count: {
          select: { comments: true }
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
      date: item.date.toISOString(),
      user: item.isAnonymous ? 'Anonymous' : item.user.username,
      userId: item.user.id,
      isCurrentUser: currentUserId === item.user.id,
      likedByCurrentUser: currentUserId
        ? item.likedBy.some(user => user.id === currentUserId)
        : false,
      savedByCurrentUser: currentUserId
        ? item.savedBy.some(user => user.id === currentUserId)
        : false
    }))

    return NextResponse.json(formatted)
  } catch (err) {
    console.error('Fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}
