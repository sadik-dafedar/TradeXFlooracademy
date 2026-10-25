import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Session configuration
const SESSION_CONFIG = {
    MAX_AGE: 30 * 60 * 1000, // 30 minutes
    INACTIVITY_TIMEOUT: 15 * 60 * 1000, // 15 minutes of inactivity
    CLEANUP_INTERVAL: 60 * 60 * 1000 // 1 hour
};

/**
 * Validate admin session token with inactivity tracking
 * @param {Request} request - Next.js request object
 * @returns {Promise<Object|null>} Admin user object or null if invalid
 */
export async function validateAdminSession(request) {
    try {
        // Get token from Authorization header or cookie
        let token = null;
        
        // Check Authorization header first
        const authHeader = request.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
        
        // Fallback to cookie
        if (!token) {
            const cookieHeader = request.headers.get('cookie');
            if (cookieHeader) {
                const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
                    const [name, value] = cookie.trim().split('=');
                    acc[name] = value;
                    return acc;
                }, {});
                token = cookies['admin-session'];
            }
        }

        if (!token) {
            return null;
        }

        // Find and validate session
        const session = await prisma.adminSession.findUnique({
            where: { token },
            include: {
                admin: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        isBanned: true,
                        createdAt: true
                    }
                }
            }
        });

        // Check if session exists and is valid
        if (!session || !session.admin) {
            // Clean up expired session
            if (session) {
                await prisma.adminSession.delete({ where: { id: session.id } });
            }
            return null;
        }

        // Check if admin is banned
        if (session.admin.isBanned) {
            await prisma.adminSession.delete({ where: { id: session.id } });
            await logSessionEvent(session.admin.id, 'SESSION_TERMINATED', 'Admin account banned');
            return null;
        }

        // Check session expiry
        if (session.expiresAt < new Date()) {
            await prisma.adminSession.delete({ where: { id: session.id } });
            await logSessionEvent(session.admin.id, 'SESSION_EXPIRED', 'Session lifetime exceeded');
            return null;
        }

        // Check inactivity timeout (15 minutes)
        const lastActivity = session.lastAccessedAt || session.createdAt;
        const inactiveTime = Date.now() - lastActivity.getTime();
        
        if (inactiveTime > SESSION_CONFIG.INACTIVITY_TIMEOUT) {
            await prisma.adminSession.delete({ where: { id: session.id } });
            await logSessionEvent(session.admin.id, 'SESSION_TIMEOUT', 'Inactivity timeout exceeded');
            return null;
        }

        // Update last accessed time
        await prisma.adminSession.update({
            where: { id: session.id },
            data: { lastAccessedAt: new Date() }
        });

        // Extend session expiry if more than half the time has passed
        const timeElapsed = Date.now() - session.createdAt.getTime();
        if (timeElapsed > SESSION_CONFIG.MAX_AGE / 2) {
            const newExpiry = new Date(Date.now() + SESSION_CONFIG.MAX_AGE);
            await prisma.adminSession.update({
                where: { id: session.id },
                data: { expiresAt: newExpiry }
            });
        }

        return session.admin;

    } catch (error) {
        console.error('[Admin Session] Validation error:', error);
        return null;
    }
}

/**
 * Log session events
 * @param {string} adminId - Admin user ID
 * @param {string} eventType - Type of session event
 * @param {string} details - Event details
 */
async function logSessionEvent(adminId, eventType, details) {
    try {
        await prisma.adminLog.create({
            data: {
                adminId,
                action: `SESSION_${eventType}`,
                details
            }
        });
    } catch (error) {
        console.error('[Admin Session] Failed to log event:', error);
    }
}

/**
 * Require admin authentication middleware
 * @param {Function} handler - Next.js route handler
 * @returns {Function} Wrapped handler with authentication
 */
export function requireAdminAuth(handler) {
    return async (request, ...args) => {
        const admin = await validateAdminSession(request);
        
        if (!admin) {
            return NextResponse.json(
                { error: 'Unauthorized: Admin session expired or invalid' }, 
                { status: 401 }
            );
        }

        // Add admin to request context
        request.admin = admin;
        return handler(request, ...args);
    };
}

/**
 * Require specific admin role
 * @param {string} requiredRole - Required role (ADMIN, SUPER_ADMIN, etc.)
 * @returns {Function} Middleware function
 */
export function requireAdminRole(requiredRole) {
    return (handler) => {
        return async (request, ...args) => {
            const admin = await validateAdminSession(request);
            
            if (!admin) {
                return NextResponse.json(
                    { error: 'Unauthorized: Admin session expired or invalid' }, 
                    { status: 401 }
                );
            }

            if (admin.role !== requiredRole) {
                await logSessionEvent(
                    admin.id, 
                    'PERMISSION_DENIED', 
                    `Attempted access to ${request.nextUrl.pathname} without ${requiredRole} role`
                );
                
                return NextResponse.json(
                    { error: 'Forbidden: Insufficient permissions' }, 
                    { status: 403 }
                );
            }

            request.admin = admin;
            return handler(request, ...args);
        };
    };
}

/**
 * Create admin session with security metadata
 * @param {string} adminId - Admin user ID
 * @param {Object} request - Request object for IP/UserAgent
 * @returns {Promise<string>} Session token
 */
export async function createAdminSession(adminId, request = null) {
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_CONFIG.MAX_AGE);
    
    const sessionData = {
        token,
        adminId,
        expiresAt,
        ipAddress: request?.headers?.get('x-forwarded-for') || request?.headers?.get('x-real-ip') || 'unknown',
        userAgent: request?.headers?.get('user-agent') || 'unknown',
        lastAccessedAt: new Date()
    };

    const session = await prisma.adminSession.create({ data: sessionData });
    
    await logSessionEvent(adminId, 'SESSION_CREATED', 'New admin session initiated');
    
    return token;
}

/**
 * Invalidate admin session
 * @param {string} token - Session token to invalidate
 * @param {string} reason - Reason for invalidation
 */
export async function invalidateAdminSession(token, reason = 'Manual logout') {
    try {
        const session = await prisma.adminSession.findUnique({ where: { token } });
        if (session) {
            await prisma.adminSession.delete({ where: { id: session.id } });
            await logSessionEvent(session.adminId, 'SESSION_INVALIDATED', reason);
        }
    } catch (error) {
        console.error('[Admin Session] Failed to invalidate session:', error);
    }
}

/**
 * Cleanup expired sessions
 */
export async function cleanupExpiredSessions() {
    try {
        const now = new Date();
        const result = await prisma.adminSession.deleteMany({
            where: { 
                OR: [
                    { expiresAt: { lt: now } },
                    { 
                        lastAccessedAt: { 
                            lt: new Date(Date.now() - SESSION_CONFIG.INACTIVITY_TIMEOUT) 
                        }
                    }
                ]
            }
        });
        
        if (result.count > 0) {
            console.log(`[Admin Session] Cleaned up ${result.count} expired/inactive sessions`);
        }
        
        return result.count;
    } catch (error) {
        console.error('[Admin Session] Cleanup error:', error);
        return 0;
    }
}

/**
 * Get active sessions for an admin
 * @param {string} adminId - Admin user ID
 * @returns {Promise<Array>} Active sessions
 */
export async function getActiveSessions(adminId) {
    try {
        return await prisma.adminSession.findMany({
            where: {
                adminId,
                expiresAt: { gt: new Date() },
                lastAccessedAt: { gt: new Date(Date.now() - SESSION_CONFIG.INACTIVITY_TIMEOUT) }
            },
            select: {
                id: true,
                createdAt: true,
                lastAccessedAt: true,
                expiresAt: true,
                ipAddress: true,
                userAgent: true
            },
            orderBy: { lastAccessedAt: 'desc' }
        });
    } catch (error) {
        console.error('[Admin Session] Failed to fetch active sessions:', error);
        return [];
    }
}

/**
 * Scheduled cleanup job - should be called periodically
 */
export async function runSessionCleanup() {
    const expiredCount = await cleanupExpiredSessions();
    return { expiredCount };
}