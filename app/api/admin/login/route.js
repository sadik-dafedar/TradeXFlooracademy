import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { storeOTP, verifyOTP } from '@/lib/cache';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendAdminOtpEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request) {
    console.log('[Admin Auth] Login request received');
    
    try {
        const body = await request.json();
        const { email, action } = body;

        // Validate input
        if (!email || typeof email !== 'string') {
            return NextResponse.json(
                { error: 'Valid email is required' }, 
                { status: 400 }
            );
        }

        // Normalize email
        const normalizedEmail = email.toLowerCase().trim();

        // Rate limiting - 5 attempts per 15 minutes per email
        const rateCheck = await checkRateLimit(
            normalizedEmail, 
            '/api/admin/login', 
            5, 
            900
        );
        
        if (!rateCheck.success) {
            console.log('[Admin Auth] Rate limit exceeded for:', normalizedEmail);
            return NextResponse.json(
                { error: 'Too many login attempts. Please try again in 15 minutes.' }, 
                { status: 429 }
            );
        }

        // Find admin user
        const adminUser = await prisma.user.findFirst({
            where: {
                email: normalizedEmail,
                role: 'ADMIN'
            },
            select: {
                id: true,
                email: true,
                name: true,
                isBanned: true
            }
        });

        if (!adminUser) {
            // Security: Don't reveal if user exists
            console.log('[Admin Auth] Admin user not found or not authorized:', normalizedEmail);
            return NextResponse.json({ 
                success: true, 
                message: 'If account exists, OTP has been sent' 
            });
        }

        // Check if banned
        if (adminUser.isBanned) {
            console.log('[Admin Auth] Banned admin attempted login:', adminUser.id);
            await logFailedAttempt(normalizedEmail, 'banned_admin_access');
            return NextResponse.json(
                { error: 'Access denied. Account suspended.' }, 
                { status: 403 }
            );
        }

        // Handle different actions
        if (action === 'send-otp') {
            return await handleSendOTP(normalizedEmail, adminUser);
        } else if (action === 'verify-otp') {
            const { otp } = body;
            if (!otp || typeof otp !== 'string' || otp.length !== 6) {
                return NextResponse.json(
                    { error: 'Valid 6-digit OTP required' }, 
                    { status: 400 }
                );
            }
            return await handleVerifyOTP(normalizedEmail, otp, adminUser);
        } else {
            return NextResponse.json(
                { error: 'Invalid action. Use send-otp or verify-otp' }, 
                { status: 400 }
            );
        }

    } catch (error) {
        console.error('[Admin Auth] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' }, 
            { status: 500 }
        );
    }
}

async function handleSendOTP(email, adminUser) {
    console.log('[Admin Auth] Generating OTP for admin:', adminUser.id);
    
    try {
        // Generate secure 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        
        // Store OTP with 5-minute expiry (admin OTPs expire faster)
        const stored = await storeOTP(email, otp, 300, 'admin');
        
        if (!stored) {
            console.error('[Admin Auth] Failed to store OTP');
            return NextResponse.json(
                { error: 'Failed to generate authentication code' }, 
                { status: 500 }
            );
        }

        // Send email
        const emailResult = await sendAdminOtpEmail(email, otp);
        
        if (!emailResult.success) {
            console.error('[Admin Auth] Failed to send email:', emailResult.error);
            return NextResponse.json(
                { error: 'Failed to send authentication code' }, 
                { status: 500 }
            );
        }

        console.log('[Admin Auth] OTP sent successfully to admin:', adminUser.id);
        
        // Log the attempt
        await prisma.adminLog.create({
            data: {
                adminId: adminUser.id,
                action: 'OTP Sent',
                details: 'Admin authentication code sent via email'
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Authentication code sent to your email' 
        });

    } catch (error) {
        console.error('[Admin Auth] Send OTP error:', error);
        return NextResponse.json(
            { error: 'Failed to process request' }, 
            { status: 500 }
        );
    }
}

async function handleVerifyOTP(email, otp, adminUser) {
    console.log('[Admin Auth] Verifying OTP for admin:', adminUser.id);
    
    try {
        // Verify OTP
        const verification = await verifyOTP(email, otp, 'admin');
        
        if (!verification.valid) {
            console.log('[Admin Auth] Invalid OTP for admin:', adminUser.id);
            await logFailedAttempt(email, 'invalid_otp', adminUser.id);
            return NextResponse.json(
                { error: 'Invalid or expired authentication code' }, 
                { status: 401 }
            );
        }

        // Create admin session
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        
        // Store session in database
        await prisma.adminSession.create({
            data: {
                token: sessionToken,
                adminId: adminUser.id,
                expiresAt,
                ipAddress: '', // Will be populated by middleware
                userAgent: ''  // Will be populated by middleware
            }
        });

        console.log('[Admin Auth] Admin login successful:', adminUser.id);
        
        // Log successful login
        await prisma.adminLog.create({
            data: {
                adminId: adminUser.id,
                action: 'Admin Login',
                details: 'Successful authentication with OTP'
            }
        });

        return NextResponse.json({ 
            success: true, 
            token: sessionToken,
            admin: {
                id: adminUser.id,
                email: adminUser.email,
                name: adminUser.name
            }
        });

    } catch (error) {
        console.error('[Admin Auth] Verify OTP error:', error);
        return NextResponse.json(
            { error: 'Authentication failed' }, 
            { status: 500 }
        );
    }
}

async function logFailedAttempt(email, reason, adminId = null) {
    try {
        await prisma.adminLog.create({
            data: {
                adminId,
                action: 'Failed Login Attempt',
                details: `${reason} - Email: ${email}`
            }
        });
    } catch (error) {
        console.error('[Admin Auth] Failed to log attempt:', error);
    }
}