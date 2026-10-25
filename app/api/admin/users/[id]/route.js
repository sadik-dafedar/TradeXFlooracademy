import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/admin-auth';
import { rateLimitPresets } from '@/lib/rate-limit-middleware';
import { logAdminAudit, AUDIT_ACTIONS, TARGET_TYPES, getUserActivityTimeline } from '@/lib/audit-logger';
import { invalidateUserEmailCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET - Get single user with full details
const getUserHandler = rateLimitPresets.adminRead(requireAdminAuth(async function GET(request, { params }) {
    const admin = request.admin;
    const userId = params.id;

    try {
        // Get user with all related data
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                accounts: {
                    select: {
                        provider: true,
                        createdAt: true,
                    }
                },
                subscriptions: {
                    include: {
                        product: {
                            select: { id: true, title: true, type: true, price: true }
                        }
                    },
                    orderBy: { startDate: 'desc' }
                },
                payments: {
                    select: {
                        id: true,
                        razorpayOrderId: true,
                        razorpayPaymentId: true,
                        status: true,
                        amount: true,
                        createdAt: true,
                        product: {
                            select: { title: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                lessonProgress: {
                    select: {
                        productId: true,
                        lessonId: true,
                        completed: true,
                        completedAt: true,
                    }
                },
                _count: {
                    select: {
                        subscriptions: true,
                        payments: true,
                        lessonProgress: true,
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get user's activity timeline from audit logs
        const activityTimeline = await getUserActivityTimeline(userId, 20);

        // Calculate summary stats
        const stats = {
            totalSpent: user.payments
                .filter(p => p.status === 'COMPLETED')
                .reduce((sum, p) => sum + p.amount, 0),
            activeSubscriptions: user.subscriptions.filter(s => s.isActive && new Date(s.expiryAt) > new Date()).length,
            completedLessons: user.lessonProgress.filter(lp => lp.completed).length,
            joinedDaysAgo: Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
        };

        // Log the view action
        await logAdminAudit(admin, {
            action: AUDIT_ACTIONS.USER_VIEW,
            targetType: TARGET_TYPES.USER,
            targetId: userId,
            details: `Viewed user profile: ${user.email}`,
        }, request);

        return NextResponse.json({
            user,
            stats,
            activityTimeline,
        });

    } catch (error) {
        console.error('[Admin User Detail] GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch user details' }, { status: 500 });
    }
}));

// DELETE - Hard delete user and all related data (GDPR compliance)
const deleteUserHandler = rateLimitPresets.adminWrite(requireAdminAuth(async function DELETE(request, { params }) {
    const admin = request.admin;
    const userId = params.id;

    try {
        // Verify user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, role: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Prevent self-deletion
        if (user.id === admin.id) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        // Prevent deleting other admins (unless super admin - future feature)
        if (user.role === 'ADMIN') {
            return NextResponse.json({ error: 'Cannot delete admin accounts' }, { status: 403 });
        }

        // Log before deletion (capture email for audit trail)
        await logAdminAudit(admin, {
            action: AUDIT_ACTIONS.USER_DELETE,
            targetType: TARGET_TYPES.USER,
            targetId: userId,
            details: `Hard deleted user: ${user.email}`,
            metadata: { deletedEmail: user.email },
        }, request);

        // Delete in correct order to respect foreign key constraints
        await prisma.$transaction([
            // Delete lesson progress
            prisma.lessonProgress.deleteMany({ where: { userId } }),
            // Delete subscriptions
            prisma.subscription.deleteMany({ where: { userId } }),
            // Delete payments
            prisma.payment.deleteMany({ where: { userId } }),
            // Delete sessions
            prisma.session.deleteMany({ where: { userId } }),
            // Delete accounts (OAuth)
            prisma.account.deleteMany({ where: { userId } }),
            // Delete admin logs by this user
            prisma.adminLog.deleteMany({ where: { adminId: userId } }),
            // Delete admin sessions by this user
            prisma.adminSession.deleteMany({ where: { adminId: userId } }),
            // Finally delete the user
            prisma.user.delete({ where: { id: userId } }),
        ]);

        // Invalidate email cache
        await invalidateUserEmailCache(user.email);

        return NextResponse.json({
            success: true,
            message: `User ${user.email} and all associated data deleted permanently`
        });

    } catch (error) {
        console.error('[Admin User Detail] DELETE Error:', error);

        // Log failed attempt
        await logAdminAudit(admin, {
            action: AUDIT_ACTIONS.USER_DELETE,
            targetType: TARGET_TYPES.USER,
            targetId: userId,
            details: `Failed to delete user: ${error.message}`,
            outcome: 'FAILURE',
        }, request);

        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}));

// PATCH - Update user (ban/unban, promote/demote)
const updateUserHandler = rateLimitPresets.adminWrite(requireAdminAuth(async function PATCH(request, { params }) {
    const admin = request.admin;
    const userId = params.id;

    try {
        const body = await request.json();
        const { action } = body;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, role: true, isBanned: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        let updateData = {};
        let auditAction = AUDIT_ACTIONS.USER_UPDATE;
        let details = '';

        switch (action) {
            case 'ban':
                updateData = { isBanned: true };
                auditAction = AUDIT_ACTIONS.USER_BAN;
                details = `Banned user: ${user.email}`;
                break;
            case 'unban':
                updateData = { isBanned: false };
                auditAction = AUDIT_ACTIONS.USER_UNBAN;
                details = `Unbanned user: ${user.email}`;
                break;
            case 'promote':
                if (user.role === 'ADMIN') {
                    return NextResponse.json({ error: 'User is already an admin' }, { status: 400 });
                }
                updateData = { role: 'ADMIN' };
                auditAction = AUDIT_ACTIONS.USER_PROMOTE;
                details = `Promoted user to ADMIN: ${user.email}`;
                break;
            case 'demote':
                if (user.id === admin.id) {
                    return NextResponse.json({ error: 'Cannot demote yourself' }, { status: 400 });
                }
                updateData = { role: 'USER' };
                auditAction = AUDIT_ACTIONS.USER_DEMOTE;
                details = `Demoted user from ADMIN: ${user.email}`;
                break;
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        // Invalidate email cache
        await invalidateUserEmailCache(user.email);

        // Log the action
        await logAdminAudit(admin, {
            action: auditAction,
            targetType: TARGET_TYPES.USER,
            targetId: userId,
            details,
        }, request);

        return NextResponse.json({
            success: true,
            user: updatedUser,
            message: details
        });

    } catch (error) {
        console.error('[Admin User Detail] PATCH Error:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}));

export { getUserHandler as GET, deleteUserHandler as DELETE, updateUserHandler as PATCH };
