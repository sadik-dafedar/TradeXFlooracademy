import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCached, cacheKeys } from '@/lib/cache';
import { requireAdminAuth } from '@/lib/admin-auth';
import { rateLimitPresets } from '@/lib/rate-limit-middleware';

export const dynamic = 'force-dynamic';

// Wrap with admin auth and rate limiting
const protectedHandler = rateLimitPresets.adminRead(requireAdminAuth(async function GET(request) {
    try {
        const admin = request.admin; // Added by requireAdminAuth middleware
        
        console.log(`[Admin Stats] Request by admin: ${admin.email}`);

        // Cache admin stats for 2 minutes (stats don't need real-time updates)
        const stats = await getCached(
            cacheKeys.adminStats(),
            async () => {
                // Prepare dates for queries
                const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
                const now = new Date();
                const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

                const [
                    revenueResult,
                    totalUsers,
                    activeSubscriptions,
                    totalProducts,
                    activeSessions,
                    recentTransactions,
                    thisMonthRevenueResult,
                    lastMonthRevenueResult,
                    thisMonthUsers,
                    lastMonthUsers
                ] = await Promise.all([
                    // Get total revenue from paid payments
                    prisma.payment.aggregate({
                        _sum: { amount: true },
                        where: { status: 'PAID' }
                    }),
                    // Get total users count
                    prisma.user.count(),
                    // Get active subscriptions count
                    prisma.subscription.count({
                        where: {
                            isActive: true,
                            expiryAt: { gt: new Date() }
                        }
                    }),
                    // Get total products count
                    prisma.product.count(),
                    // Get active sessions (Users active in last 15 mins)
                    prisma.user.count({
                        where: { updatedAt: { gt: fifteenMinsAgo } }
                    }),
                    // Get recent transactions (last 10)
                    prisma.payment.findMany({
                        take: 10,
                        orderBy: { createdAt: 'desc' },
                        include: {
                            user: {
                                select: { name: true, email: true }
                            }
                        }
                    }),
                    // Get this month revenue
                    prisma.payment.aggregate({
                        _sum: { amount: true },
                        where: {
                            status: 'PAID',
                            createdAt: { gte: thisMonthStart }
                        }
                    }),
                    // Get last month revenue
                    prisma.payment.aggregate({
                        _sum: { amount: true },
                        where: {
                            status: 'PAID',
                            createdAt: { gte: lastMonthStart, lte: lastMonthEnd }
                        }
                    }),
                    // Get this month users
                    prisma.user.count({
                        where: { createdAt: { gte: thisMonthStart } }
                    }),
                    // Get last month users
                    prisma.user.count({
                        where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } }
                    })
                ]);

                const totalRevenue = revenueResult._sum.amount || 0;
                const thisMonthTotal = thisMonthRevenueResult._sum.amount || 0;
                const lastMonthTotal = lastMonthRevenueResult._sum.amount || 0;

                const revenueChange = lastMonthTotal > 0
                    ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1)
                    : thisMonthTotal > 0 ? '100' : '0';

                const userChange = lastMonthUsers > 0
                    ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers * 100).toFixed(1)
                    : thisMonthUsers > 0 ? '100' : '0';

                return {
                    stats: {
                        totalRevenue,
                        totalUsers,
                        activeSubscriptions,
                        totalProducts,
                        activeSessions,
                        revenueChange: Number(revenueChange) >= 0 ? `+${revenueChange}%` : `${revenueChange}%`,
                        userChange: Number(userChange) >= 0 ? `+${userChange}%` : `${userChange}%`
                    },
                    recentTransactions: recentTransactions.map(tx => ({
                        id: tx.id,
                        amount: tx.amount,
                        status: tx.status,
                        createdAt: tx.createdAt,
                        user: tx.user?.name || tx.user?.email || 'Unknown User',
                        razorpayOrderId: tx.razorpayOrderId
                    }))
                };
            },
            120 // Cache for 2 minutes
        );

        return NextResponse.json(stats);

    } catch (error) {
        console.error('[Admin Stats] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}));

// Export the wrapped handler
export { protectedHandler as GET };
