import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCached, cacheKeys } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET ALL PRODUCTS (Public Store View) - With Redis Caching
export async function GET(req) {
    try {
        const products = await getCached(
            cacheKeys.products(),
            async () => {
                return await prisma.product.findMany({
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        type: true,
                        price: true,
                        thumbnail: true,
                        validityDays: true,
                        // Exclude contentUrl for security
                    },
                    orderBy: { createdAt: 'desc' }
                });
            },
            600 // Cache for 10 minutes
        );

        return NextResponse.json(products);
    } catch (error) {
        console.error('Products API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 503 }
        );
    }
}
