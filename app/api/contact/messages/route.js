import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth'; // Assuming auth helper exists

export async function GET() {
    try {
        const session = await auth();

        // Authorization Check: Must be logged in AND have ADMIN role
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const messages = await prisma.contactSubmission.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(messages);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}
