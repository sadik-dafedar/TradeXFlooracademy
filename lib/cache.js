import { redis, isRedisAvailable } from './redis';
import prisma from './prisma';

// Helper to mask email for logging (PII protection)
const maskEmail = (email) => email ? `${email.substring(0, 3)}***` : 'unknown';

/**
 * Get cached data or fetch from source
 * @param {string} key - Redis key
 * @param {Function} fetchFn - Async function to fetch data if cache miss
 * @param {number} ttlSeconds - Time to live in seconds
 * @returns {Promise<any>} - Cached or fresh data
 */
export async function getCached(key, fetchFn, ttlSeconds = 300) {
    if (!isRedisAvailable()) {
        return await fetchFn();
    }

    try {
        const cached = await redis.get(key);
        if (cached !== null) {
            console.log(`[Cache HIT] ${key}`);
            // Handle both string and object returns from Upstash
            return typeof cached === 'string' ? JSON.parse(cached) : cached;
        }

        console.log(`[Cache MISS] ${key}`);
        const data = await fetchFn();

        if (data !== null && data !== undefined) {
            await redis.set(key, JSON.stringify(data), { ex: ttlSeconds });
        }

        return data;
    } catch (error) {
        console.error(`[Cache Error] ${key}:`, error.message);
        return await fetchFn();
    }
}

/**
 * Set cache with TTL
 */
export async function setCache(key, data, ttlSeconds = 300) {
    if (!isRedisAvailable()) return false;
    try {
        await redis.set(key, JSON.stringify(data), { ex: ttlSeconds });
        return true;
    } catch (error) {
        console.error('[Cache Set Error]:', error.message);
        return false;
    }
}

/**
 * Get cache value
 */
export async function getCache(key) {
    if (!isRedisAvailable()) return null;
    try {
        const cached = await redis.get(key);
        if (cached === null) return null;
        return typeof cached === 'string' ? JSON.parse(cached) : cached;
    } catch (error) {
        console.error('[Cache Get Error]:', error.message);
        return null;
    }
}

/**
 * Delete cache
 */
export async function deleteCache(key) {
    if (!isRedisAvailable()) return false;
    try {
        await redis.del(key);
        return true;
    } catch (error) {
        console.error('[Cache Delete Error]:', error.message);
        return false;
    }
}

/**
 * Invalidate cache by key pattern
 */
export async function invalidateCache(pattern) {
    if (!isRedisAvailable()) return;

    try {
        if (pattern.includes('*')) {
            let cursor = 0;
            let totalDeleted = 0;
            do {
                const [nextCursor, keys] = await redis.scan(cursor, { match: pattern, count: 100 });
                cursor = parseInt(nextCursor, 10);
                if (keys.length > 0) {
                    await redis.del(...keys);
                    totalDeleted += keys.length;
                }
            } while (cursor !== 0);
            if (totalDeleted > 0) {
                console.log(`[Cache Invalidated] ${totalDeleted} keys matching ${pattern}`);
            }
        } else {
            await redis.del(pattern);
            console.log(`[Cache Invalidated] ${pattern}`);
        }
    } catch (error) {
        console.error('[Cache Invalidation Error]:', error.message);
    }
}

/**
 * Invalidate all caches for a specific user
 */
export async function invalidateUserCache(userId) {
    await invalidateCache(`user:${userId}:*`);
    await invalidateCache(`sub:${userId}:*`);
}

/**
 * Invalidate products cache
 */
export async function invalidateProductCache() {
    await invalidateCache('products:*');
}

/**
 * Get user by email with caching
 * Primarily used for admin role checks in API routes
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
export async function getCachedUserByEmail(email) {
    if (!email) return null;

    return await getCached(
        cacheKeys.userByEmail(email),
        async () => {
            return await prisma.user.findUnique({
                where: { email },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    isBanned: true
                }
            });
        },
        900 // 15 minutes cache for role checks
    );
}

/**
 * Invalidate user by email cache
 */
export async function invalidateUserEmailCache(email) {
    if (!email) return;
    await deleteCache(cacheKeys.userByEmail(email));
}

/**
 * Invalidate admin stats cache
 */
export async function invalidateAdminCache() {
    await invalidateCache('admin:*');
}

// ═══════════════════════════════════════════════════════════════
// OTP STORAGE (Redis with DB fallback)
// ═══════════════════════════════════════════════════════════════

/**
 * Store OTP in Redis (primary) with DB fallback
 * Auto-expires in Redis, manual cleanup in DB
 * @param {string} email - User email
 * @param {string} otp - OTP code
 * @param {number} ttlSeconds - Time to live in seconds
 * @param {string} type - Optional type prefix (e.g., 'admin', 'user')
 */
export async function storeOTP(email, otp, ttlSeconds = 300, type = '') {
    // Include type in key to separate admin/user OTPs
    const key = type ? `otp:${type}:${email}` : cacheKeys.otp(email);

    // Try Redis first
    if (isRedisAvailable()) {
        try {
            await redis.set(key, otp, { ex: ttlSeconds });
            console.log(`[OTP Stored] Redis: ${maskEmail(email)}`);
            return true;
        } catch (error) {
            console.error('[OTP Redis Error]:', error.message);
        }
    }

    // Fallback to DB
    try {
        const expires = new Date(Date.now() + ttlSeconds * 1000);
        await prisma.verificationToken.upsert({
            where: { identifier: email },
            update: { token: otp, expires },
            create: { identifier: email, token: otp, expires },
        });
        console.log(`[OTP Stored] DB: ${maskEmail(email)}`);
        return true;
    } catch (error) {
        console.error('[OTP DB Error]:', error.message);
        return false;
    }
}

/**
 * Verify OTP from Redis (primary) with DB fallback
 * @param {string} email - User email
 * @param {string} otp - OTP code to verify
 * @param {string} type - Optional type prefix (e.g., 'admin', 'user')
 */
export async function verifyOTP(email, otp, type = '') {
    // Must use same key format as storeOTP
    const key = type ? `otp:${type}:${email}` : cacheKeys.otp(email);

    // Try Redis first
    if (isRedisAvailable()) {
        try {
            const storedOtp = await redis.get(key);
            console.log(`[OTP Debug] Key: ${key}, Stored: ${storedOtp}, Provided: ${otp}, Type match: ${typeof storedOtp} vs ${typeof otp}`);

            // Ensure string comparison (Redis may return different types)
            if (storedOtp !== null && storedOtp.toString() === otp.toString()) {
                await redis.del(key); // Delete after successful verification
                console.log(`[OTP Verified] Redis: ${maskEmail(email)}`);
                return { valid: true, source: 'redis' };
            }
            if (storedOtp !== null) {
                console.log(`[OTP Mismatch] Redis: stored=${storedOtp}, provided=${otp}`);
                return { valid: false, error: 'Invalid OTP' };
            }
            // OTP not in Redis, try DB
            console.log(`[OTP Not Found] Redis key ${key} not found, trying DB`);
        } catch (error) {
            console.error('[OTP Redis Verify Error]:', error.message);
        }
    }

    // Fallback to DB
    try {
        const token = await prisma.verificationToken.findUnique({
            where: { identifier: email }
        });

        if (!token) {
            return { valid: false, error: 'OTP not found or expired' };
        }

        if (token.token !== otp) {
            return { valid: false, error: 'Invalid OTP' };
        }

        if (token.expires < new Date()) {
            await prisma.verificationToken.delete({ where: { identifier: email } });
            return { valid: false, error: 'OTP expired' };
        }

        // Valid - delete token
        await prisma.verificationToken.delete({ where: { identifier: email } });
        console.log(`[OTP Verified] DB: ${maskEmail(email)}`);
        return { valid: true, source: 'db' };
    } catch (error) {
        console.error('[OTP DB Verify Error]:', error.message);
        return { valid: false, error: 'Verification failed' };
    }
}

// ═══════════════════════════════════════════════════════════════
// PASSWORD RESET TOKEN STORAGE
// ═══════════════════════════════════════════════════════════════

/**
 * Store password reset token in Redis with DB fallback
 */
export async function storePasswordResetToken(email, token, ttlSeconds = 300) {
    const key = cacheKeys.passwordReset(token);

    if (isRedisAvailable()) {
        try {
            await redis.set(key, email, { ex: ttlSeconds });
            console.log(`[Password Reset Token Stored] Redis: ${maskEmail(email)}`);
            return true;
        } catch (error) {
            console.error('[Password Reset Redis Error]:', error.message);
        }
    }

    // Fallback to DB
    try {
        const expires = new Date(Date.now() + ttlSeconds * 1000);
        await prisma.passwordResetToken.deleteMany({ where: { email } });
        await prisma.passwordResetToken.create({
            data: { token, email, expires }
        });
        console.log(`[Password Reset Token Stored] DB: ${maskEmail(email)}`);
        return true;
    } catch (error) {
        console.error('[Password Reset DB Error]:', error.message);
        return false;
    }
}

/**
 * Verify password reset token
 */
export async function verifyPasswordResetToken(token) {
    const key = cacheKeys.passwordReset(token);

    if (isRedisAvailable()) {
        try {
            const email = await redis.get(key);
            if (email) {
                await redis.del(key); // Single-use: delete immediately
                console.log(`[Password Reset Token Valid] Redis: ${maskEmail(email)}`);
                return { valid: true, email, source: 'redis' };
            }
        } catch (error) {
            console.error('[Password Reset Redis Verify Error]:', error.message);
        }
    }

    // Fallback to DB
    try {
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token }
        });

        if (!resetToken) {
            return { valid: false, error: 'Invalid or expired reset link' };
        }

        if (new Date() > resetToken.expires) {
            await prisma.passwordResetToken.delete({ where: { token } });
            return { valid: false, error: 'Reset link has expired' };
        }

        await prisma.passwordResetToken.delete({ where: { token } }); // Single-use: delete immediately
        console.log(`[Password Reset Token Valid] DB: ${maskEmail(resetToken.email)}`);
        return { valid: true, email: resetToken.email, source: 'db' };
    } catch (error) {
        console.error('[Password Reset DB Verify Error]:', error.message);
        return { valid: false, error: 'Verification failed' };
    }
}

/**
 * Delete password reset token after use
 */
export async function deletePasswordResetToken(token) {
    const key = cacheKeys.passwordReset(token);

    if (isRedisAvailable()) {
        try {
            await redis.del(key);
        } catch (error) {
            console.error('[Password Reset Delete Error]:', error.message);
        }
    }

    try {
        await prisma.passwordResetToken.delete({ where: { token } });
    } catch (error) {
        // Ignore if already deleted
    }
}

// ═══════════════════════════════════════════════════════════════
// API RESPONSE CACHING
// ═══════════════════════════════════════════════════════════════

/**
 * API Response Caching Middleware
 */
export class APICache {
    constructor() {
        this.defaultTTL = 300; // 5 minutes
    }

    /**
     * Cache middleware for API routes
     */
    middleware(ttl = this.defaultTTL, keyGenerator) {
        return (handler) => async (request, context) => {
            // Skip caching for non-GET requests
            if (request.method !== 'GET') {
                return handler(request, context);
            }

            try {
                // Generate cache key
                const cacheKey = keyGenerator
                    ? keyGenerator(request, context)
                    : this.generateDefaultKey(request);

                // Try to get cached response
                const cachedResponse = await getCache(cacheKey);
                if (cachedResponse) {
                    return new Response(JSON.stringify(cachedResponse.data), {
                        status: cachedResponse.status,
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Cache': 'HIT',
                            'X-Cache-Expires': new Date(cachedResponse.expiresAt).toUTCString()
                        }
                    });
                }

                // Execute handler and cache result
                const response = await handler(request, context);

                if (response.ok) {
                    const data = await response.json();
                    const expiresAt = Date.now() + (ttl * 1000);

                    await setCache(cacheKey, {
                        data,
                        status: response.status,
                        expiresAt
                    }, ttl);

                    return new Response(JSON.stringify(data), {
                        status: response.status,
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Cache': 'MISS'
                        }
                    });
                }

                return response;
            } catch (error) {
                console.error('Cache middleware error:', error);
                return handler(request, context);
            }
        };
    }

    /**
     * Generate default cache key from request
     */
    generateDefaultKey(request) {
        const url = new URL(request.url);
        const queryParams = Array.from(url.searchParams.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('&');

        return `api:${url.pathname}${queryParams ? `?${queryParams}` : ''}`;
    }

    /**
     * Invalidate specific API cache
     */
    async invalidate(path, params = {}) {
        const url = new URL(`http://localhost${path}`);
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        const cacheKey = this.generateDefaultKey({ url: url.toString() });
        return await deleteCache(cacheKey);
    }

    /**
     * Invalidate cache by resource type
     */
    async invalidateResource(resourceType, resourceId = null) {
        const prefixes = {
            admin: 'admin:',
            users: 'user:',
            payments: 'payments:',
            products: 'products:'
        };

        const pattern = resourceId
            ? `${prefixes[resourceType]}${resourceId}*`
            : `${prefixes[resourceType]}*`;

        return await invalidateCache(pattern);
    }
}

/**
 * Performance-aware caching strategies
 */
export const cachingStrategies = {
    /**
     * Aggressive caching for static/admin data
     */
    aggressive: {
        ttl: 3600, // 1 hour
        staleWhileRevalidate: true
    },

    /**
     * Balanced caching for user data
     */
    balanced: {
        ttl: 300, // 5 minutes
        validateBeforeServe: true
    },

    /**
     * Conservative caching for volatile data
     */
    conservative: {
        ttl: 60, // 1 minute
        alwaysValidate: true
    }
};

// Export API cache instance
export const apiCache = new APICache();

export const cacheKeys = {
    // Products
    products: () => 'products:all',

    // User
    userCourses: (userId) => `user:${userId}:courses`,
    userProfile: (userId) => `user:${userId}:profile`,
    userLinkedAccounts: (userId) => `user:${userId}:linked`,

    // Subscriptions
    subscription: (userId, productId) => `sub:${userId}:${productId}`,

    // User by Email (for role checks)
    userByEmail: (email) => `user:email:${email}`,

    // Auth tokens
    otp: (email) => `otp:${email}`,
    passwordReset: (token) => `reset:${token}`,

    // Rate limiting
    rateLimit: (identifier, route) => `rate:${identifier}:${route}`,

    // Admin
    adminStats: () => 'admin:stats',
    adminUsers: () => 'admin:users',
};
