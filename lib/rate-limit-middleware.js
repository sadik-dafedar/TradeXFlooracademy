import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * Rate limiting middleware for API routes
 * @param {Object} options - Rate limiting configuration
 * @param {number} options.requests - Number of requests allowed
 * @param {number} options.window - Time window in seconds
 * @param {string} options.keyPrefix - Prefix for rate limit key
 * @param {Function} options.getKey - Function to generate rate limit key from request
 * @returns {Function} Middleware function
 */
export function withRateLimit(options = {}) {
    const {
        requests = 100,
        window = 900, // 15 minutes
        keyPrefix = 'api',
        getKey = (req) => {
            // Default: Use IP address
            return req.headers.get('x-forwarded-for') || 
                   req.headers.get('x-real-ip') || 
                   'unknown';
        }
    } = options;

    return (handler) => {
        return async (request, ...args) => {
            try {
                const identifier = getKey(request);
                const route = `${keyPrefix}:${request.nextUrl.pathname}`;
                
                const rateCheck = await checkRateLimit(identifier, route, requests, window);
                
                if (!rateCheck.success) {
                    console.log(`[Rate Limit] Blocked ${identifier} on ${route}`);
                    return NextResponse.json(
                        { 
                            error: 'Rate limit exceeded', 
                            retryAfter: rateCheck.retryAfter || window
                        }, 
                        { 
                            status: 429,
                            headers: {
                                'Retry-After': (rateCheck.retryAfter || window).toString()
                            }
                        }
                    );
                }

                // Add rate limit info to response headers
                const response = await handler(request, ...args);
                
                if (response instanceof NextResponse) {
                    response.headers.set('X-RateLimit-Remaining', rateCheck.remaining?.toString() || '0');
                    response.headers.set('X-RateLimit-Limit', requests.toString());
                }
                
                return response;

            } catch (error) {
                console.error('[Rate Limit] Middleware error:', error);
                // Fail open to avoid blocking legitimate requests
                return handler(request, ...args);
            }
        };
    };
}

/**
 * Admin-specific rate limiting presets
 */
export const adminRateLimits = {
    // Strict rate limiting for authentication
    auth: {
        requests: 5,
        window: 900, // 15 minutes
        keyPrefix: 'admin_auth'
    },
    
    // Moderate rate limiting for read operations
    read: {
        requests: 100,
        window: 900, // 15 minutes
        keyPrefix: 'admin_read'
    },
    
    // Strict rate limiting for write operations
    write: {
        requests: 30,
        window: 900, // 15 minutes
        keyPrefix: 'admin_write'
    },
    
    // Very strict for sensitive operations
    sensitive: {
        requests: 10,
        window: 900, // 15 minutes
        keyPrefix: 'admin_sensitive'
    }
};

/**
 * Pre-configured rate limiting middlewares
 */
export const rateLimitPresets = {
    // Admin authentication (OTP sending)
    adminAuth: withRateLimit(adminRateLimits.auth),
    
    // Admin read operations (dashboard, lists)
    adminRead: withRateLimit(adminRateLimits.read),
    
    // Admin write operations (create/update/delete)
    adminWrite: withRateLimit(adminRateLimits.write),
    
    // Sensitive operations (user bans, payments)
    adminSensitive: withRateLimit(adminRateLimits.sensitive),
    
    // Generic API rate limiting
    api: withRateLimit()
};

/**
 * Get client IP from request
 * @param {Request} request - Next.js request object
 * @returns {string} Client IP address
 */
export function getClientIP(request) {
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
           request.headers.get('x-real-ip') ||
           request.connection?.remoteAddress ||
           request.socket?.remoteAddress ||
           'unknown';
}

/**
 * Create rate limit key using admin email for authenticated routes
 * @param {Request} request - Next.js request object
 * @returns {string} Rate limit key
 */
export function getAdminRateLimitKey(request) {
    // For admin routes, use admin email if available, otherwise IP
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        // Could decode JWT here to get admin email, but for now use IP
        return getClientIP(request);
    }
    return getClientIP(request);
}