import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

interface JwtPayload {
  id: number
  username: string
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('authToken')?.value

  if (!token) {
    return NextResponse.json({ user: null })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        email: true,
        isAdmin: true,
        isSuspended: true
      }
    })

    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ user: null })
  }
}
