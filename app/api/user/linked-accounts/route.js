import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getCached, cacheKeys } from "@/lib/cache";

export const dynamic = 'force-dynamic';

// GET: Fetch linked accounts for current user
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // Cache linked accounts for 10 minutes (rarely changes)
        const result = await getCached(
            cacheKeys.userLinkedAccounts(userId),
            async () => {
                const [accounts, user] = await Promise.all([
                    prisma.account.findMany({
                        where: { userId },
                        select: {
                            provider: true,
                            type: true,
                            createdAt: true
                        },
                        orderBy: { createdAt: 'asc' }
                    }),
                    prisma.user.findUnique({
                        where: { id: userId },
                        select: { email: true, password: true, createdAt: true }
                    })
                ]);

                // Map provider names to user-friendly labels
                const providerLabels = {
                    google: "Google",
                    credentials: "Email/OTP",
                    github: "GitHub",
                    facebook: "Facebook"
                };

                const linkedProviders = accounts.map(acc => ({
                    provider: acc.provider,
                    label: providerLabels[acc.provider] || acc.provider,
                    type: acc.type,
                    linkedAt: acc.createdAt ? acc.createdAt.toISOString() : null
                }));

                // Check if user has email/creds but it's not in the Account table (standard for Credentials provider)
                const hasCredsInAccounts = linkedProviders.some(p => p.provider === 'credentials');
                if (!hasCredsInAccounts && user?.email) {
                    linkedProviders.push({
                        provider: 'credentials',
                        label: 'Email/OTP',
                        type: 'credentials',
                        linkedAt: user.createdAt ? user.createdAt.toISOString() : null
                    });
                }

                return {
                    success: true,
                    totalLinked: linkedProviders.length,
                    linkedProviders,
                    hasGoogle: linkedProviders.some(p => p.provider === 'google'),
                    hasCredentials: linkedProviders.some(p => p.provider === 'credentials')
                };
            },
            600 // 10 minutes
        );

        return Response.json(result);

    } catch (error) {
        console.error("Error fetching linked accounts:", error);
        return Response.json({
            error: `Failed to fetch linked accounts: ${error.message}`
        }, { status: 500 });
    }
}
