import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get('authToken')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let userId: number
  try {
interface JwtPayload {
  id: number;
  username: string;
  // add other properties if needed
}

const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    userId = decoded.id
  } catch (err) {
  console.error('Error:', err);
  return NextResponse.json({ error: 'Invalid Token' }, { status: 500 });
}


  const url = new URL(req.url)
  const idParam = url.pathname.split('/').at(-2)
  const feedbackId = parseInt(idParam || '')

  if (isNaN(feedbackId)) {
    return NextResponse.json({ error: 'Invalid feedback ID' }, { status: 400 })
  }

  const { status } = await req.json()
  const allowedStatuses = ['pending', 'approved', 'rejected']

  if (!allowedStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  try {
    const updated = await prisma.feedback.update({
      where: { id: feedbackId },
      data: { status },
    })

    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json({ error: 'Feedback not found or update failed' }, { status: 500 })
  }
}
