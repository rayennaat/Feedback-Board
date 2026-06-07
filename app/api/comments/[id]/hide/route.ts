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
  const commentId = parseInt(idParam || '')
  if (isNaN(commentId)) return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 })

  const body = await req.json()
  const isHidden = Boolean(body.isHidden)
  const hiddenReason = typeof body.hiddenReason === 'string' ? body.hiddenReason.trim() : ''

  const comment = await prisma.comment.update({
    where: { id: commentId },
    data: { isHidden, hiddenReason: isHidden ? hiddenReason : '' }
  })

  return NextResponse.json({ id: comment.id, isHidden: comment.isHidden, hiddenReason: comment.hiddenReason })
}
