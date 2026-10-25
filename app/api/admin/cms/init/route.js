import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const session = await auth();
    // Allow first run if no admins exist or if admin is logged in
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });

    if (adminCount > 0 && (!session || session.user.role !== 'ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Seed Hero Config if missing
        const heroConfig = await prisma.siteConfig.findUnique({ where: { key: 'hero_section' } });
        if (!heroConfig) {
            await prisma.siteConfig.create({
                data: {
                    key: 'hero_section',
                    value: {
                        badge: 'Best Trading Institute in India',
                        title_line1: 'Master the Art of',
                        title_highlight: 'Professional Trading',
                        subtitle: 'Become A Profitable Trader',
                        description: 'TradeX Floor Academy is the best stock market institute that transform your journey with us. We are here to help you dominate the market and turn your dreams into reality.',
                        review_count: '1500+ Students Enrolled'
                    }
                }
            });
        }

        // 2. Seed Stats (Clear existing to avoid duplicates if re-running logic wasn't smart, but here we check counts)
        if ((await prisma.stat.count()) === 0) {
            await prisma.stat.createMany({
                data: [
                    { label: 'Students', value: '1500', suffix: '+', icon: 'Users', order: 1 },
                    { label: 'Course Hours', value: '50', suffix: '+', icon: 'Clock', order: 2 },
                    { label: 'Success Rate', value: '90', suffix: '%', icon: 'Target', order: 3 },
                    { label: 'Support', value: '24', suffix: '/7', icon: 'Headphones', order: 4 },
                ]
            });
        }

        // 3. Seed Features
        if ((await prisma.feature.count()) === 0) {
            await prisma.feature.createMany({
                data: [
                    { title: 'A1 Trading Setup', desc: 'Professional-grade trading setups', icon: 'Zap', order: 1 },
                    { title: '24/7 Support', desc: 'Round the clock assistance', icon: 'Headphones', order: 2 },
                    { title: '3 Months Recording', desc: 'Access to recording sessions', icon: 'Video', order: 3 },
                    { title: '90% Success Ratio', desc: 'Proven track record in trading', icon: 'TrendingUp', order: 4 },
                    { title: 'Beginner Friendly Course', desc: 'Start from zero knowledge', icon: 'BookOpen', order: 5 },
                ]
            });
        }

        // 4. Seed Testimonials
        if ((await prisma.testimonial.count()) === 0) {
            await prisma.testimonial.createMany({
                data: [
                    {
                        name: 'Rahul Sharma',
                        role: 'Full-Time Trader',
                        content: 'TradeX Floor Academy changed my life. From losing money to consistent profits within 6 months!',
                        image: '/images/testimonials/rahul.png',
                        profit: '+₹2.5L/month',
                        order: 1
                    },
                    {
                        name: 'Priya Patel',
                        role: 'Swing Trader',
                        content: 'The SMC strategies taught here are pure gold. Best investment I made in my trading career.',
                        image: '/images/testimonials/priya.png',
                        profit: '+₹1.8L/month',
                        order: 2
                    },
                    {
                        name: 'Amit Kumar',
                        role: 'Professional Trader',
                        content: 'Finally understood price action after years of struggling. The mentors are amazing!',
                        image: '/images/testimonials/amit.png',
                        profit: '+₹3.2L/month',
                        order: 3
                    },
                ]
            });
        }

        return NextResponse.json({ success: true, message: 'CMS Content Initialized' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
