import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { auth } from '@/auth';
import { logAdminActivity, ACTIONS } from '@/lib/admin-logging';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let config = await db.systemConfig.findUnique({
            where: { key: 'main_config' }
        });

        if (!config) {
            // Create default if not exists
            config = await db.systemConfig.create({
                data: { key: 'main_config' }
            });
        }

        return NextResponse.json(config);
    } catch (error) {
        console.error('Settings GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();

        // Prevent updating key or id
        delete data.id;
        delete data.key;
        delete data.updatedAt;

        const config = await db.systemConfig.upsert({
            where: { key: 'main_config' },
            update: data,
            create: { ...data, key: 'main_config' }
        });

        await logAdminActivity({
            adminId: session.user.id,
            action: ACTIONS.SETTINGS_UPDATE,
            details: 'Updated global system configuration'
        });

        return NextResponse.json(config);
    } catch (error) {
        console.error('Settings POST Error:', error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
