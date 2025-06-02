import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get('authToken')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
interface JwtPayload {
  id: number;
  username: string;
  // add other properties if needed
}

const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.id;

    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const idParam = segments.length >= 3 ? segments[segments.length - 2] : null;

    const feedbackId = parseInt(idParam || '');
    if (isNaN(feedbackId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete logic based on admin status
    if (user.isAdmin) {
      await prisma.feedback.delete({ where: { id: feedbackId } });
      return NextResponse.json({ message: 'Feedback deleted (admin)' });
    }

    await prisma.feedback.delete({
      where: {
        id: feedbackId,
        userId,
      },
    });

    return NextResponse.json({ message: 'Feedback deleted (owner)' });
  } catch (err) {
    console.error('Delete error:', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
