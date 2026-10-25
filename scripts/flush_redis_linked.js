const { Redis } = require('@upstash/redis');

// Load environment variables if running locally
if (!process.env.UPSTASH_REDIS_REST_URL) {
    require('dotenv').config();
}

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function clearLinkedAccountsCache() {
    console.log('🔌 Connecting to Redis...');
    try {
        const keys = await redis.keys('user:*:linked');
        if (keys.length > 0) {
            console.log(`🗑️ Found ${keys.length} linked account cache keys.`);
            await redis.del(...keys);
            console.log('✅ Successfully cleared linked account cache.');
        } else {
            console.log('ℹ️ No linked account cache keys found (already clean).');
        }
    } catch (error) {
        console.error('❌ Redis Operation Error:', error.message);
    }
}

clearLinkedAccountsCache();
