import { redis, isRedisAvailable } from './redis';
import { cacheKeys } from './cache';
import prisma from './prisma';

/**
 * Check Rate Limit using Redis (with DB fallback)
 * @param {string} identifier - Unique identifier (IP or Email)
 * @param {string} route - Route identifier (e.g. "/api/auth/otp")
 * @param {number} limit - Max requests allowed
 * @param {number} windowSeconds - Time window in seconds
 * @returns {Promise<{ success: boolean, remaining?: number }>}
 */
export async function checkRateLimit(identifier, route, limit = 3, windowSeconds = 600) {
    // Use Redis if available, otherwise fallback to DB
    if (isRedisAvailable()) {
        return checkRateLimitRedis(identifier, route, limit, windowSeconds);
    }
    return checkRateLimitDB(identifier, route, limit, windowSeconds);
}

/**
 * Redis-based rate limiting (fast, atomic)
 */
async function checkRateLimitRedis(identifier, route, limit, windowSeconds) {
    try {
        const key = cacheKeys.rateLimit(identifier, route);

        // Atomic increment with expiry using Lua script
        // This prevents race condition where EXPIRE might not run if process crashes after INCR
        // Uses Upstash-compatible syntax: eval(script, keys, args)
        const luaScript = `
            local current = redis.call('INCR', KEYS[1])
            if current == 1 then
                redis.call('EXPIRE', KEYS[1], ARGV[1])
            end
            return current
        `;
        const current = await redis.eval(luaScript, [key], [windowSeconds]);

        // Check limit
        if (current > limit) {
            const ttl = await redis.ttl(key);
            return {
                success: false,
                remaining: 0,
                retryAfter: ttl > 0 ? ttl : windowSeconds
            };
        }

        return {
            success: true,
            remaining: limit - current
        };
    } catch (error) {
        console.error("Redis Rate Limit Error:", error.message);
        // Fallback to DB on Redis error
        return checkRateLimitDB(identifier, route, limit, windowSeconds);
    }
}

/**
 * Database-based rate limiting (fallback)
 */
async function checkRateLimitDB(identifier, route, limit = 3, windowSeconds = 600) {
    try {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + windowSeconds * 1000);

        const record = await prisma.rateLimit.findUnique({
            where: {
                identifier_route: {
                    identifier,
                    route
                }
            }
        });

        if (record) {
            // If expired, reset
            if (record.expiresAt < now) {
                await prisma.rateLimit.update({
                    where: { id: record.id },
                    data: {
                        count: 1,
                        expiresAt: expiresAt
                    }
                });
                return { success: true, remaining: limit - 1 };
            }

            // If not expired, check limits
            if (record.count >= limit) {
                return { success: false, remaining: 0 };
            }

            // Increment
            await prisma.rateLimit.update({
                where: { id: record.id },
                data: {
                    count: { increment: 1 }
                }
            });
            return { success: true, remaining: limit - record.count - 1 };
        }

        // Create new record
        await prisma.rateLimit.create({
            data: {
                identifier,
                route,
                count: 1,
                expiresAt
            }
        });

        return { success: true, remaining: limit - 1 };

    } catch (error) {
        console.error("DB Rate Limit Error:", error);
        // Fail open to avoid blocking legitimate users
        return { success: true };
    }
}

/**
 * Reset rate limit for an identifier (useful after successful actions)
 */
export async function resetRateLimit(identifier, route) {
    if (isRedisAvailable()) {
        try {
            const key = cacheKeys.rateLimit(identifier, route);
            await redis.del(key);
        } catch (error) {
            console.error("Redis Reset Error:", error.message);
        }
    }

    // Also clean DB if exists
    try {
        await prisma.rateLimit.deleteMany({
            where: { identifier, route }
        });
    } catch (error) {
        // Ignore DB errors for cleanup
    }
}
