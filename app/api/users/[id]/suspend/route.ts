import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/security'

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  const url = new URL(req.url)
  const idParam = url.pathname.split('/').at(-2)
  const targetUserId = parseInt(idParam || '')
  if (isNaN(targetUserId)) return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
  if (targetUserId === auth.user.id) return NextResponse.json({ error: 'You cannot suspend yourself' }, { status: 400 })

  const { isSuspended } = await req.json()
  const user = await prisma.user.update({
    where: { id: targetUserId },
    data: { isSuspended: Boolean(isSuspended) },
    select: { id: true, username: true, isSuspended: true }
  })

  return NextResponse.json(user)
}
