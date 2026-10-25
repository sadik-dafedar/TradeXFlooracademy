import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const username = searchParams.get('username');

        if (!username || username.length < 3) {
            return NextResponse.json({ available: false, error: "Username too short" }, { status: 400 });
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return NextResponse.json({ available: false, error: "Invalid characters" }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { username: username.toLowerCase() },
            select: { id: true }
        });

        return NextResponse.json({ available: !existingUser });

    } catch (error) {
        console.error("Username check error:", error);
        return NextResponse.json({ available: false, error: "Server error" }, { status: 500 });
    }
}
