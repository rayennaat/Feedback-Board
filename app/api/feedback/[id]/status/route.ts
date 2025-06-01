import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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

  const { status } = await req.json();
  const allowedStatuses = ['pending', 'approved', 'rejected'];

  if (!allowedStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  try {
    const updated = await prisma.feedback.update({
      where: { id: parseInt(params.id) },
      data: { status }
    });

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: 'Feedback not found or update failed' }, { status: 500 });
  }
}
