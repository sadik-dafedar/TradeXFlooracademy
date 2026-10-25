const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function checkPrisma() {
    console.log('--- Checking Prisma Connection ---');
    let prisma;
    try {
        prisma = new PrismaClient();
        await prisma.$connect();
        console.log('✅ Prisma connected successfully.');
        const userCount = await prisma.user.count();
        console.log(`✅ Prisma read query success. Users count: ${userCount}`);
        return true;
    } catch (error) {
        console.error('❌ Prisma Error:', error.message);
        return false;
    } finally {
        if (prisma) await prisma.$disconnect();
    }
}

async function checkRedis() {
    console.log('\n--- Checking Redis (Upstash) Connection ---');

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        console.error('❌ Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN in .env');
        return false;
    }

    try {
        const { Redis } = await import('@upstash/redis');
        const redis = new Redis({ url, token });

        const timestamp = Date.now().toString();
        console.log(`Attempting to set key 'infra_test_key' to: ${timestamp}`);

        await redis.set('infra_test_key', timestamp);
        const val = await redis.get('infra_test_key');

        console.log(`Retrieved value: ${JSON.stringify(val)} (Type: ${typeof val})`);

        // Loose equality check and trim just in case
        if (String(val).trim() == timestamp) {
            console.log('✅ Redis (Upstash) R/W test successful.');
            await redis.del('infra_test_key');
            return true;
        } else {
            console.error(`❌ Redis read mismatch. Expected '${timestamp}', got '${val}'`);
            return false;
        }
    } catch (error) {
        console.error('❌ Redis Error:', error.message);
        return false;
    }
}

async function main() {
    console.log('Starting Infrastructure Verification (Prisma + Upstash)...');
    const prismaOk = await checkPrisma();
    const redisOk = await checkRedis();

    if (prismaOk && redisOk) {
        console.log('\n✅✅ SUCCESS: Both Prisma and Redis are connected and working.');
        process.exit(0);
    } else {
        console.log('\n⚠️ FAILURE: One or more services failed.');
        process.exit(1);
    }
}

main();
