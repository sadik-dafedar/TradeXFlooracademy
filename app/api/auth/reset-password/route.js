import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifyPasswordResetToken } from '@/lib/cache';

export async function POST(request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Verify and consume token (single-use - deleted upon verification)
    const verification = await verifyPasswordResetToken(token);

    if (!verification.valid) {
      return NextResponse.json({ error: verification.error || 'Invalid or expired reset link' }, { status: 400 });
    }

    const email = verification.email;

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
