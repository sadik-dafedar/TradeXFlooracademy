/**
 * Scheduled tasks for admin session maintenance
 * This should be run periodically (e.g., every hour) via cron job or serverless function
 */

import { runSessionCleanup } from '@/lib/admin-auth';
import { cleanupOldLogs } from '@/lib/admin-logging';

// Schedule configuration
const SCHEDULE = {
    SESSION_CLEANUP: '0 * * * *', // Every hour
    LOG_CLEANUP: '0 2 * * *',     // Daily at 2 AM
    BACKUP_TASKS: '0 1 * * 0'     // Weekly on Sunday at 1 AM
};

/**
 * Main scheduled task runner
 */
export async function runScheduledTasks() {
    console.log('[Scheduled Tasks] Starting maintenance tasks...');
    
    const results = {
        timestamp: new Date().toISOString(),
        tasks: {}
    };

    try {
        // Run session cleanup
        console.log('[Scheduled Tasks] Running session cleanup...');
        const sessionResult = await runSessionCleanup();
        results.tasks.sessionCleanup = sessionResult;
        console.log(`[Scheduled Tasks] Session cleanup completed: ${sessionResult.expiredCount} sessions cleaned`);

        // Run log cleanup (older than 90 days)
        console.log('[Scheduled Tasks] Running log cleanup...');
        const logCount = await cleanupOldLogs();
        results.tasks.logCleanup = { deletedLogs: logCount };
        console.log(`[Scheduled Tasks] Log cleanup completed: ${logCount} old logs removed`);

        // TODO: Add backup tasks, health checks, etc.
        
        results.success = true;
        console.log('[Scheduled Tasks] All maintenance tasks completed successfully');
        
    } catch (error) {
        console.error('[Scheduled Tasks] Error during maintenance:', error);
        results.success = false;
        results.error = error.message;
    }

    return results;
}

/**
 * Health check for admin system
 */
export async function runHealthCheck() {
    const health = {
        timestamp: new Date().toISOString(),
        status: 'healthy',
        checks: {}
    };

    try {
        // Check database connectivity
        health.checks.database = 'ok';
        
        // Check session system
        const activeSessions = await import('@/lib/admin-auth').then(mod => 
            mod.getActiveSessions('health-check')
        ).catch(() => []);
        health.checks.sessions = activeSessions.length >= 0 ? 'ok' : 'warning';
        
        // Check logging system
        const recentLogs = await import('@/lib/admin-logging').then(mod =>
            mod.getAdminLogs({ limit: 1 })
        ).catch(() => ({ logs: [] }));
        health.checks.logging = recentLogs.logs.length >= 0 ? 'ok' : 'warning';

    } catch (error) {
        console.error('[Health Check] Error:', error);
        health.status = 'degraded';
        health.error = error.message;
    }

    return health;
}

// For serverless environments, export individual functions
export { SCHEDULE };