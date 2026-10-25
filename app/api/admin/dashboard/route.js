import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAdminSession } from '@/lib/admin-auth';

// Force dynamic rendering - this route uses headers for auth
export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const admin = await validateAdminSession(request);
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parallel data fetching for performance
        const [
            totalUsers,
            totalRevenueResult,
            activeSubscriptions,
            totalProducts,
            recentActivity,
            revenueByMonth
        ] = await Promise.all([
            // 1. Total Users
            prisma.user.count(),

            // 2. Total Revenue (Sum of all successful payments)
            prisma.payment.aggregate({
                _sum: { amount: true },
                where: { status: 'PAID' }
            }),

            // 3. Active Subscriptions (isActive=true and not expired)
            prisma.subscription.count({
                where: {
                    isActive: true,
                    expiryAt: { gt: new Date() }
                }
            }),

            // 4. Total Content/Products
            prisma.product.count(),

            // 5. Recent Activity (Audit Log) - Note: AuditLog uses actorEmail, not a user relation
            prisma.auditLog.findMany({
                take: 10,
                orderBy: { timestamp: 'desc' },
                select: {
                    id: true,
                    timestamp: true,
                    action: true,
                    actorEmail: true,
                    targetType: true,
                    details: true,
                    outcome: true
                }
            }),

            // 6. Revenue Trend (Last 6 months)
            prisma.payment.findMany({
                where: { status: 'PAID' },
                select: { amount: true, createdAt: true },
                orderBy: { createdAt: 'asc' }
            })
        ]);

        // Process Revenue Trend for Chart
        const monthlyRevenue = {};
        revenueByMonth.forEach(payment => {
            const month = payment.createdAt.toISOString().slice(0, 7); // YYYY-MM
            monthlyRevenue[month] = (monthlyRevenue[month] || 0) + payment.amount;
        });

        const revenueChartData = Object.entries(monthlyRevenue).map(([date, amount]) => ({
            date,
            amount
        })).sort((a, b) => a.date.localeCompare(b.date));

        return NextResponse.json({
            stats: {
                totalUsers,
                totalRevenue: totalRevenueResult._sum.amount || 0,
                activeSubscriptions,
                totalProducts,
            },
            recentActivity,
            charts: {
                revenue: revenueChartData
            }
        });

    } catch (error) {
        console.error('Dashboard API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
