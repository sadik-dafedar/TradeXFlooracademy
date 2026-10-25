import { Redis as UpstashRedis } from '@upstash/redis';
import Redis from 'ioredis';

class RedisWrapper {
    constructor() {
        this.client = null;
        this.type = null;

        try {
            if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
                console.log('Initializing Redis client (@upstash/redis)...');
                this.client = new UpstashRedis({
                    url: process.env.UPSTASH_REDIS_REST_URL,
                    token: process.env.UPSTASH_REDIS_REST_TOKEN,
                });
                this.type = 'upstash';
            } else if (process.env.REDIS_URL) {
                console.log('Initializing Redis client (ioredis)...');
                this.client = new Redis(process.env.REDIS_URL);
                this.type = 'ioredis';

                // Handle connection errors
                this.client.on('error', (err) => {
                    console.error('Redis Client Error:', err);
                });
            } else {
                console.warn('No Redis configuration found. Caching will be disabled.');
            }
        } catch (error) {
            console.warn('Redis initialization failed:', error.message);
            this.client = null;
        }
    }

    isAvailable() {
        return this.client !== null;
    }

    async get(key) {
        if (!this.client) return null;
        return await this.client.get(key);
    }

    async set(key, value, options = {}) {
        if (!this.client) return null;

        // Ensure value is a string for ioredis if it's an object/number?
        // ioredis expects string or buffer or number.
        // lib/cache.js calls JSON.stringify before calling set, so value is string.

        if (this.type === 'ioredis') {
            if (options.ex) {
                return await this.client.set(key, value, 'EX', options.ex);
            }
            return await this.client.set(key, value);
        }
        return await this.client.set(key, value, options);
    }

    async del(...keys) {
        if (!this.client) return 0;
        if (keys.length === 0) return 0;
        return await this.client.del(...keys);
    }

    async scan(cursor, options = {}) {
        if (!this.client) return ['0', []];

        if (this.type === 'ioredis') {
            const args = [cursor];
            if (options.match) {
                args.push('MATCH', options.match);
            }
            if (options.count) {
                args.push('COUNT', options.count);
            }
            return await this.client.scan(...args);
        }

        return await this.client.scan(cursor, options);
    }

    async ttl(key) {
        if (!this.client) return -1;
        return await this.client.ttl(key);
    }

    async eval(script, keys = [], args = []) {
        if (!this.client) return null;

        if (this.type === 'ioredis') {
            // ioredis eval signature: eval(script, numKeys, key1, key2, ..., arg1, arg2, ...)
            return await this.client.eval(script, keys.length, ...keys, ...args);
        }

        // Upstash eval signature: eval(script, keys, args)
        return await this.client.eval(script, keys, args);
    }
}

// Singleton instance
const redisWrapper = new RedisWrapper();

export { redisWrapper as redis };

// Check if Redis is available
export function isRedisAvailable() {
    return redisWrapper.isAvailable();
}
