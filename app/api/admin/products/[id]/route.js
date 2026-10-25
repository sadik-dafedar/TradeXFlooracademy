import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { invalidateProductCache, getCachedUserByEmail } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET SINGLE PRODUCT
export async function GET(req, { params }) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const product = await prisma.product.findUnique({
            where: { id: params.id }
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json(product);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// UPDATE PRODUCT
export async function PATCH(req, { params }) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const user = await getCachedUserByEmail(session.user.email);

    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { title, description, type, price, contentUrl, validityDays, thumbnail } = body;

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (type !== undefined) updateData.type = type;
        if (price !== undefined) updateData.price = parseFloat(price);
        if (contentUrl !== undefined) updateData.contentUrl = contentUrl;
        if (validityDays !== undefined) updateData.validityDays = parseInt(validityDays);
        if (thumbnail !== undefined) updateData.thumbnail = thumbnail;

        const product = await prisma.product.update({
            where: { id: params.id },
            data: updateData
        });

        // Invalidate products cache so updates appear immediately
        await invalidateProductCache();

        return NextResponse.json(product);
    } catch (error) {
        console.error('Update Product Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE PRODUCT
export async function DELETE(req, { params }) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const user = await getCachedUserByEmail(session.user.email);

    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        // Check if product has active subscriptions
        const activeSubscriptions = await prisma.subscription.count({
            where: {
                productId: params.id,
                isActive: true,
                expiryAt: { gt: new Date() }
            }
        });

        if (activeSubscriptions > 0) {
            return NextResponse.json(
                { error: `Cannot delete: ${activeSubscriptions} active subscription(s) exist` },
                { status: 400 }
            );
        }

        // Delete the product
        await prisma.product.delete({
            where: { id: params.id }
        });

        // Invalidate products cache so deletion reflects immediately
        await invalidateProductCache();

        return NextResponse.json({ success: true, message: 'Product deleted' });
    } catch (error) {
        console.error('Delete Product Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
