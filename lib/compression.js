/**
 * Request/response compression and optimization
 */

// Only import Node.js specific modules when running on server
const isServer = typeof window === 'undefined';

let gzipAsync, brotliAsync;
if (isServer) {
    const { promisify } = require('util');
    const { gzip, brotliCompress } = require('zlib');
    gzipAsync = promisify(gzip);
    brotliAsync = promisify(brotliCompress);
}

/**
 * Compression algorithms supported
 */
export const COMPRESSION_ALGORITHMS = {
    GZIP: 'gzip',
    BROTLI: 'br',
    DEFLATE: 'deflate'
};

/**
 * Response compression middleware
 */
export class CompressionMiddleware {
    constructor(options = {}) {
        this.options = {
            threshold: 1024, // 1KB minimum for compression
            level: 6, // Compression level (1-9 for gzip, 1-11 for brotli)
            algorithms: [COMPRESSION_ALGORITHMS.BROTLI, COMPRESSION_ALGORITHMS.GZIP],
            ...options
        };
    }

    /**
     * Compress response data
     */
    async compress(data, algorithm) {
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

        if (buffer.length < this.options.threshold) {
            return { data: buffer, algorithm: null };
        }

        try {
            let compressed;
            switch (algorithm) {
                case COMPRESSION_ALGORITHMS.BROTLI:
                    compressed = await brotliAsync(buffer, {
                        params: {
                            [require('zlib').constants.BROTLI_PARAM_MODE]: require('zlib').constants.BROTLI_MODE_TEXT,
                            [require('zlib').constants.BROTLI_PARAM_QUALITY]: this.options.level,
                            [require('zlib').constants.BROTLI_PARAM_SIZE_HINT]: buffer.length
                        }
                    });
                    break;
                case COMPRESSION_ALGORITHMS.GZIP:
                    compressed = await gzipAsync(buffer, { level: this.options.level });
                    break;
                default:
                    return { data: buffer, algorithm: null };
            }

            return { data: compressed, algorithm };
        } catch (error) {
            console.warn('Compression failed:', error.message);
            return { data: buffer, algorithm: null };
        }
    }

    /**
     * Get best compression algorithm from Accept-Encoding header
     */
    getBestAlgorithm(acceptEncoding) {
        if (!acceptEncoding) return null;

        const accepted = acceptEncoding.split(',').map(a => a.trim().toLowerCase());

        for (const algorithm of this.options.algorithms) {
            if (accepted.includes(algorithm)) {
                return algorithm;
            }
        }

        return null;
    }

    /**
     * Middleware function
     */
    middleware() {
        return (handler) => async (request, context) => {
            const response = await handler(request, context);

            // Only compress successful GET responses with appropriate content types
            if (
                request.method !== 'GET' ||
                !response.ok ||
                !this.shouldCompress(response.headers.get('content-type'))
            ) {
                return response;
            }

            try {
                // Get compression algorithm
                const acceptEncoding = request.headers.get('accept-encoding');
                const algorithm = this.getBestAlgorithm(acceptEncoding);

                if (!algorithm) {
                    return response;
                }

                // Read response body
                const body = await response.text();
                const { data: compressedData, algorithm: usedAlgorithm } =
                    await this.compress(body, algorithm);

                if (!usedAlgorithm) {
                    return new Response(body, {
                        status: response.status,
                        headers: response.headers
                    });
                }

                // Create new response with compressed data
                const headers = new Headers(response.headers);
                headers.set('content-encoding', usedAlgorithm);
                headers.set('content-length', compressedData.length.toString());
                headers.set('vary', 'accept-encoding');

                return new Response(compressedData, {
                    status: response.status,
                    headers
                });

            } catch (error) {
                console.error('Compression middleware error:', error);
                return response;
            }
        };
    }

    /**
     * Check if content type should be compressed
     */
    shouldCompress(contentType) {
        if (!contentType) return false;

        const compressibleTypes = [
            'text/',
            'application/json',
            'application/javascript',
            'application/xml',
            'application/rss+xml',
            'application/atom+xml'
        ];

        return compressibleTypes.some(type => contentType.includes(type));
    }
}

/**
 * Request optimization utilities
 */
export const requestOptimization = {
    /**
     * Optimize fetch requests
     */
    async optimizedFetch(url, options = {}) {
        const defaultOptions = {
            cache: 'force-cache', // Use cache when possible
            keepalive: true, // Keep connection alive
            redirect: 'follow',
            ...options
        };

        // Add performance headers
        const headers = {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate, br',
            ...defaultOptions.headers
        };

        const startTime = performance.now();

        try {
            const response = await fetch(url, {
                ...defaultOptions,
                headers
            });

            const endTime = performance.now();
            const duration = endTime - startTime;

            // Log performance metrics
            console.log(`[Request Perf] ${url} - ${duration.toFixed(2)}ms - ${response.status}`);

            return response;
        } catch (error) {
            const endTime = performance.now();
            const duration = endTime - startTime;

            console.error(`[Request Error] ${url} - ${duration.toFixed(2)}ms - ${error.message}`);
            throw error;
        }
    },

    /**
     * Batch multiple requests
     */
    async batchRequests(requests) {
        const results = await Promise.allSettled(
            requests.map(req => this.optimizedFetch(req.url, req.options))
        );

        return results.map((result, index) => ({
            ...requests[index],
            success: result.status === 'fulfilled',
            response: result.status === 'fulfilled' ? result.value : null,
            error: result.status === 'rejected' ? result.reason : null
        }));
    },

    /**
     * Request deduplication
     */
    createDeduplicator() {
        const pendingRequests = new Map();

        return async (url, options = {}) => {
            const key = `${url}-${JSON.stringify(options)}`;

            if (pendingRequests.has(key)) {
                return pendingRequests.get(key);
            }

            const promise = this.optimizedFetch(url, options);
            pendingRequests.set(key, promise);

            try {
                const result = await promise;
                return result;
            } finally {
                pendingRequests.delete(key);
            }
        };
    }
};

/**
 * CDN and caching optimization
 */
export const cdnOptimization = {
    /**
     * Generate cache headers
     */
    generateCacheHeaders(options = {}) {
        const {
            maxAge = 300,           // 5 minutes
            sMaxAge = 3600,         // 1 hour for CDN
            staleWhileRevalidate = 86400, // 24 hours
            staleIfError = 86400,   // 24 hours
            isPublic = true,
            immutable = false
        } = options;

        const cacheControl = [
            isPublic ? 'public' : 'private',
            `max-age=${maxAge}`,
            `s-maxage=${sMaxAge}`,
            `stale-while-revalidate=${staleWhileRevalidate}`,
            `stale-if-error=${staleIfError}`,
            immutable ? 'immutable' : ''
        ].filter(Boolean).join(', ');

        return {
            'Cache-Control': cacheControl,
            'ETag': `"${Date.now()}"`,
            'Last-Modified': new Date().toUTCString()
        };
    },

    /**
     * Asset versioning for cache busting
     */
    getVersionedUrl(baseUrl, version) {
        const url = new URL(baseUrl, typeof window !== 'undefined' ? window.location.origin : '');
        url.searchParams.set('v', version || Date.now().toString());
        return url.toString();
    }
};

/**
 * Performance headers middleware
 */
export class PerformanceHeadersMiddleware {
    constructor() {
        this.headers = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
            'Timing-Allow-Origin': '*',
            'Server-Timing': 'cache;dur=0'
        };
    }

    middleware() {
        return (handler) => async (request, context) => {
            const response = await handler(request, context);

            const headers = new Headers(response.headers);

            // Add performance headers
            Object.entries(this.headers).forEach(([key, value]) => {
                if (!headers.has(key)) {
                    headers.set(key, value);
                }
            });

            // Add timing information
            const processingTime = Date.now() - (context.startTime || Date.now());
            headers.set('Server-Timing', `app;dur=${processingTime}`);

            return new Response(await response.text(), {
                status: response.status,
                headers
            });
        };
    }
}

// Export instances
export const compression = new CompressionMiddleware();
export const performanceHeaders = new PerformanceHeadersMiddleware();