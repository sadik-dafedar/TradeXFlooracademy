function getPositiveInteger(value, fallback) {
    const parsed = Number.parseInt(value || '', 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const SESSION_MAX_AGE = getPositiveInteger(
    process.env.AUTH_SESSION_MAX_AGE,
    7 * 24 * 60 * 60
);
const SESSION_UPDATE_AGE = getPositiveInteger(
    process.env.AUTH_SESSION_UPDATE_AGE,
    24 * 60 * 60
);

export const authConfig = {
    pages: {
        signIn: '/login',
        error: '/error',
    },
    debug: process.env.NODE_ENV === 'development',
    session: {
        strategy: 'jwt',
        maxAge: SESSION_MAX_AGE,
        updateAge: SESSION_UPDATE_AGE,
    },
    jwt: {
        maxAge: SESSION_MAX_AGE,
    },
    callbacks: {
        async jwt({ token, user, trigger, session, account }) {
            console.log('[Auth] JWT callback triggered', { hasUser: !!user, trigger, provider: account?.provider });
            
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.username = user.username;
                token.image = user.image;
                token.isBanned = user.isBanned;
                // Serialize createdAt as ISO string to preserve across JWT refreshes
                token.createdAt = user.createdAt?.toISOString?.() || user.createdAt;
            }
            if (trigger === "update" && session) {
                // Only copy fields that the client is allowed to update.
                if (typeof session.name === 'string') token.name = session.name;
                if (typeof session.image === 'string' || session.image === null) {
                    token.image = session.image;
                }
                if (typeof session.username === 'string') token.username = session.username;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.role = token.role || 'USER';
                session.user.username = token.username;
                session.user.image = token.image;
                session.user.isBanned = token.isBanned === true;
                session.user.createdAt = token.createdAt;
            }
            return session;
        },
        async signIn({ user, account, profile }) {
            console.log('[Auth] SignIn callback', { 
                provider: account?.provider, 
                email: user?.email?.substring(0, 3) + '***',
                isBanned: user?.isBanned 
            });
            
            // Block sign in if user is banned
            if (user?.isBanned) {
                console.log('[Auth] User is banned, blocking sign in');
                return false;
            }
            return true;
        }
    },
    providers: [
        // Empty array used to satisfy Auth.js v5 middleware requirements 
        // without including full provider logic here (Edge compatibility)
        { id: "dummy", name: "Dummy", type: "credentials", authorize: () => null }
    ],
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
}
