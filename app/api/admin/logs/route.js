import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { rateLimitPresets } from '@/lib/rate-limit-middleware';
import { queryAuditLogs, exportAuditLogs, AUDIT_ACTIONS } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

// GET - Query audit logs with filters
const getLogsHandler = rateLimitPresets.adminRead(requireAdminAuth(async function GET(request) {
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const action = searchParams.get('action');
    const targetType = searchParams.get('targetType');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const outcome = searchParams.get('outcome');
    const exportFormat = searchParams.get('export');

    try {
        const filters = {};
        if (action) filters.action = action;
        if (targetType) filters.targetType = targetType;
        if (search) filters.search = search;
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;
        if (outcome) filters.outcome = outcome;

        // Handle export
        if (exportFormat === 'json') {
            const logs = await exportAuditLogs(filters);
            return new NextResponse(JSON.stringify(logs, null, 2), {
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.json"`,
                },
            });
        }

        // Regular paginated query
        const result = await queryAuditLogs(filters, page, limit);

        // Get available action types for filter dropdown
        const actionTypes = Object.keys(AUDIT_ACTIONS);

        return NextResponse.json({
            ...result,
            actionTypes,
        });

    } catch (error) {
        console.error('[Admin Logs] GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}));

export { getLogsHandler as GET };
