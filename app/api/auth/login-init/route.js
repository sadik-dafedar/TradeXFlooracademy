import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendOtpEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req) {
    try {
        const { identifier, password } = await req.json(); // identifier can be email or username

        if (!identifier || !password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Rate Limit Check (5 attempts per 5 minutes)
        const limitCheck = await checkRateLimit(identifier, '/api/auth/login-init', 5, 300);
        if (!limitCheck.success) {
            return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 });
        }

        // 1. Find User by Email OR Username
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { username: identifier }
                ]
            }
        });

        if (!user || !user.password) {
            // Don't reveal if user exists or not, generally, but for UX here we might say Invalid Creds
            // Also if user has no password (e.g. Google auth only), they must use Google
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // 2. Verify Password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // 3. Generate 2FA OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        await prisma.verificationToken.deleteMany({ where: { identifier: user.email } });

        await prisma.verificationToken.create({
            data: {
                identifier: user.email, // Always store by EMAIL for consistency
                token: otp,
                expires
            }
        });

        // 4. Send OTP to EMAIL (synchronous for reliable delivery)
        const emailResult = await sendOtpEmail(user.email, otp);

        if (!emailResult?.success) {
            console.error("Failed to send OTP email:", emailResult?.error);
            return NextResponse.json({ error: "Failed to send OTP. Please try again." }, { status: 500 });
        }

        console.log(`✅ OTP sent to ${user.email.substring(0, 3)}***`);

        return NextResponse.json({
            success: true,
            message: "OTP sent to email",
            email: user.email,
            role: user.role // Return role for frontend redirection logic
        });

    } catch (error) {
        console.error("Login Init Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
