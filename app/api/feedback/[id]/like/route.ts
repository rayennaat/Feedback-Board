import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const feedbackId = parseInt(params.id);

  if (isNaN(feedbackId)) {
    return NextResponse.json({ error: 'Invalid feedback ID' }, { status: 400 });
  }

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

  // Check if the user has already liked this feedback
  const feedback = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    include: { likedBy: true }
  });

  if (!feedback) {
    return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
  }

  const alreadyLiked = feedback.likedBy.some(user => user.id === userId);

  let updatedFeedback;

  if (alreadyLiked) {
    // Unlike: remove user from likedBy and decrement likes
    updatedFeedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        likes: { decrement: 1 },
        likedBy: {
          disconnect: { id: userId }
        }
      },
      include: {
        likedBy: true
      }
    });
  } else {
    // Like: add user to likedBy and increment likes
    updatedFeedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        likes: { increment: 1 },
        likedBy: {
          connect: { id: userId }
        }
      },
      include: {
        likedBy: true
      }
    });
  }

  return NextResponse.json({
    message: alreadyLiked ? 'Unliked' : 'Liked',
    likes: updatedFeedback.likes,
    likedBy: updatedFeedback.likedBy.map(user => user.id)
  });
}
