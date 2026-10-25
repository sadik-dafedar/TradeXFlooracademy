import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getRazorpay } from '@/lib/razorpay';
import prisma from '@/lib/prisma';
import { orderCreateSchema } from '@/lib/validations';

export async function POST(req) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const validation = orderCreateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }
        const { productId } = validation.data;

        // Idempotency: Check for existing pending order for this user + product
        const existingPendingPayment = await prisma.payment.findFirst({
            where: {
                userId: session.user.id,
                productId: productId,
                status: 'CREATED',
                createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) } // Last 30 mins
            }
        });

        if (existingPendingPayment) {
            return NextResponse.json({
                error: 'You have a pending payment. Please complete or wait for it to expire.'
            }, { status: 409 });
        }

        const product = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Ensure Razorpay is configured
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            throw new Error("Razorpay configuration missing");
        }

        const options = {
            amount: Math.round(product.price * 100), // Amount in smallest currency unit (paise)
            currency: "INR",
            receipt: `receipt_${Date.now()}_${productId}`,
            notes: {
                userId: session.user.id,
                productId: productId,
            }
        };

        const order = await getRazorpay().orders.create(options);

        // Create a pending payment record
        await prisma.payment.create({
            data: {
                razorpayOrderId: order.id,
                status: 'CREATED',
                amount: product.price,
                userId: session.user.id,
                productId: productId,
            }
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error('Create Order Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
