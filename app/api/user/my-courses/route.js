import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
import { getCached, cacheKeys } from '@/lib/cache';
import { toSafeSubscription } from '@/lib/dto';

export async function GET(req) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const userId = session.user.id;

        const subscriptions = await getCached(
            cacheKeys.userCourses(userId),
            async () => {
                return await prisma.subscription.findMany({
                    where: {
                        userId: userId,
                        isActive: true,
                        expiryAt: { gt: new Date() } // Only not expired
                    },
                    include: {
                        product: true
                    }
                });
            },
            300 // Cache for 5 minutes
        );

        // Filter out contentUrl from products to prevent data leak
        return NextResponse.json(subscriptions.map(toSafeSubscription));
    } catch (error) {
        console.error('My Courses API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }
}
