import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET!
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
}

interface JwtPayload { id: number; username: string }

export async function POST(req: NextRequest) {
  const token = req.cookies.get('authToken')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let userId: number
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    userId = decoded.id
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isSuspended: true } })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.isSuspended) return NextResponse.json({ error: 'Account suspended' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
  }

  const extension = ALLOWED_TYPES[file.type]
  if (!extension) {
    return NextResponse.json({ error: 'Only JPG, PNG, WebP, or GIF images are allowed' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Image must be 5 MB or smaller' }, { status: 400 })
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'proofs')
  await mkdir(uploadsDir, { recursive: true })

  const filename = `${Date.now()}-${crypto.randomUUID()}.${extension}`
  await writeFile(path.join(uploadsDir, filename), bytes)

  return NextResponse.json({ url: `/uploads/proofs/${filename}` })
}
