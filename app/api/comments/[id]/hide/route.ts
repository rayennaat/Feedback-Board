import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/security'

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

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
