import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!
interface JwtPayload { id: number; username: string }

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get('authToken')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
  await prisma.notification.updateMany({ where: { userId: decoded.id, isRead: false }, data: { isRead: true } })
  return NextResponse.json({ message: 'Notifications marked read' })
}
