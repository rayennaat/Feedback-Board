import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

// POST: Submit feedback
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, message } = body;

  const token = req.cookies.get('authToken')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let userId: number;
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    userId = decoded.id;
  } catch (err) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  if (!title || !message) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const newFeedback = await prisma.feedback.create({
    data: {
      title,
      message,
      user: {
        connect: { id: userId }
      }
    },
    include: {
      user: true // to get user name
    }
  });

  return NextResponse.json(newFeedback);
}

// GET: Fetch all approved feedback
export async function GET(req: NextRequest) {
  const token = req.cookies.get('authToken')?.value;
  let currentUserId: number | null = null;

  if (token) {
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      currentUserId = decoded.id;
    } catch (err) {
      currentUserId = null;
    }
  }

  try {
    const feedback = await prisma.feedback.findMany({
      where: {
        status: 'approved' // Only show approved feedback to regular users
      },
      orderBy: { date: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        likedBy: {
          select: {
            id: true // Also include this for likedBy
          }
        }
      }
    });

    const formatted = feedback.map(item => ({
      id: item.id,
      title: item.title,
      message: item.message,
      likes: item.likes,
      date: item.date.toISOString(),
      user: item.user.username,
      userId: item.user.id, // Include the actual user ID
      isCurrentUser: currentUserId === item.user.id, // Add this flag
      likedByCurrentUser: currentUserId
        ? item.likedBy.some(user => user.id === currentUserId)
        : false
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch feedback' }, 
      { status: 500 }
    );
  }
}


