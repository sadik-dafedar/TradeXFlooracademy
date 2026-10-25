import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({
                authenticated: false,
                message: "No active session detected."
            }, { status: 401 });
        }

        return NextResponse.json({
            authenticated: true,
            user: {
                email: session.user?.email,
                role: session.user?.role,
                isBanned: session.user?.isBanned,
                id: session.user?.id
            },
            expires: session.expires
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch session diagnostic" }, { status: 500 });
    }
}
