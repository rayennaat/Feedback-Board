import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!
const allowedStatuses = ['open', 'reviewed', 'dismissed'] as const

type ReportStatus = (typeof allowedStatuses)[number]

interface JwtPayload {
  id: number
  username: string
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

  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (!user?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(req.url)
  const idParam = url.pathname.split('/').at(-2)
  const reportId = parseInt(idParam || '')

  if (isNaN(reportId)) {
    return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 })
  }

  const { status } = await req.json()

  if (!allowedStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const report = await prisma.report.update({
    where: { id: reportId },
    data: { status: status as ReportStatus }
  })

  return NextResponse.json({
    id: report.id,
    status: report.status
  })
}
