import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

// NOTE: We cannot use validateAdminSession here because it uses Prisma/crypto
// which are not supported in Edge Runtime. We do lightweight cookie checking
// here and full validation in API routes.

/**
 * Check if admin session cookie exists (lightweight check for Edge)
 * Full validation with Prisma happens in API routes
 */
function hasAdminSessionCookie(req) {
    const cookieHeader = req.headers.get('cookie');
    if (!cookieHeader) return false;

    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = value;
        return acc;
    }, {});

    return !!cookies['admin-session'];
}

export default NextAuth(authConfig).auth(async (req) => {
    const isLoggedIn = !!req.auth
    const nextUrl = req.nextUrl
    const pathname = nextUrl.pathname

    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup')
    const isAdminRoute = pathname.startsWith('/admin')
    const isAdminLoginRoute = pathname === '/admin/login'

    const auth = req.auth;
    const user = auth?.user;

    // Handle admin routes
    if (isAdminRoute && !isAdminLoginRoute) {
        // Lightweight check: just verify cookie exists
        // Full session validation happens in API routes
        const hasSession = hasAdminSessionCookie(req);

        if (!hasSession) {
            // Redirect to admin login
            return Response.redirect(new URL('/admin/login', nextUrl))
        }

        return null
    }

    // Handle admin login route
    if (isAdminLoginRoute) {
        const hasSession = hasAdminSessionCookie(req);
        if (hasSession) {
            // Cookie exists, redirect to admin dashboard
            // (actual session validity will be checked by dashboard API)
            return Response.redirect(new URL('/admin/dashboard', nextUrl))
        }
        return null
    }

    // Redirect to home if logged in and trying to access login (UNLESS banned)
    if (isAuthRoute) {
        if (isLoggedIn && !user?.isBanned) {
            return Response.redirect(new URL('/', nextUrl))
        }
        return null
    }

    // Global Ban Check - Skip if already on login/auth routes to avoid loops
    if (isLoggedIn && user?.isBanned && !isAuthRoute) {
        return Response.redirect(new URL('/login?error=Banned', nextUrl))
    }

    return null
})

// Matcher to exclude static files and API routes (except maybe admin APIs if needed)
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

