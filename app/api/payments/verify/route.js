import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { invalidateUserCache } from '@/lib/cache';

export async function POST(req) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

        // 1. Verify Signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (!isAuthentic) {
            return NextResponse.json(
                { error: 'Payment signature verification failed' },
                { status: 400 }
            );
        }

        // 2. Update Payment Status in DB
        // Find and update payment by orderId in one go
        let payment;
        try {
            payment = await prisma.payment.update({
                where: { razorpayOrderId: razorpay_order_id },
                data: {
                    status: 'PAID',
                    razorpayPaymentId: razorpay_payment_id,
                },
            });
        } catch (error) {
            if (error.code === 'P2025') {
                payment = null;
            } else {
                throw error;
            }
        }

        if (payment) {
            // 3. Grant access to product (Create Subscription)
            if (payment.productId && payment.userId) {
                // Check if already subscribed
                // Calculate expiry (default 90 days, or logic based on product)
                const product = await prisma.product.findUnique({ where: { id: payment.productId } });
                const validDays = product?.validityDays || 90;
                const expiryAt = new Date();
                expiryAt.setDate(expiryAt.getDate() + validDays);

                await prisma.subscription.create({
                    data: {
                        userId: payment.userId,
                        productId: payment.productId,
                        expiryAt,
                        isActive: true
                    }
                });

                // Invalidate user cache so they see their new course immediately
                try {
                    await invalidateUserCache(payment.userId);
                } catch (cacheError) {
                    console.error('Cache invalidation failed:', cacheError);
                    // Continue - subscription was created successfully
                }
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Payment Verification Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
