import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!
interface JwtPayload { id: number; username: string }

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get('authToken')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
  const admin = await prisma.user.findUnique({ where: { id: decoded.id } })
  if (!admin?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url = new URL(req.url)
  const idParam = url.pathname.split('/').at(-2)
  const targetUserId = parseInt(idParam || '')
  if (isNaN(targetUserId)) return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
  if (targetUserId === decoded.id) return NextResponse.json({ error: 'You cannot suspend yourself' }, { status: 400 })

  const { isSuspended } = await req.json()
  const user = await prisma.user.update({
    where: { id: targetUserId },
    data: { isSuspended: Boolean(isSuspended) },
    select: { id: true, username: true, isSuspended: true }
  })

  return NextResponse.json(user)
}
