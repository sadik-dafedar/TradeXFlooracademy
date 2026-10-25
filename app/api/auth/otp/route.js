import { NextResponse } from 'next/server';
import { sendOtpEmail } from '@/lib/email';
import crypto from 'crypto';
import { checkRateLimit } from '@/lib/rate-limit';
import { otpRequestSchema } from '@/lib/validations';
import { storeOTP } from '@/lib/cache';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
    console.log('📧 OTP API called');
    
    try {
        const body = await req.json();
        console.log('📧 Request body received');

        // 1. Input Validation
        const validation = otpRequestSchema.safeParse(body);
        if (!validation.success) {
            console.log('❌ Validation failed:', validation.error.issues[0].message);
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }
        const { email } = validation.data;
        console.log(`📧 Processing OTP for: ${email.substring(0, 3)}***`);

        // Check if user exists
        console.log('📧 Checking if user exists...');
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        console.log(`📧 User exists: ${!!existingUser}`);

        if (!existingUser) {
            // For security, we shouldn't reveal if an account exists or not
            // Return a generic response for all OTP requests
            return NextResponse.json({ success: true, message: 'If account exists, OTP sent' });
        }

        // 2. Rate Limiting (3 attempts per 10 mins) - Now using Redis
        console.log('📧 Checking rate limit...');
        const canProceed = await checkRateLimit(email, '/api/auth/otp', 3, 600);
        console.log(`📧 Rate limit check: ${canProceed.success}`);
        
        if (!canProceed.success) {
            return NextResponse.json({ error: 'Too many requests. Please try again in 10 minutes.' }, { status: 429 });
        }

        // Generate 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        console.log('📧 OTP generated');

        // Store OTP in Redis (with DB fallback) - 5 minute expiry
        console.log('📧 Storing OTP...');
        const stored = await storeOTP(email, otp, 300);
        console.log(`📧 OTP stored: ${stored}`);
        
        if (!stored) {
            console.error('❌ Failed to store OTP');
            return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 });
        }

        // Send Email
        console.log('📧 Sending email...');
        const result = await sendOtpEmail(email, otp);
        console.log(`📧 Email result:`, result);

        // Log email status for debugging
        if (result.success && result.messageId !== 'dev-mode-no-email') {
            console.log(`✅ OTP email sent to ${email.substring(0, 3)}*** via ${result.messageId}`);
        } else if (!result.success) {
            console.error(`❌ Email failed:`, result.error);
            return NextResponse.json({ error: 'Failed to send OTP email. Please try again.' }, { status: 500 });
        } else {
            console.warn(`⚠️ Email in dev mode for ${email.substring(0, 3)}***`);
        }

        // Always return success to prevent user enumeration
        console.log('✅ OTP API completed successfully');
        return NextResponse.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('❌ OTP API Error:', error.message);
        console.error('❌ Stack:', error.stack);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
