const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting DRM Course Assignment...');

    // 1. Create or Update the Test Course
    // Find by title first
    let testProduct = await prisma.product.findFirst({
        where: { title: '🔒 DRM Security Test - VdoCipher' }
    });

    if (!testProduct) {
        testProduct = await prisma.product.create({
            data: {
                title: '🔒 DRM Security Test - VdoCipher',
                description: 'This is a test course to verify DRM protection. Attempt to download or record this video.',
                type: 'VIDEO_COURSE',
                price: 0,
                contentUrl: '1234567890', // Placeholder VdoCipher ID
                thumbnail: '/images/drm-placeholder.jpg',
                validityDays: 365
            }
        });
        console.log(`✅ Created Test Product: ${testProduct.id}`);
    } else {
        console.log(`ℹ️ Test Product already exists: ${testProduct.id}`);
    }

    // 2. Assign to ALL Users
    // Fetch only IDs to save memory
    const users = await prisma.user.findMany({
        select: { id: true }
    });
    console.log(`👥 Found ${users.length} users. Assigning course...`);

    let count = 0;
    const CHUNK_SIZE = 1000;

    // Process in chunks to avoid memory limits and huge queries
    for (let i = 0; i < users.length; i += CHUNK_SIZE) {
        const chunk = users.slice(i, i + CHUNK_SIZE);
        const chunkIds = chunk.map(u => u.id);

        // Find existing subscriptions for this chunk
        const existingSubscriptions = await prisma.subscription.findMany({
            where: {
                userId: { in: chunkIds },
                productId: testProduct.id
            },
            select: { userId: true }
        });

        const existingUserIds = new Set(existingSubscriptions.map(s => s.userId));

        const newSubscriptionsData = chunk
            .filter(user => !existingUserIds.has(user.id))
            .map(user => ({
                userId: user.id,
                productId: testProduct.id,
                startDate: new Date(),
                expiryAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
                isActive: true
            }));

        if (newSubscriptionsData.length > 0) {
            await prisma.subscription.createMany({
                data: newSubscriptionsData
            });
            count += newSubscriptionsData.length;
        }
    }

    console.log(`✅ Assigned DRM Test Course to ${count} new users.`);
    console.log(`\n⚠️ IMPORTANT: The video URL is set to '1234567890'. You MUST update this in the Admin Panel with a REAL VdoCipher Video ID to see it play.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
