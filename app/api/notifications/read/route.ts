import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/security'

export async function PATCH(req: NextRequest) {
  const auth = await requireUser(req)
  if (!auth.ok) return auth.response

  await prisma.notification.updateMany({ where: { userId: auth.user.id, isRead: false }, data: { isRead: true } })
  return NextResponse.json({ message: 'Notifications marked read' })
}
