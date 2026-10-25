import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { getCachedUserByEmail } from '@/lib/cache';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await getCachedUserByEmail(session.user.email);

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const payments = await prisma.payment.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });

        return NextResponse.json(payments);

    } catch (error) {
        console.error('Admin Payments Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
