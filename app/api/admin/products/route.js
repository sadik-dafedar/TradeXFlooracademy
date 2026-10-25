import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { invalidateProductCache } from '@/lib/cache';
import { requireAdminAuth } from '@/lib/admin-auth';
import { rateLimitPresets } from '@/lib/rate-limit-middleware';
import { withValidation, adminSchemas } from '@/lib/validation';

export const dynamic = 'force-dynamic';

// GET ALL PRODUCTS (Admin View)
const getProductsHandler = rateLimitPresets.adminRead(requireAdminAuth(async function GET(request) {
    const admin = request.admin;
    console.log(`[Admin Products] List requested by: ${admin.email}`);

    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { subscriptions: true }
                }
            }
        });
        return NextResponse.json(products);
    } catch (error) {
        console.error('[Admin Products] GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}));

// CREATE PRODUCT with validation
const createProductHandler = rateLimitPresets.adminWrite(
    withValidation(adminSchemas.product)(
        requireAdminAuth(async function POST(request) {
            const admin = request.admin;
            const data = request.validatedData; // Provided by validation middleware

            console.log(`[Admin Products] Create requested by: ${admin.email}`, {
                title: data.title,
                type: data.type
            });

            try {
                const product = await prisma.product.create({
                    data: {
                        title: data.title,
                        description: data.description,
                        type: data.type,
                        price: data.price,
                        contentUrl: data.contentUrl,
                        thumbnail: data.thumbnail,
                        validityDays: data.validityDays,
                        thumbnail: data.thumbnail
                    }
                });

                // Log action
                await prisma.adminLog.create({
                    data: {
                        adminId: admin.id,
                        action: 'Create Product',
                        targetId: product.id,
                        details: `Created product: ${product.title} (${product.type}) - ₹${product.price}`
                    }
                });

                // Invalidate products cache
                try {
                    await invalidateProductCache();
                } catch (cacheError) {
                    console.error('[Admin Products] Cache invalidation failed:', cacheError);
                }

                return NextResponse.json(product);
            } catch (error) {
                console.error('[Admin Products] POST Error:', error);
                return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
            }
        })
    )
);

// Export handlers
export { getProductsHandler as GET, createProductHandler as POST };
