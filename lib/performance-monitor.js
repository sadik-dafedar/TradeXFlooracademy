/**
 * Performance monitoring and analytics dashboard
 */

import { queryMetrics, connectionMonitor } from './db-optimization';
import { enhancedCache } from './cache';
import { NextResponse } from 'next/server';

/**
 * Performance metrics collector
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            api: new Map(),
            database: new Map(),
            cache: new Map(),
            frontend: new Map()
        };
        this.slowThresholds = {
            api: 2000, // 2 seconds
            db: 1000,  // 1 second
            cache: 100 // 100ms
        };
    }

    /**
     * Record API request metrics
     */
    recordAPIMetrics(path, method, duration, statusCode, userId = null) {
        const key = `${method}:${path}`;
        
        if (!this.metrics.api.has(key)) {
            this.metrics.api.set(key, {
                count: 0,
                totalTime: 0,
                avgTime: 0,
                maxTime: 0,
                minTime: Infinity,
                slowRequests: 0,
                statusCodes: {},
                users: new Set()
            });
        }

        const metric = this.metrics.api.get(key);
        metric.count++;
        metric.totalTime += duration;
        metric.avgTime = metric.totalTime / metric.count;
        metric.maxTime = Math.max(metric.maxTime, duration);
        metric.minTime = Math.min(metric.minTime, duration);
        
        if (duration > this.slowThresholds.api) {
            metric.slowRequests++;
        }
        
        // Track status codes
        metric.statusCodes[statusCode] = (metric.statusCodes[statusCode] || 0) + 1;
        
        // Track unique users
        if (userId) {
            metric.users.add(userId);
        }
    }

    /**
     * Record frontend performance metrics
     */
    recordFrontendMetrics(metrics) {
        const {
            page,
            loadTime,
            fcp, // First Contentful Paint
            lcp, // Largest Contentful Paint
            cls, // Cumulative Layout Shift
            fid, // First Input Delay
            userId
        } = metrics;

        if (!this.metrics.frontend.has(page)) {
            this.metrics.frontend.set(page, {
                count: 0,
                loadTimes: [],
                fcpTimes: [],
                lcpTimes: [],
                clsScores: [],
                fidTimes: [],
                users: new Set()
            });
        }

        const metric = this.metrics.frontend.get(page);
        metric.count++;
        metric.loadTimes.push(loadTime);
        if (fcp) metric.fcpTimes.push(fcp);
        if (lcp) metric.lcpTimes.push(lcp);
        if (cls) metric.clsScores.push(cls);
        if (fid) metric.fidTimes.push(fid);
        if (userId) metric.users.add(userId);
    }

    /**
     * Get performance report
     */
    getReport(timeRange = '24h') {
        const report = {
            timestamp: new Date().toISOString(),
            timeRange,
            summary: {
                totalRequests: 0,
                slowRequests: 0,
                avgResponseTime: 0,
                cacheHitRate: 0,
                dbHealth: 'unknown'
            },
            api: this.getAPISummary(),
            database: queryMetrics.getReport(),
            cache: this.getCacheSummary(),
            frontend: this.getFrontendSummary()
        };

        // Calculate overall summary
        report.summary.totalRequests = Array.from(this.metrics.api.values())
            .reduce((sum, metric) => sum + metric.count, 0);
        
        report.summary.slowRequests = Array.from(this.metrics.api.values())
            .reduce((sum, metric) => sum + metric.slowRequests, 0);
        
        const totalApiTime = Array.from(this.metrics.api.values())
            .reduce((sum, metric) => sum + metric.totalTime, 0);
        
        report.summary.avgResponseTime = report.summary.totalRequests > 0 
            ? totalApiTime / report.summary.totalRequests 
            : 0;

        // Add cache hit rate
        report.summary.cacheHitRate = this.calculateCacheHitRate();

        // Add database health
        report.summary.dbHealth = connectionMonitor.getHealth().status;

        return report;
    }

    /**
     * Get API performance summary
     */
    getAPISummary() {
        const summary = {
            endpoints: [],
            slowEndpoints: [],
            errorRates: []
        };

        for (const [key, metric] of this.metrics.api) {
            const [method, path] = key.split(':');
            const endpointMetric = {
                method,
                path,
                count: metric.count,
                avgTime: Math.round(metric.avgTime),
                maxTime: metric.maxTime,
                minTime: metric.minTime === Infinity ? 0 : metric.minTime,
                slowRequests: metric.slowRequests,
                successRate: this.calculateSuccessRate(metric.statusCodes),
                uniqueUsers: metric.users.size
            };

            summary.endpoints.push(endpointMetric);

            if (endpointMetric.slowRequests > 0) {
                summary.slowEndpoints.push(endpointMetric);
            }

            // Calculate error rate
            const errorCount = Object.entries(metric.statusCodes)
                .filter(([code]) => code.startsWith('5'))
                .reduce((sum, [, count]) => sum + count, 0);
            
            if (errorCount > 0) {
                summary.errorRates.push({
                    method,
                    path,
                    errorRate: (errorCount / metric.count * 100).toFixed(2)
                });
            }
        }

        // Sort by average time descending
        summary.endpoints.sort((a, b) => b.avgTime - a.avgTime);
        summary.slowEndpoints.sort((a, b) => b.slowRequests - a.slowRequests);
        summary.errorRates.sort((a, b) => b.errorRate - a.errorRate);

        return summary;
    }

    /**
     * Get cache performance summary
     */
    getCacheSummary() {
        // This would integrate with actual cache metrics
        return {
            hitRate: this.calculateCacheHitRate(),
            totalRequests: 0,
            avgLatency: 0
        };
    }

    /**
     * Get frontend performance summary
     */
    getFrontendSummary() {
        const summary = {
            pages: []
        };

        for (const [page, metric] of this.metrics.frontend) {
            summary.pages.push({
                page,
                visits: metric.count,
                avgLoadTime: this.average(metric.loadTimes),
                avgFCP: this.average(metric.fcpTimes),
                avgLCP: this.average(metric.lcpTimes),
                avgCLS: this.average(metric.clsScores),
                avgFID: this.average(metric.fidTimes),
                uniqueUsers: metric.users.size
            });
        }

        return summary;
    }

    /**
     * Calculate success rate from status codes
     */
    calculateSuccessRate(statusCodes) {
        const total = Object.values(statusCodes).reduce((sum, count) => sum + count, 0);
        const success = Object.entries(statusCodes)
            .filter(([code]) => code.startsWith('2'))
            .reduce((sum, [, count]) => sum + count, 0);
        
        return total > 0 ? ((success / total) * 100).toFixed(2) : '100.00';
    }

    /**
     * Calculate cache hit rate
     */
    calculateCacheHitRate() {
        // Placeholder - would integrate with actual cache metrics
        return 'N/A';
    }

    /**
     * Calculate average of array
     */
    average(arr) {
        return arr.length > 0 ? arr.reduce((sum, val) => sum + val, 0) / arr.length : 0;
    }

    /**
     * Clear old metrics
     */
    clearOldMetrics(maxAgeHours = 24) {
        const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
        
        // Clear old API metrics
        for (const [key, metric] of this.metrics.api) {
            // Implementation would depend on how timestamps are stored
        }
        
        // Clear old frontend metrics
        for (const [key, metric] of this.metrics.frontend) {
            // Implementation would depend on how timestamps are stored
        }
    }
}

/**
 * Performance monitoring API route handler
 */
export async function GET(request) {
    try {
        const monitor = new PerformanceMonitor();
        const report = monitor.getReport();
        
        return NextResponse.json(report);
    } catch (error) {
        console.error('[Performance Monitor] Error:', error);
        return NextResponse.json({ error: 'Failed to generate performance report' }, { status: 500 });
    }
}

/**
 * Frontend performance reporting API
 */
export async function POST(request) {
    try {
        const data = await request.json();
        const monitor = new PerformanceMonitor();
        
        if (data.type === 'frontend') {
            monitor.recordFrontendMetrics(data.metrics);
        }
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Performance Reporter] Error:', error);
        return NextResponse.json({ error: 'Failed to record metrics' }, { status: 500 });
    }
}

// Export monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Periodic cleanup
if (typeof window === 'undefined') {
    setInterval(() => {
        const monitor = new PerformanceMonitor();
        monitor.clearOldMetrics(24);
    }, 3600000); // Every hour
}