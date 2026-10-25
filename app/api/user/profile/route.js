import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { invalidateUserCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// Max image size: 100KB (base64 encoded)
const MAX_IMAGE_SIZE = 100 * 1024;

export async function PUT(req) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();

        // Basic validation for name
        if (data.name !== undefined) {
            if (!data.name || data.name.trim().length < 2) {
                return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
            }
        }

        // Image validation (if provided)
        if (data.image !== undefined && data.image !== null) {
            // Check if it's a valid data URL or base64
            if (data.image && !data.image.startsWith('data:image/')) {
                return NextResponse.json({ error: 'Invalid image format. Please use a valid image file.' }, { status: 400 });
            }

            // Check image size (base64 string length ≈ 1.37x original size)
            if (data.image && data.image.length > MAX_IMAGE_SIZE * 1.4) {
                return NextResponse.json({ error: 'Image too large. Maximum size is 100KB.' }, { status: 400 });
            }
        }

        // Build update object
        const updateData = {};
        if (data.name !== undefined) updateData.name = data.name.trim();
        if (data.image !== undefined) updateData.image = data.image; // null to remove, string to set

        // Check if there's anything to update
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
            select: { id: true, name: true, email: true, image: true, username: true }
        });

        // Invalidate user cache after profile update
        try {
            await invalidateUserCache(session.user.id);
        } catch (cacheError) {
            console.error('Cache invalidation failed:', cacheError);
        }

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Profile Update Error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}

// GET: Fetch current user profile
export async function GET(req) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                username: true,
                createdAt: true
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Profile Fetch Error:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}
