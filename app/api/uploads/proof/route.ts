import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { assertSameOrigin, detectImageType, rateLimit, requireActiveUser } from '@/lib/security'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif'
}

export async function POST(req: NextRequest) {
  const csrfError = assertSameOrigin(req)
  if (csrfError) return csrfError

  const limited = rateLimit(req, 'upload-proof', 20, 60 * 60 * 1000)
  if (limited) return limited

  const auth = await requireActiveUser(req)
  if (!auth.ok) return auth.response

  const formData = await req.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Only JPG, PNG, WebP, or GIF images are allowed' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Image must be 5 MB or smaller' }, { status: 400 })
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  const detectedType = detectImageType(bytes)

  if (!detectedType || CONTENT_TYPES[detectedType] !== file.type) {
    return NextResponse.json({ error: 'Invalid image file' }, { status: 400 })
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'proofs')
  await mkdir(uploadsDir, { recursive: true })

  const filename = Date.now() + '-' + crypto.randomUUID() + '.' + detectedType
  await writeFile(path.join(uploadsDir, filename), bytes, { flag: 'wx' })

  const response = NextResponse.json({ url: '/uploads/proofs/' + filename })
  response.headers.set('X-Content-Type-Options', 'nosniff')
  return response
}
