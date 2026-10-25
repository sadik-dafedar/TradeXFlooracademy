import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendOtpEmail } from "@/lib/email";
import crypto from 'crypto';
import { checkRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const registerSchema = z.object({
    name: z.string().min(2, "Name too short"),
    username: z.string().min(3, "Username too short").regex(/^[a-zA-Z0-9_]+$/, "Invalid username"),
    email: z.string().email("Invalid email"),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain an uppercase letter")
        .regex(/[a-z]/, "Password must contain a lowercase letter")
        .regex(/[0-9]/, "Password must contain a number")
        .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain a special character"),
});

export async function POST(req) {
    try {
        const body = await req.json();

        // 1. Rate Limiting (5 registrations per hour per IP)
        // Note: Using "register_ip" as identifier key. In real app, extract IP from headers.
        // For now, we trust the deployment to handle abuse or use a placeholder "global_register_limit" if IP not available?
        // Let's rely on email for specific spam, but for "creating new accounts", we need IP.
        // Assuming we can't easily get IP in this env without headers check, let's skip IP limit here 
        // OR assume 'x-forwarded-for' is passed. 
        // For safety, let's rate limit by EMAIL (prevent spamming same email) 
        // AND maybe a global limit if possible? No, global limit blocks real users.
        // Limitation: Without reliable IP, we can only rate limit the TARGET (Email).

        const validation = registerSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }
        const { name, username, email, password } = validation.data;

        const limitCheck = await checkRateLimit(email, '/api/auth/register', 3, 3600); // 3 attempts per hour per email
        if (!limitCheck.success) {
            return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
        }

        // 2. Check if Email or Username already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return NextResponse.json({ error: "This email is already registered. Please login instead." }, { status: 400 });
            }
            if (existingUser.username === username) {
                return NextResponse.json({ error: "Username already taken" }, { status: 400 });
            }
        }

        // 3. Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Create User (Unverified)
        await prisma.user.create({
            data: {
                name,
                username,
                email,
                password: hashedPassword,
                isVerified: false,
                role: "USER"
            }
        });

        // 5. Generate OTP (Secure)
        const otp = crypto.randomInt(100000, 999999).toString();
        const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // 6. Store OTP
        // First distinct cleanup old OTPs for this email if any
        await prisma.verificationToken.deleteMany({ where: { identifier: email } });

        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token: otp,
                expires
            }
        });

        // 6. Send OTP Email
        const emailResult = await sendOtpEmail(email, otp);

        if (emailResult.success && emailResult.messageId !== 'dev-mode-no-email') {
            console.log(`✅ Registration OTP sent to ${email.substring(0, 3)}*** via ${emailResult.messageId}`);
        } else {
            console.warn(`⚠️ Registration OTP in dev mode for ${email.substring(0, 3)}***`);
        }

        return NextResponse.json({ success: true, message: "User registered. Please check your email for OTP." });

    } catch (error) {
        console.error("Registration Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
