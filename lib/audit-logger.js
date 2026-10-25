import prisma from '@/lib/prisma';

/**
 * Enterprise Audit Logger
 * Logs all admin and system actions for compliance and debugging
 */

// Action Types - Standardized action names
export const AUDIT_ACTIONS = {
    // Auth
    ADMIN_LOGIN: 'ADMIN_LOGIN',
    ADMIN_LOGOUT: 'ADMIN_LOGOUT',
    LOGIN_FAILED: 'LOGIN_FAILED',

    // User Management
    USER_VIEW: 'USER_VIEW',
    USER_CREATE: 'USER_CREATE',
    USER_UPDATE: 'USER_UPDATE',
    USER_DELETE: 'USER_DELETE',
    USER_BAN: 'USER_BAN',
    USER_UNBAN: 'USER_UNBAN',
    USER_PROMOTE: 'USER_PROMOTE',
    USER_DEMOTE: 'USER_DEMOTE',
    USER_EXPORT: 'USER_EXPORT',

    // Product Management
    PRODUCT_CREATE: 'PRODUCT_CREATE',
    PRODUCT_UPDATE: 'PRODUCT_UPDATE',
    PRODUCT_DELETE: 'PRODUCT_DELETE',

    // Payment/Subscription
    SUBSCRIPTION_REVOKE: 'SUBSCRIPTION_REVOKE',
    PAYMENT_REFUND: 'PAYMENT_REFUND',

    // System
    SETTINGS_UPDATE: 'SETTINGS_UPDATE',
    CACHE_CLEAR: 'CACHE_CLEAR',
    CMS_UPDATE: 'CMS_UPDATE',

    // Content
    CONTENT_UPLOAD: 'CONTENT_UPLOAD',
    CONTENT_DELETE: 'CONTENT_DELETE',
};

// Target Types
export const TARGET_TYPES = {
    USER: 'User',
    PRODUCT: 'Product',
    PAYMENT: 'Payment',
    SUBSCRIPTION: 'Subscription',
    SETTINGS: 'Settings',
    CMS: 'CMS',
    CONTENT: 'Content',
};

/**
 * Log an audit event
 * @param {Object} options - Audit log options
 * @param {string} options.action - Action type from AUDIT_ACTIONS
 * @param {string} [options.actorId] - ID of the actor (admin/user)
 * @param {string} [options.actorEmail] - Email of the actor
 * @param {string} [options.actorRole] - Role of the actor (ADMIN/USER)
 * @param {string} [options.targetType] - Type of target from TARGET_TYPES
 * @param {string} [options.targetId] - ID of the target
 * @param {string} [options.details] - Human-readable description
 * @param {Object} [options.metadata] - Additional structured data
 * @param {string} [options.outcome] - SUCCESS, FAILURE, or PARTIAL
 * @param {Request} [request] - Optional request object for IP/UA extraction
 */
export async function logAudit(options, request = null) {
    const {
        action,
        actorId = null,
        actorEmail = null,
        actorRole = null,
        targetType = null,
        targetId = null,
        details = null,
        metadata = null,
        outcome = 'SUCCESS',
    } = options;

    // Extract IP and User-Agent from request if provided
    let ip = null;
    let userAgent = null;

    if (request) {
        ip = request.headers?.get?.('x-forwarded-for') ||
            request.headers?.get?.('x-real-ip') ||
            request.ip ||
            null;
        userAgent = request.headers?.get?.('user-agent') || null;
    }

    try {
        const log = await prisma.auditLog.create({
            data: {
                action,
                actorId,
                actorEmail,
                actorRole,
                targetType,
                targetId,
                details,
                metadata,
                ip,
                userAgent,
                outcome,
            },
        });

        return log;
    } catch (error) {
        // Never let logging errors break the application
        console.error('[AuditLogger] Failed to log:', error);
        return null;
    }
}

/**
 * Helper for logging admin actions (provides actor context)
 * @param {Object} admin - Admin user object (must have id, email, role)
 * @param {Object} options - Same as logAudit options (without actor fields)
 * @param {Request} [request] - Optional request object
 */
export async function logAdminAudit(admin, options, request = null) {
    return logAudit({
        ...options,
        actorId: admin.id,
        actorEmail: admin.email,
        actorRole: admin.role || 'ADMIN',
    }, request);
}

/**
 * Query audit logs with filters
 * @param {Object} filters - Query filters
 * @param {string} [filters.actorId] - Filter by actor
 * @param {string} [filters.action] - Filter by action
 * @param {string} [filters.targetType] - Filter by target type
 * @param {string} [filters.targetId] - Filter by target ID
 * @param {string} [filters.outcome] - Filter by outcome
 * @param {Date} [filters.startDate] - Start of date range
 * @param {Date} [filters.endDate] - End of date range
 * @param {string} [filters.search] - Search in details/email
 * @param {number} [page=1] - Page number
 * @param {number} [limit=50] - Items per page
 */
export async function queryAuditLogs(filters = {}, page = 1, limit = 50) {
    const {
        actorId,
        action,
        targetType,
        targetId,
        outcome,
        startDate,
        endDate,
        search,
    } = filters;

    const where = {};

    if (actorId) where.actorId = actorId;
    if (action) where.action = action;
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;
    if (outcome) where.outcome = outcome;

    // Date range filter
    if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
    }

    // Search filter
    if (search) {
        where.OR = [
            { actorEmail: { contains: search, mode: 'insensitive' } },
            { details: { contains: search, mode: 'insensitive' } },
        ];
    }

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.auditLog.count({ where }),
    ]);

    return {
        logs,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

/**
 * Get activity timeline for a specific user
 * @param {string} userId - User ID to get timeline for
 * @param {number} [limit=50] - Max items to return
 */
export async function getUserActivityTimeline(userId, limit = 50) {
    const logs = await prisma.auditLog.findMany({
        where: {
            OR: [
                { actorId: userId },
                { targetId: userId, targetType: TARGET_TYPES.USER },
            ],
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
    });

    return logs;
}

/**
 * Export audit logs as JSON (for compliance)
 * @param {Object} filters - Same filters as queryAuditLogs
 */
export async function exportAuditLogs(filters = {}) {
    const { logs } = await queryAuditLogs(filters, 1, 10000);
    return logs;
}

/**
 * Clean up old audit logs (retention policy)
 * @param {number} retentionDays - Days to keep logs (default 90)
 */
export async function cleanupOldLogs(retentionDays = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.auditLog.deleteMany({
        where: {
            timestamp: { lt: cutoffDate },
        },
    });

    return { deletedCount: result.count };
}
