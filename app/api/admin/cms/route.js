import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

// GET: Fetch ALL CMS Data for Editor
export async function GET(req) {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [heroConfig, stats, features, testimonials] = await Promise.all([
            prisma.siteConfig.findUnique({ where: { key: 'hero_section' } }),
            prisma.stat.findMany({ orderBy: { order: 'asc' } }),
            prisma.feature.findMany({ orderBy: { order: 'asc' } }),
            prisma.testimonial.findMany({ orderBy: { order: 'asc' } }),
        ]);

        return NextResponse.json({
            hero: heroConfig?.value || {},
            stats: stats,
            features: features,
            testimonials: testimonials
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Handle Updates
export async function POST(req) {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { section, action, data, id } = body;

        // 1. HERO SECTION UPDATE
        if (section === 'hero') {
            await prisma.siteConfig.upsert({
                where: { key: 'hero_section' },
                update: { value: data },
                create: { key: 'hero_section', value: data }
            });
        }

        // 2. STATS MANAGEMENT
        else if (section === 'stats') {
            if (action === 'update') {
                await prisma.stat.update({ where: { id }, data });
            } else if (action === 'create') {
                await prisma.stat.create({ data });
            } else if (action === 'delete') {
                await prisma.stat.delete({ where: { id } });
            }
        }

        // 3. FEATURES MANAGEMENT
        else if (section === 'features') {
            if (action === 'update') {
                await prisma.feature.update({ where: { id }, data });
            } else if (action === 'create') {
                await prisma.feature.create({ data });
            } else if (action === 'delete') {
                await prisma.feature.delete({ where: { id } });
            }
        }

        // 4. TESTIMONIALS MANAGEMENT
        else if (section === 'testimonials') {
            if (action === 'update') {
                await prisma.testimonial.update({ where: { id }, data });
            } else if (action === 'create') {
                await prisma.testimonial.create({ data });
            } else if (action === 'delete') {
                await prisma.testimonial.delete({ where: { id } });
            }
        }

        // Revalidate Frontend Cache
        revalidateTag('site-content');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('CMS Update Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
