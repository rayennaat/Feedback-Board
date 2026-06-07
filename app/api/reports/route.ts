import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

interface JwtPayload {
  id: number
  username: string
}

const trimValue = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

export async function POST(req: NextRequest) {
  const token = req.cookies.get('authToken')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let reporterId: number
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    reporterId = decoded.id
  } catch (err) {
    console.error('Token error:', err)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { id: reporterId } })
  if (user?.isSuspended) {
    return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
  }

  const body = await req.json()
  const targetType = body.targetType
  const targetId = Number(body.targetId)
  const reason = trimValue(body.reason)
  const details = trimValue(body.details)

  if ((targetType !== 'feedback' && targetType !== 'comment') || !Number.isInteger(targetId) || !reason) {
    return NextResponse.json({ error: 'Missing report fields' }, { status: 400 })
  }

  if (targetType === 'feedback') {
    const feedback = await prisma.feedback.findUnique({ where: { id: targetId } })
    if (!feedback) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    const report = await prisma.report.create({
      data: {
        targetType,
        reason,
        details,
        reporter: { connect: { id: reporterId } },
        feedback: { connect: { id: targetId } }
      }
    })

    return NextResponse.json({ id: report.id, message: 'Report submitted' })
  }

  const comment = await prisma.comment.findUnique({ where: { id: targetId } })
  if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })

  const report = await prisma.report.create({
    data: {
      targetType,
      reason,
      details,
      reporter: { connect: { id: reporterId } },
      comment: { connect: { id: targetId } }
    }
  })

  return NextResponse.json({ id: report.id, message: 'Report submitted' })
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('authToken')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    const user = await prisma.user.findUnique({ where: { id: decoded.id } })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const reports = await prisma.report.findMany({
      orderBy: { date: 'desc' },
      include: {
        reporter: { select: { username: true } },
        feedback: {
          select: {
            id: true,
            title: true,
            subject: true,
            category: true,
            status: true,
            reports: { select: { id: true } },
            user: { select: { id: true, username: true, email: true, isSuspended: true } },
            isAnonymous: true,
            moderationReason: true,
            adminNote: true
          }
        },
        comment: {
          select: {
            id: true,
            message: true,
            feedbackId: true,
            isHidden: true,
            hiddenReason: true,
            user: { select: { id: true, username: true, email: true, isSuspended: true } },
            reports: { select: { id: true } },
            feedback: {
              select: {
                id: true,
                title: true,
                subject: true,
                category: true,
                status: true,
                reports: { select: { id: true } },
                user: { select: { id: true, username: true, email: true, isSuspended: true } },
                isAnonymous: true,
                moderationReason: true,
                adminNote: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(reports.map(report => ({
      id: report.id,
      reason: report.reason,
      details: report.details,
      targetType: report.targetType,
      status: report.status,
      date: report.date.toISOString(),
      reporter: report.reporter.username,
      feedback: report.feedback ? {
        ...report.feedback,
        reportsCount: report.feedback.reports.length,
        authorId: report.feedback.user.id,
        authorUsername: report.feedback.user.username,
        authorEmail: report.feedback.user.email,
        authorIsSuspended: report.feedback.user.isSuspended,
        reports: undefined,
        user: undefined
      } : null,
      comment: report.comment ? {
        id: report.comment.id,
        message: report.comment.message,
        feedbackId: report.comment.feedbackId,
        isHidden: report.comment.isHidden,
        hiddenReason: report.comment.hiddenReason,
        reportsCount: report.comment.reports.length,
        authorId: report.comment.user.id,
        authorUsername: report.comment.user.username,
        authorEmail: report.comment.user.email,
        authorIsSuspended: report.comment.user.isSuspended,
        feedback: report.comment.feedback ? {
          ...report.comment.feedback,
          reportsCount: report.comment.feedback.reports.length,
          authorId: report.comment.feedback.user.id,
          authorUsername: report.comment.feedback.user.username,
          authorEmail: report.comment.feedback.user.email,
          authorIsSuspended: report.comment.feedback.user.isSuspended,
          reports: undefined,
          user: undefined
        } : undefined
      } : null
    })))
  } catch (err) {
    console.error('Fetch reports error:', err)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
