/**
 * Database query optimization and performance monitoring
 */

import prisma from "@/lib/prisma";

// Only import perf_hooks when running on server
const isServer = typeof window === 'undefined';
let performance;
if (isServer) {
    performance = require('perf_hooks').performance;
} else {
    performance = window.performance;
}

/**
 * Query performance metrics collector
 */
class QueryMetricsCollector {
    constructor() {
        this.metrics = new Map();
        this.slowQueryThreshold = 1000; // 1 second threshold
    }

    /**
     * Record query execution metrics
     */
    recordQuery(model, operation, duration, success = true) {
        const key = `${model}.${operation}`;
        
        if (!this.metrics.has(key)) {
            this.metrics.set(key, {
                count: 0,
                totalTime: 0,
                avgTime: 0,
                maxTime: 0,
                minTime: Infinity,
                slowQueries: 0,
                errors: 0
            });
        }

        const metric = this.metrics.get(key);
        metric.count++;
        metric.totalTime += duration;
        metric.avgTime = metric.totalTime / metric.count;
        metric.maxTime = Math.max(metric.maxTime, duration);
        metric.minTime = Math.min(metric.minTime, duration);
        
        if (duration > this.slowQueryThreshold) {
            metric.slowQueries++;
        }
        
        if (!success) {
            metric.errors++;
        }
    }

    /**
     * Get performance report
     */
    getReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalQueries: 0,
                slowQueries: 0,
                errors: 0,
                avgResponseTime: 0
            },
            queries: []
        };

        let totalQueries = 0;
        let totalSlowQueries = 0;
        let totalErrors = 0;
        let totalTime = 0;

        for (const [key, metric] of this.metrics) {
            const [model, operation] = key.split('.');
            
            report.queries.push({
                model,
                operation,
                ...metric,
                minTime: metric.minTime === Infinity ? 0 : metric.minTime
            });

            totalQueries += metric.count;
            totalSlowQueries += metric.slowQueries;
            totalErrors += metric.errors;
            totalTime += metric.totalTime;
        }

        report.summary.totalQueries = totalQueries;
        report.summary.slowQueries = totalSlowQueries;
        report.summary.errors = totalErrors;
        report.summary.avgResponseTime = totalQueries > 0 ? totalTime / totalQueries : 0;

        // Sort by average time descending
        report.queries.sort((a, b) => b.avgTime - a.avgTime);

        return report;
    }

    /**
     * Clear metrics
     */
    clear() {
        this.metrics.clear();
    }
}

// Global metrics collector
export const queryMetrics = new QueryMetricsCollector();

/**
 * Optimized Prisma client with performance monitoring
 */
export class OptimizedPrismaClient {
    constructor() {
        this.client = prisma;
    }

    /**
     * Execute query with performance monitoring
     */
    async executeWithMonitoring(model, operation, queryFn, ...args) {
        const startTime = performance.now();
        let success = true;

        try {
            const result = await queryFn.call(this.client[model], ...args);
            return result;
        } catch (error) {
            success = false;
            throw error;
        } finally {
            const duration = performance.now() - startTime;
            queryMetrics.recordQuery(model, operation, duration, success);
        }
    }

    /**
     * Optimized find many with pagination and indexing hints
     */
    async findManyOptimized(model, options = {}) {
        const {
            where = {},
            orderBy = { createdAt: 'desc' },
            select,
            include,
            page = 1,
            limit = 20,
            useIndexHints = true
        } = options;

        // Apply pagination
        const skip = (page - 1) * limit;

        // Build query with optimization hints
        const queryOptions = {
            where,
            orderBy,
            skip,
            take: limit
        };

        if (select) queryOptions.select = select;
        if (include) queryOptions.include = include;

        return await this.executeWithMonitoring(
            model,
            'findMany',
            this.client[model].findMany,
            queryOptions
        );
    }

    /**
     * Optimized count query
     */
    async countOptimized(model, where = {}) {
        return await this.executeWithMonitoring(
            model,
            'count',
            this.client[model].count,
            { where }
        );
    }

    /**
     * Batch operations for better performance
     */
    async batchOperations(operations) {
        const results = [];
        const errors = [];

        // Group operations by model for transaction optimization
        const groupedOps = operations.reduce((acc, op) => {
            if (!acc[op.model]) acc[op.model] = [];
            acc[op.model].push(op);
            return acc;
        }, {});

        // Execute grouped operations
        for (const [model, ops] of Object.entries(groupedOps)) {
            try {
                const batchResults = await this.client.$transaction(
                    ops.map(op => {
                        const { operation, args } = op;
                        return this.client[model][operation](...args);
                    })
                );
                results.push(...batchResults);
            } catch (error) {
                errors.push({ model, operations: ops, error });
            }
        }

        return { results, errors };
    }
}

/**
 * Database indexing recommendations
 */
export const INDEX_RECOMMENDATIONS = {
    users: [
        { fields: ['email'], unique: true, name: 'idx_users_email' },
        { fields: ['username'], unique: true, name: 'idx_users_username' },
        { fields: ['role'], name: 'idx_users_role' },
        { fields: ['isVerified'], name: 'idx_users_verified' },
        { fields: ['isBanned'], name: 'idx_users_banned' },
        { fields: ['createdAt'], name: 'idx_users_created_at' }
    ],
    payments: [
        { fields: ['userId'], name: 'idx_payments_user_id' },
        { fields: ['status'], name: 'idx_payments_status' },
        { fields: ['createdAt'], name: 'idx_payments_created_at' },
        { fields: ['amount'], name: 'idx_payments_amount' }
    ],
    products: [
        { fields: ['isActive'], name: 'idx_products_active' },
        { fields: ['createdAt'], name: 'idx_products_created_at' },
        { fields: ['price'], name: 'idx_products_price' }
    ],
    adminSessions: [
        { fields: ['adminId'], name: 'idx_admin_sessions_admin_id' },
        { fields: ['expiresAt'], name: 'idx_admin_sessions_expires_at' },
        { fields: ['isActive'], name: 'idx_admin_sessions_active' }
    ]
};

/**
 * Query optimization utilities
 */
export const queryOptimizer = {
    /**
     * Add select optimization to reduce data transfer
     */
    optimizeSelect(selectFields, requiredFields = []) {
        if (!selectFields) return undefined;
        
        // Always include required fields
        const optimizedSelect = { ...selectFields };
        requiredFields.forEach(field => {
            optimizedSelect[field] = true;
        });
        
        return optimizedSelect;
    },

    /**
     * Optimize include relations to avoid N+1 queries
     */
    optimizeInclude(include, maxDepth = 2) {
        if (!include) return undefined;
        
        // Limit relation depth to prevent excessive joins
        const optimizedInclude = {};
        Object.keys(include).forEach(key => {
            if (typeof include[key] === 'object' && include[key] !== null) {
                // Recursively optimize nested includes with depth limit
                if (maxDepth > 1) {
                    optimizedInclude[key] = this.optimizeInclude(include[key], maxDepth - 1);
                }
            } else {
                optimizedInclude[key] = include[key];
            }
        });
        
        return optimizedInclude;
    },

    /**
     * Apply query hints for better performance
     */
    applyQueryHints(query, hints = {}) {
        // This would be implemented based on your specific database
        // For MongoDB/Prisma, we focus on proper indexing and query structure
        return query;
    }
};

/**
 * Connection pool monitoring
 */
export class ConnectionPoolMonitor {
    constructor() {
        this.poolStats = {
            totalConnections: 0,
            activeConnections: 0,
            idleConnections: 0,
            waitingRequests: 0
        };
    }

    /**
     * Update pool statistics
     */
    updateStats(stats) {
        Object.assign(this.poolStats, stats);
    }

    /**
     * Get pool health status
     */
    getHealth() {
        const utilization = this.poolStats.totalConnections > 0 
            ? this.poolStats.activeConnections / this.poolStats.totalConnections 
            : 0;

        return {
            ...this.poolStats,
            utilization: Math.round(utilization * 100),
            status: utilization > 0.8 ? 'WARNING' : 
                   utilization > 0.9 ? 'CRITICAL' : 'HEALTHY'
        };
    }
}

// Export optimized client instance
export const optimizedPrisma = new OptimizedPrismaClient();
export const connectionMonitor = new ConnectionPoolMonitor();

// Periodic metrics reporting
if (typeof window === 'undefined') { // Server-side only
    setInterval(() => {
        const report = queryMetrics.getReport();
        if (report.summary.totalQueries > 0) {
            console.log('[DB Performance Report]', JSON.stringify(report.summary, null, 2));
        }
    }, 300000); // Every 5 minutes
}