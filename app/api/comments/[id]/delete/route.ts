import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

interface JwtPayload {
  id: number
  username: string
}

export async function DELETE(req: NextRequest) {
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
  const commentId = parseInt(idParam || '')

  if (isNaN(commentId)) {
    return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  const comment = await prisma.comment.findUnique({ where: { id: commentId } })

  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  }

  if (!user?.isAdmin && comment.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.comment.delete({ where: { id: commentId } })

  return NextResponse.json({ message: 'Comment deleted' })
}
