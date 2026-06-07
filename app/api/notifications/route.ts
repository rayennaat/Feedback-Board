import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!
interface JwtPayload { id: number; username: string }

export async function GET(req: NextRequest) {
  const token = req.cookies.get('authToken')?.value
  if (!token) return NextResponse.json({ notifications: [], unreadCount: 0 })

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    const notifications = await prisma.notification.findMany({
      where: { userId: decoded.id },
      orderBy: { date: 'desc' },
      take: 30
    })

    return NextResponse.json({
      unreadCount: notifications.filter(item => !item.isRead).length,
      notifications: notifications.map(item => ({
        id: item.id,
        type: item.type,
        message: item.message,
        link: item.link,
        isRead: item.isRead,
        date: item.date.toISOString()
      }))
    })
  } catch {
    return NextResponse.json({ notifications: [], unreadCount: 0 })
  }
}
