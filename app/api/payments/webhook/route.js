import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { invalidateUserCache, invalidateAdminCache } from '@/lib/cache';
import { sendPurchaseReceipt } from '@/lib/email';

export async function POST(req) {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET; // Ensure this is set in .env

    if (!secret) {
        // For dev purposes if secret not set, maybe log and ignore validation? 
        // BUT for production this is critical.
        console.error("RAZORPAY_WEBHOOK_SECRET is not set");
        return NextResponse.json({ error: 'Configuration Error' }, { status: 500 });
    }

    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

    if (expectedSignature !== signature) {
        return NextResponse.json({ error: 'Invalid Signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    try {
        if (event.event === 'payment.captured') {
            const paymentDetails = event.payload.payment.entity;
            const orderId = paymentDetails.order_id;
            const notes = paymentDetails.notes; // We stored userId and productId here

            // Update Payment Status
            await prisma.payment.update({
                where: { razorpayOrderId: orderId },
                data: {
                    status: 'PAID',
                    razorpayPaymentId: paymentDetails.id
                }
            });

            // Create Subscription
            const product = await prisma.product.findUnique({
                where: { id: notes.productId }
            });

            if (product) {
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + product.validityDays);

                await prisma.subscription.create({
                    data: {
                        userId: notes.userId,
                        productId: notes.productId,
                        expiryAt: expiryDate,
                        isActive: true
                    }
                });

                // Invalidate caches (non-critical - don't fail webhook if this throws)
                Promise.all([
                    invalidateUserCache(notes.userId),
                    invalidateAdminCache()
                ])
                    .then(() => console.log(`[Cache Invalidated] User ${notes.userId} + Admin stats after purchase`))
                    .catch((err) => console.error(`[Cache Invalidation Failed] User ${notes.userId}`, err.message));

                // Send purchase receipt email (non-critical - don't fail webhook if this throws)
                try {
                    const user = await prisma.user.findUnique({
                        where: { id: notes.userId },
                        select: { email: true, name: true }
                    });
                    if (user?.email) {
                        // Fire and forget - don't block webhook response
                        sendPurchaseReceipt(
                            user.email,
                            user.name,
                            product.title,
                            paymentDetails.amount / 100 // Convert paise to rupees
                        )
                            .then(() => console.log(`[Email] Purchase receipt sent to ${user.email}`))
                            .catch((err) => console.error(`[Email Error] Failed to send receipt for user ${notes.userId}:`, err.message));
                    }
                } catch (dbError) {
                    console.error(`[Email Setup Error] Failed to fetch user for receipt ${notes.userId}:`, dbError.message);
                    // Continue - email failure should not fail the webhook
                }
            }
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('[RAZORPAY_WEBHOOK_ERROR]', {
            message: error.message,
            stack: error.stack,
            event: event?.event,
            orderId: event?.payload?.payment?.entity?.order_id
        });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
