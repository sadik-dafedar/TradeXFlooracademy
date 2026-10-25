import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "./lib/prisma"
import { authConfig } from "./auth.config"
import { verifyOTP } from "./lib/cache"

// Generate unique username from email
function generateUsername(email) {
    const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const random = Math.random().toString(36).substring(2, 6);
    return `${base}_${random}`;
}

// Custom adapter that generates username DURING user creation (not after)
function CustomPrismaAdapter(prismaClient) {
    const adapter = PrismaAdapter(prismaClient);

    return {
        ...adapter,
        async createUser(data) {
            console.log('[CustomAdapter] Creating user with data:', { email: data.email?.substring(0, 3) + '***' });

            // Generate unique username
            let username = generateUsername(data.email || 'user');

            // Check if username exists and regenerate if needed
            let attempts = 0;
            while (attempts < 5) {
                const existing = await prismaClient.user.findUnique({
                    where: { username }
                });
                if (!existing) break;
                username = `${(data.email?.split('@')[0] || 'user').substring(0, 10)}_${Date.now().toString(36)}`;
                attempts++;
            }

            console.log('[CustomAdapter] Generated username:', username);

            // Remove id from data - let MongoDB generate ObjectID automatically
            // NextAuth sends UUID format which is incompatible with MongoDB ObjectID
            const { id, ...dataWithoutId } = data;
            if (id) {
                console.log('[CustomAdapter] Removing UUID id, letting MongoDB generate ObjectID');
            }

            try {
                const user = await prismaClient.user.create({
                    data: {
                        ...dataWithoutId,
                        username,
                        role: 'USER',
                        isVerified: true, // OAuth users are auto-verified
                    }
                });
                console.log('[CustomAdapter] User created successfully:', user.id);
                return user;
            } catch (error) {
                console.error('[CustomAdapter] Error creating user:', error.message);
                throw error;
            }
        }
    };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: CustomPrismaAdapter(prisma),
    logger: {
        error(code, ...message) {
            console.error('[Auth Error]', code, ...message);
        },
        warn(code, ...message) {
            console.warn('[Auth Warn]', code, ...message);
        },
        debug(code, ...message) {
            console.log('[Auth Debug]', code, ...message);
        },
    },
    events: {
        async signIn({ user, account }) {
            console.log('[Auth Event] signIn success:', {
                provider: account?.provider,
                userId: user?.id
            });

            // LOG ADMIN LOGIN
            if (user?.role === 'ADMIN') {
                try {
                    await prisma.adminLog.create({
                        data: {
                            adminId: user.id,
                            action: 'Admin Login',
                            details: `Logged in via ${account?.provider}`,
                        }
                    });
                } catch (e) {
                    console.error('Failed to log admin login:', e);
                }
            }
        },
        async signOut({ token }) {
            console.log('[Auth Event] signOut');
        },
        async linkAccount({ user, account }) {
            console.log('[Auth Event] linkAccount:', {
                provider: account?.provider,
                userId: user?.id
            });
        },
    },
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        }),
        Credentials({
            name: "OTP",
            credentials: {
                email: { label: "Email", type: "email" },
                otp: { label: "OTP", type: "text" },
            },
            async authorize(credentials) {
                console.log('[Auth] Credentials authorize called');

                if (!credentials?.email || !credentials?.otp) {
                    console.log('[Auth] Missing credentials');
                    return null;
                }

                try {
                    // Find User
                    console.log('[Auth] Finding user...');
                    const user = await prisma.user.findUnique({
                        where: { email: credentials.email }
                    });

                    if (!user) {
                        console.log('[Auth] User not found');
                        throw new Error("User not found. Please register first.");
                    }
                    console.log('[Auth] User found:', user.id);

                    // Verify OTP using Redis (with DB fallback)
                    console.log('[Auth] Verifying OTP...');
                    const verification = await verifyOTP(credentials.email, credentials.otp);
                    console.log('[Auth] OTP verification result:', verification);

                    if (!verification.valid) {
                        throw new Error(verification.error || "Invalid or Expired OTP");
                    }

                    // Activate User if not already
                    if (!user.isVerified) {
                        console.log('[Auth] Activating user...');
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { isVerified: true }
                        });
                    }

                    console.log('[Auth] Authorization successful');
                    return user;
                } catch (error) {
                    console.error('[Auth] Authorize error:', error.message);
                    throw error;
                }
            }
        })
    ],
})
