const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Debugging VdoCipher OTP Generation...');

    // 1. Check Secret
    const secretKey = process.env.VDOCIPHER_API_SECRET;
    if (!secretKey) {
        console.error('❌ Missing VDOCIPHER_API_SECRET');
        return;
    }
    console.log('✅ Secret Key found.');

    // 2. Get Video ID from DB
    const product = await prisma.product.findFirst({
        where: { title: '🔒 DRM Security Test - VdoCipher' }
    });

    if (!product) {
        console.error('❌ Test Product not found in DB.');
        return;
    }

    const videoId = product.contentUrl;
    console.log(`✅ Using Video ID from DB: ${videoId}`);

    // Validate ID format (basic check)
    if (videoId.length !== 32) {
        console.warn(`⚠️ Video ID length is ${videoId.length}, expected 32. This might be why it fails.`);
    }

    // 3. Simulate API Call
    console.log('⏳ Requesting OTP from VdoCipher...');

    // Payload matching route.js
    const payload = {
        annotate: JSON.stringify([
            {
                type: 'rtext',
                text: 'Test User - test@example.com',
                alpha: '0.60',
                color: '0xFFFFFF',
                size: '15',
                interval: '5000'
            }
        ])
    };

    try {
        const response = await fetch(`https://dev.vdocipher.com/api/videos/${videoId}/otp`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Apisecret ${secretKey}`
            },
            body: JSON.stringify(payload)
        });

        const text = await response.text();

        if (!response.ok) {
            console.error(`❌ API Failed: ${response.status} ${response.statusText}`);
            console.error(`Response Body: ${text}`);
            return;
        }

        const data = JSON.parse(text);
        console.log('✅ OTP Generated Successfully!');
        console.log(`otp: ${data.otp}`);
        console.log(`playbackInfo: ${data.playbackInfo}`);
        console.log('\n--> Backend logic is CORRECT. The issue is likely in the Frontend (VdoCipherPlayer.jsx) or Browser.');

    } catch (error) {
        if (error instanceof SyntaxError) {
            console.error('❌ JSON Parse Error:', error.message);
        } else {
            console.error('❌ Network Error:', error.message);
        }
    }
}

main()
    .finally(async () => await prisma.$disconnect());
