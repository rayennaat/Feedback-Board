// app/api/feedback/[id]/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get('authToken')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If user is admin, delete without checking ownership
    if (user.isAdmin) {
      await prisma.feedback.delete({
        where: {
          id: parseInt(params.id)
        }
      });
      return NextResponse.json({ message: 'Feedback deleted successfully' });
    }

    // For regular users, check ownership
    await prisma.feedback.delete({
      where: {
        id: parseInt(params.id),
        userId
      }
    });

    return NextResponse.json({ message: 'Feedback deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    return NextResponse.json(
      { error: 'Feedback not found or delete failed' }, 
      { status: 500 }
    );
  }
}