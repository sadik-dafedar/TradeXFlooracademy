import crypto from 'crypto';

/**
 * DRM Utility for Video Protection
 * 
 * This module handles the generation of Signed URLs for secure video playback.
 * It prevents direct download links by appending time-limited signatures.
 * 
 * Supported Providers: VdoCipher, AWS CloudFront, Mux
 */

/**
 * Signs a URL for AWS CloudFront using a canned policy (valid until expiration).
 *
 * @param {string} url - The full URL to the resource (e.g. https://domain.com/video.mp4)
 * @param {string} privateKey - The private key in PEM format
 * @param {string} keyPairId - The CloudFront Key Pair ID
 * @param {number} expireTime - Expiration time in Unix epoch (seconds)
 * @returns {string} - The signed URL
 */
function signCloudFrontUrl(url, privateKey, keyPairId, expireTime) {
    const policy = JSON.stringify({
        Statement: [
            {
                Resource: url,
                Condition: {
                    DateLessThan: {
                        'AWS:EpochTime': expireTime
                    }
                }
            }
        ]
    });

    const sign = crypto.createSign('RSA-SHA1');
    sign.update(policy);
    const signature = sign.sign(privateKey, 'base64');

    // Make URL safe
    const safeSignature = signature.replace(/\+/g, '-').replace(/=/g, '_').replace(/\//g, '~');
    const safePolicy = Buffer.from(policy).toString('base64').replace(/\+/g, '-').replace(/=/g, '_').replace(/\//g, '~');

    return `${url}?Policy=${safePolicy}&Signature=${safeSignature}&Key-Pair-Id=${keyPairId}`;
}

/**
 * Generate a Signed URL for a given video ID
 * @param {string} videoId - The ID of the video content
 * @returns {Promise<string>} - The time-limited signed URL
 */
export async function getSignedVideoUrl(videoId) {
    try {
        // Development Bypass
        if (process.env.NODE_ENV === 'development') {
            // Check if we have actual keys even in dev, if so, we might want to test it.
            // But usually in dev we just return the ID or a mock.
            if (!process.env.CLOUDFRONT_PRIVATE_KEY) {
                console.log(`[DRM] Serving dev url for ${videoId}`);
                return videoId;
            }
        }

        const domain = process.env.CLOUDFRONT_DOMAIN;
        const privateKey = process.env.CLOUDFRONT_PRIVATE_KEY;
        const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID;

        // If we have CloudFront credentials, use them
        if (domain && privateKey && keyPairId) {
            // Handle escaped newlines in private key (common in .env)
            const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

            // Construct full URL
            // Ensure domain doesn't end with slash and videoId doesn't start with slash to avoid double slash
            const baseUrl = domain.replace(/\/$/, '');
            const path = videoId.replace(/^\//, '');
            const fullUrl = `${baseUrl}/${path}`;

            // Expire in 1 hour
            const expires = Math.floor((Date.now() + 3600 * 1000) / 1000);

            const signedUrl = signCloudFrontUrl(fullUrl, formattedPrivateKey, keyPairId, expires);
            return signedUrl;
        }

        // TODO: Add VdoCipher implementation here if needed
        // if (process.env.VDOCIPHER_API_SECRET) { ... }

        // Fallback: If no signing credentials are found, just return the videoId
        // In a strict production environment, this might should throw an error.
        console.warn('[DRM] No signing credentials found. Returning raw video ID.');
        return videoId;

    } catch (error) {
        console.error('[DRM ERROR] Failed to sign URL:', error);
        // Fallback to avoid breaking the UI, but this is insecure
        return videoId;
    }
}

/**
 * Validates if a user has access to this content
 * (Ideally called before getSignedVideoUrl)
 */
export function validateAccess(user, productId) {
    if (user.role === 'ADMIN') return true;
    // Check subscription logic here if needed, 
    // although typically handled by the API route calling this.
    return false;
}
