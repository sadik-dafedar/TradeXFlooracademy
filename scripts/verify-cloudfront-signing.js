const crypto = require('crypto');

// Generate a key pair for testing
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
    }
});

// Mock environment variables
process.env.CLOUDFRONT_DOMAIN = 'https://d123.cloudfront.net';
process.env.CLOUDFRONT_PRIVATE_KEY = privateKey;
process.env.CLOUDFRONT_KEY_PAIR_ID = 'APKAI1234567890';
process.env.NODE_ENV = 'production'; // Force production path

async function test() {
    console.log('--- Testing DRM Signing ---');

    // We need to import the module dynamically because it's an ES module
    const { getSignedVideoUrl } = await import('../lib/drm.js');

    const videoId = 'test-video.mp4';
    const signedUrl = await getSignedVideoUrl(videoId);

    console.log('Signed URL:', signedUrl);

    if (!signedUrl.includes('Policy=') || !signedUrl.includes('Signature=') || !signedUrl.includes('Key-Pair-Id=')) {
        console.error('FAILED: Signed URL missing required parameters.');
        process.exit(1);
    }

    if (!signedUrl.startsWith(process.env.CLOUDFRONT_DOMAIN)) {
        console.error('FAILED: Signed URL does not start with the domain.');
        process.exit(1);
    }

    // Verify Signature
    try {
        const urlObj = new URL(signedUrl);
        const policy = urlObj.searchParams.get('Policy');
        const signature = urlObj.searchParams.get('Signature');

        // Restore standard Base64
        // CloudFront Replacements: + -> -, = -> _, / -> ~
        // Reverse: - -> +, _ -> =, ~ -> /
        const policyJson = Buffer.from(policy.replace(/-/g, '+').replace(/_/g, '=').replace(/~/g, '/'), 'base64').toString('utf-8');
        console.log('Decoded Policy:', policyJson);

        const verifier = crypto.createVerify('RSA-SHA1');
        verifier.update(policyJson);
        const signatureBuffer = Buffer.from(signature.replace(/-/g, '+').replace(/_/g, '=').replace(/~/g, '/'), 'base64');

        const valid = verifier.verify(publicKey, signatureBuffer);

        if (valid) {
            console.log('SUCCESS: Signature verified successfully.');
        } else {
            console.error('FAILED: Signature verification failed.');
            process.exit(1);
        }

    } catch (e) {
        console.error('FAILED: Verification error', e);
        process.exit(1);
    }
}

test().catch(console.error);
