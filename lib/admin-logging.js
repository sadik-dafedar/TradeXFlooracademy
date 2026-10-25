import { prisma } from '@/lib/prisma';

/**
 * Comprehensive Admin Activity Logging System
 */

// Log severity levels
const LOG_LEVELS = {
    INFO: 'INFO',
    WARN: 'WARN', 
    ERROR: 'ERROR',
    SECURITY: 'SECURITY'
};

// Common admin actions
const ACTIONS = {
    // Authentication
    ADMIN_LOGIN: 'Admin Login',
    ADMIN_LOGOUT: 'Admin Logout',
    FAILED_LOGIN: 'Failed Login Attempt',
    OTP_SENT: 'OTP Sent',
    
    // User Management
    USER_CREATE: 'Create User',
    USER_UPDATE: 'Update User', 
    USER_DELETE: 'Delete User',
    USER_BAN: 'Ban User',
    USER_UNBAN: 'Unban User',
    USER_ROLE_CHANGE: 'Change User Role',
    
    // Product Management
    PRODUCT_CREATE: 'Create Product',
    PRODUCT_UPDATE: 'Update Product',
    PRODUCT_DELETE: 'Delete Product',
    
    // System Configuration
    SETTINGS_UPDATE: 'Update Settings',
    MAINTENANCE_TOGGLE: 'Toggle Maintenance Mode',
    
    // Payments
    PAYMENT_VIEW: 'View Payment',
    REFUND_PROCESS: 'Process Refund',
    
    // Content Management
    CMS_UPDATE: 'Update CMS Content',
    TESTIMONIAL_ADD: 'Add Testimonial',
    FEATURE_ADD: 'Add Feature',
    
    // Security Events
    PERMISSION_VIOLATION: 'Permission Violation',
    RATE_LIMIT_EXCEEDED: 'Rate Limit Exceeded',
    SUSPICIOUS_ACTIVITY: 'Suspicious Activity'
};

/**
 * Log admin activity with comprehensive metadata
 * @param {Object} options - Logging options
 * @param {string} options.adminId - Admin user ID
 * @param {string} options.action - Action performed
 * @param {string} options.details - Detailed description
 * @param {string} [options.targetId] - ID of affected resource
 * @param {string} [options.level] - Log severity level
 * @param {Object} [options.metadata] - Additional structured data
 * @param {Request} [request] - HTTP request object for IP/user-agent
 */
export async function logAdminActivity(options, request = null) {
    const {
        adminId,
        action,
        details,
        targetId = null,
        level = LOG_LEVELS.INFO,
        metadata = {}
    } = options;

    try {
        // Extract request metadata
        const requestMetadata = request ? {
            ipAddress: getClientIP(request),
            userAgent: request.headers.get('user-agent') || 'unknown',
            method: request.method,
            url: request.url
        } : {};

        // Combine all metadata
        const fullMetadata = {
            ...metadata,
            ...requestMetadata,
            timestamp: new Date().toISOString(),
            level
        };

        // Create log entry
        const logEntry = await prisma.adminLog.create({
            data: {
                adminId,
                action,
                targetId,
                details: `${details} | Metadata: ${JSON.stringify(fullMetadata)}`,
                createdAt: new Date()
            }
        });

        // Also log to console for real-time monitoring
        console.log(`[Admin Log] ${level} - ${action}: ${details}`, {
            adminId,
            targetId,
            ...fullMetadata
        });

        return logEntry;

    } catch (error) {
        console.error('[Admin Log] Failed to create log entry:', error);
        // Don't throw - logging failure shouldn't break the main operation
        return null;
    }
}

/**
 * Log security-related events
 * @param {Object} options - Security event options
 * @param {string} options.event - Type of security event
 * @param {string} options.description - Event description
 * @param {Object} [options.details] - Additional details
 * @param {Request} [request] - HTTP request object
 */
export async function logSecurityEvent(options, request = null) {
    const {
        event,
        description,
        details = {},
        adminId = null
    } = options;

    return await logAdminActivity({
        adminId,
        action: `SECURITY: ${event}`,
        details: description,
        level: LOG_LEVELS.SECURITY,
        metadata: {
            securityEvent: event,
            ...details
        }
    }, request);
}

/**
 * Log failed authentication attempts
 * @param {string} email - Email that attempted login
 * @param {string} reason - Failure reason
 * @param {Request} [request] - HTTP request object
 */
export async function logFailedAuth(email, reason, request = null) {
    const ipAddress = request ? getClientIP(request) : 'unknown';
    
    return await logSecurityEvent({
        event: 'FAILED_AUTH',
        description: `Failed login attempt for ${email}`,
        details: {
            email,
            reason,
            ipAddress
        }
    }, request);
}

/**
 * Log suspicious activities
 * @param {Object} options - Suspicious activity options
 * @param {string} options.adminId - Admin ID
 * @param {string} options.activity - Description of suspicious activity
 * @param {Object} [options.details] - Additional details
 * @param {Request} [request] - HTTP request object
 */
export async function logSuspiciousActivity(options, request = null) {
    const { adminId, activity, details = {} } = options;
    
    return await logSecurityEvent({
        event: 'SUSPICIOUS_ACTIVITY',
        description: activity,
        details: {
            ...details,
            flaggedBy: 'system'
        },
        adminId
    }, request);
}

/**
 * Get client IP from request
 * @param {Request} request - HTTP request object
 * @returns {string} Client IP address
 */
function getClientIP(request) {
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
           request.headers.get('x-real-ip') ||
           'unknown';
}

/**
 * Get paginated admin logs with filtering
 * @param {Object} options - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=50] - Items per page
 * @param {string} [options.level] - Filter by log level
 * @param {string} [options.action] - Filter by action
 * @param {Date} [options.startDate] - Filter from date
 * @param {Date} [options.endDate] - Filter to date
 * @returns {Promise<Object>} Paginated logs with metadata
 */
export async function getAdminLogs(options = {}) {
    const {
        page = 1,
        limit = 50,
        level,
        action,
        startDate,
        endDate,
        adminId
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    
    if (level) where.action = { contains: level };
    if (action) where.action = { contains: action };
    if (adminId) where.adminId = adminId;
    
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
    }

    try {
        const [logs, total] = await Promise.all([
            prisma.adminLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    admin: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true
                        }
                    }
                }
            }),
            prisma.adminLog.count({ where })
        ]);

        return {
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        };

    } catch (error) {
        console.error('[Admin Logs] Failed to fetch logs:', error);
        throw new Error('Failed to retrieve admin logs');
    }
}

/**
 * Export logs to CSV format
 * @param {Object} options - Export options
 * @returns {Promise<string>} CSV formatted logs
 */
export async function exportLogsToCSV(options = {}) {
    const logsData = await getAdminLogs({ ...options, limit: 1000 });
    
    // CSV headers
    const headers = ['Timestamp', 'Admin', 'Action', 'Details', 'Level'];
    const rows = logsData.logs.map(log => [
        log.createdAt.toISOString(),
        `${log.admin?.name || 'Unknown'} (${log.admin?.email || 'N/A'})`,
        log.action,
        log.details,
        getLogLevelFromDetails(log.details)
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

/**
 * Extract log level from details string
 * @param {string} details - Log details
 * @returns {string} Log level
 */
function getLogLevelFromDetails(details) {
    if (details.includes('SECURITY:')) return 'SECURITY';
    if (details.includes('ERROR')) return 'ERROR';
    if (details.includes('WARN')) return 'WARN';
    return 'INFO';
}

/**
 * Cleanup old logs (keep last 90 days)
 */
export async function cleanupOldLogs() {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 90);
        
        const result = await prisma.adminLog.deleteMany({
            where: {
                createdAt: {
                    lt: cutoffDate
                }
            }
        });
        
        console.log(`[Admin Logs] Cleaned up ${result.count} old log entries`);
        return result.count;
        
    } catch (error) {
        console.error('[Admin Logs] Cleanup failed:', error);
        return 0;
    }
}

// Export constants and types
export { LOG_LEVELS, ACTIONS };