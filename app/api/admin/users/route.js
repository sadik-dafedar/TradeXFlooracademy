import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCached, invalidateCache, cacheKeys } from "@/lib/cache";
import { requireAdminAuth, requireAdminRole } from "@/lib/admin-auth";
import { rateLimitPresets } from "@/lib/rate-limit-middleware";
import { parsePaginationParams, createPaginatedResponse } from "@/lib/pagination";
import { withValidation, adminSchemas } from "@/lib/validation";

export const dynamic = 'force-dynamic';

// GET - Admin users list with pagination
const getUsersHandler = rateLimitPresets.adminRead(requireAdminAuth(async function GET(request) {
    try {
        const admin = request.admin;
        console.log(`[Admin Users] List requested by: ${admin.email}`);

        // Parse pagination parameters
        const url = new URL(request.url);
        const { page, limit, skip } = parsePaginationParams(url.searchParams, {
            defaultPage: 1,
            defaultLimit: 20,
            maxLimit: 100
        });

        // Parse filter parameters
        const search = url.searchParams.get('search') || '';
        const role = url.searchParams.get('role') || '';
        const status = url.searchParams.get('status') || ''; // verified, banned, all

        // Build where clause
        const where = {};
        
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { username: { contains: search, mode: 'insensitive' } }
            ];
        }
        
        if (role && role !== 'all') {
            where.role = role;
        }
        
        if (status === 'verified') {
            where.isVerified = true;
        } else if (status === 'unverified') {
            where.isVerified = false;
        } else if (status === 'banned') {
            where.isBanned = true;
        } else if (status === 'active') {
            where.isBanned = false;
        }

        // Fetch paginated data
        const [users, totalCount] = await Promise.all([
            prisma.user.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true,
                    role: true,
                    isVerified: true,
                    isBanned: true,
                    createdAt: true,
                    image: true,
                    _count: {
                        select: {
                            subscriptions: true,
                            payments: true
                        }
                    }
                }
            }),
            prisma.user.count({ where })
        ]);

        // Create paginated response
        const response = createPaginatedResponse(users, totalCount, { page, limit, skip });
        
        return NextResponse.json(response);
    } catch (error) {
        console.error('[Admin Users] GET Error:', error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}));

// PATCH - Update user (sensitive write operation)
const updateUserHandler = rateLimitPresets.adminSensitive(requireAdminAuth(async function PATCH(request) {
    try {
        const admin = request.admin;
        const { userId, isVerified, role, isBanned } = await request.json();

        // Validate input
        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const updateData = {};
        if (typeof isVerified === 'boolean') updateData.isVerified = isVerified;
        if (typeof isBanned === 'boolean') updateData.isBanned = isBanned;
        if (role) updateData.role = role;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        // Log the action
        await prisma.adminLog.create({
            data: {
                adminId: admin.id,
                action: 'Update User',
                targetId: userId,
                details: `Updated user ${updatedUser.email}. Changes: ${JSON.stringify(updateData)}`
            }
        });

        // Invalidate admin users cache (non-blocking on failure)
        try {
            await invalidateCache(cacheKeys.adminUsers());
        } catch (cacheError) {
            console.error('[Admin Users] Cache invalidation error:', cacheError);
        }

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('[Admin Users] PATCH Error:', error);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}));

// Export handlers
export { getUsersHandler as GET, updateUserHandler as PATCH };
