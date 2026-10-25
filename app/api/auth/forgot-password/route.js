import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';
import { storePasswordResetToken } from '@/lib/cache';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    // Rate limiting (3 attempts per 15 mins)
    const canProceed = await checkRateLimit(normalizedEmail, '/api/auth/forgot-password', 3, 900);
    if (!canProceed.success) {
      return NextResponse.json({
        message: 'If an account exists with this email, you will receive a password reset link.'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return same message (security - don't reveal if email exists)
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with this email, you will receive a password reset link.'
      });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');

    // Store token in Redis (with DB fallback) - 15 minute expiry
    await storePasswordResetToken(normalizedEmail, token, 900);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    const result = await sendPasswordResetEmail(normalizedEmail, resetLink);

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'If an account exists with this email, you will receive a password reset link.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
