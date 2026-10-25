import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // We use revalidateTag instead of static generation for cleaner ISR

export async function GET() {
    try {
        const [heroConfig, stats, features, testimonials] = await Promise.all([
            prisma.siteConfig.findUnique({ where: { key: 'hero_section' } }),
            prisma.stat.findMany({ orderBy: { order: 'asc' }, where: { active: true } }),
            prisma.feature.findMany({ orderBy: { order: 'asc' }, where: { active: true } }),
            prisma.testimonial.findMany({ orderBy: { order: 'asc' }, where: { active: true } }),
        ]);

        const hero = heroConfig?.value || {};

        return NextResponse.json({
            hero: {
                badge: hero.badge || 'Best Trading Institute in India',
                title_line1: hero.title_line1 || 'Master the Art of',
                title_highlight: hero.title_highlight || 'Professional Trading',
                subtitle: hero.subtitle || 'Become A Profitable Trader',
                description: hero.description || 'TradeX Floor Academy is the best stock market institute...',
                review_count: hero.review_count || '1500+ Students Enrolled'
            },
            stats: stats.length > 0 ? stats : [],
            features: features.length > 0 ? features : [],
            testimonials: testimonials.length > 0 ? testimonials : []
        }, {
            headers: {
                // Cache control handled by Next.js Data Cache in fetch(), this is direct DB so we rely on revalidateTag logic in client fetcher
            }
        });
    } catch (error) {
        console.error('CMS Fetch Error:', error);
        return NextResponse.json({ error: 'Failed to load content' }, { status: 500 });
    }
}
