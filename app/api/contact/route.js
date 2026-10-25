import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req) {
    try {
        // 0. Rate Limiting (Prevent Spam)
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const isAllowed = await checkRateLimit(ip, 'contact-form', 50, 3600); // 50 requests per hour

        if (!isAllowed.success) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429 }
            );
        }

        const body = await req.json();
        const { name, email, phone, reason, message } = body;

        // 1. Validation
        if (!name || !email || !phone || !reason) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // 2. Save to Database
        // 2. Save to Database
        let submission;
        try {
            submission = await prisma.contactSubmission.create({
                data: {
                    name,
                    email,
                    phone,
                    reason,
                    message,
                },
            });
        } catch (dbError) {
            console.error('Database Error:', dbError);
            return NextResponse.json(
                { error: 'Database connection failed. Please try again.' },
                { status: 500 }
            );
        }

        // Helper to sanitize HTML
        const escapeHtml = (str) => {
            if (!str) return str;
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        };

        const safeName = escapeHtml(name);
        const safeEmail = escapeHtml(email);
        const safePhone = escapeHtml(phone);
        const safeReason = escapeHtml(reason);
        const safeMessage = escapeHtml(message);

        // 3. Send Email Notifications (non-blocking)
        const adminEmail = process.env.GMAIL_USER || 'admin@tradexfloor.com';

        try {
            const results = await Promise.all([
                sendEmail({
                    to: adminEmail,
                    subject: `New Contact: ${safeName} - ${safeReason}`,
                    html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Phone:</strong> ${safePhone}</p>
        <p><strong>Reason:</strong> ${safeReason}</p>
        <p><strong>Message:</strong></p>
        <blockquote style="background: #f5f5f5; padding: 10px; border-left: 4px solid #10B981;">
          ${safeMessage || 'No message provided'}
        </blockquote>
      `,
                }),
                sendEmail({
                    to: email,
                    subject: `We received your message: ${safeReason}`,
                    html: `
            <h2>Hi ${safeName},</h2>
            <p>Thanks for contacting TradeX Floor Academy. We have received your message regarding "<strong>${safeReason}</strong>".</p>
            <p>Our team will review it and get back to you shortly.</p>
            <br/>
            <p>Best Regards,</p>
            <p><strong>TradeX Floor Academy Team</strong></p>
        `
                })
            ]);

            results.forEach((res, index) => {
                if (!res?.success) {
                    console.error(`❌ Contact email ${index === 0 ? 'admin' : 'user'} failed:`, res?.error);
                } else {
                    console.log(`✅ Contact email ${index === 0 ? 'admin' : 'user'} sent via ${res.messageId}`);
                }
            });

        } catch (emailError) {
            console.error('❌ Email notification failed:', emailError.message);
            // Continue - submission was saved successfully
        }

        return NextResponse.json({ success: true, id: submission.id });
    } catch (error) {
        console.error('Contact API Error:', error);
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        );
    }
}
