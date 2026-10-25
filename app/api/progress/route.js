import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/progress?productId=xxx
 * Returns user's lesson progress for a specific product
 */
export async function GET(req) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('productId');

        if (!productId) {
            return NextResponse.json({ error: "productId is required" }, { status: 400 });
        }

        // Verify user has active subscription to this product
        const subscription = await prisma.subscription.findFirst({
            where: {
                userId: session.user.id,
                productId: productId,
                isActive: true,
                expiryAt: { gt: new Date() }
            }
        });

        if (!subscription) {
            return NextResponse.json({ error: "Access Denied. Active subscription required." }, { status: 403 });
        }

        const progress = await prisma.lessonProgress.findMany({
            where: {
                userId: session.user.id,
                productId: productId
            },
            select: {
                lessonId: true,
                completed: true,
                completedAt: true
            }
        });

        return NextResponse.json({ progress });
    } catch (error) {
        console.error("Progress Fetch Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST /api/progress
 * Mark a lesson as complete
 * Body: { productId, lessonId }
 */
export async function POST(req) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { productId, lessonId } = body;

        if (!productId || !lessonId) {
            return NextResponse.json({ error: "productId and lessonId are required" }, { status: 400 });
        }

        // Verify user has active subscription to this product
        const subscription = await prisma.subscription.findFirst({
            where: {
                userId: session.user.id,
                productId: productId,
                isActive: true,
                expiryAt: { gt: new Date() }
            }
        });

        if (!subscription) {
            return NextResponse.json({ error: "Access Denied. Active subscription required." }, { status: 403 });
        }

        // Upsert lesson progress (create or update)
        const progress = await prisma.lessonProgress.upsert({
            where: {
                userId_productId_lessonId: {
                    userId: session.user.id,
                    productId: productId,
                    lessonId: lessonId
                }
            },
            update: {
                completed: true,
                completedAt: new Date()
            },
            create: {
                userId: session.user.id,
                productId: productId,
                lessonId: lessonId,
                completed: true,
                completedAt: new Date()
            }
        });

        return NextResponse.json({ success: true, progress });
    } catch (error) {
        console.error("Progress Update Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
