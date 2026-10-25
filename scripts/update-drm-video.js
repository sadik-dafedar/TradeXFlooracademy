const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const VIDEO_ID = '76b87d425de39bd64310795e9d4cbe64';
    const TITLE = '🔒 DRM Security Test - VdoCipher';

    console.log(`🚀 Updating '${TITLE}' with Video ID: ${VIDEO_ID}...`);

    // Find the product
    const product = await prisma.product.findFirst({
        where: { title: TITLE }
    });

    if (!product) {
        console.error(`❌ Product not found! Did you run the assignment script?`);
        process.exit(1);
    }

    // Update it
    await prisma.product.update({
        where: { id: product.id },
        data: {
            contentUrl: VIDEO_ID,
            description: 'DRM Active. Try to download or record this. Your name should appear as watermark.'
        }
    });

    console.log(`✅ Success! Video ID updated.`);
    console.log(`👉 Go to your Dashboard -> Refresh -> Play '${TITLE}'`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
