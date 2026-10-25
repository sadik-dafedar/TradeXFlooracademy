import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getCached, cacheKeys } from "@/lib/cache";
import { toSafeProduct } from "@/lib/dto";

export async function GET(req, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const productId = params.id;
        const userId = session.user.id;

        // Check subscription with caching (cache metadata, validate expiry after retrieval)
        const subscription = await getCached(
            cacheKeys.subscription(userId, productId),
            async () => {
                const sub = await prisma.subscription.findFirst({
                    where: {
                        userId: userId,
                        productId: productId
                    },
                    include: {
                        product: true
                    }
                });
                return sub;
            },
            300 // Cache for 5 minutes
        );

        // Validate subscription status and expiry against current time (not cached check)
        if (!subscription || !subscription.isActive || new Date(subscription.expiryAt) <= new Date()) {
            return NextResponse.json({ error: "Access Denied. Active subscription required." }, { status: 403 });
        }

        // Return SAFE Product Data (contentUrl filtered out)
        return NextResponse.json({
            product: toSafeProduct(subscription.product),
            userEmail: session.user.email
        });

    } catch (error) {
        console.error("Course Fetch Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

