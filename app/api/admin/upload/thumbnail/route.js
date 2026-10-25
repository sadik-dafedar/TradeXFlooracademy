import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { rateLimitPresets } from '@/lib/rate-limit-middleware';
import { uploadThumbnail } from '@/lib/blob-storage';
import { logAdminAudit, AUDIT_ACTIONS, TARGET_TYPES } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

// POST - Upload thumbnail image
const uploadThumbnailHandler = rateLimitPresets.adminWrite(requireAdminAuth(async function POST(request) {
    const admin = request.admin;

    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const productId = formData.get('productId');

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Upload thumbnail
        const result = await uploadThumbnail(file, file.name || 'thumbnail');

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        // Log the upload
        await logAdminAudit(admin, {
            action: AUDIT_ACTIONS.CONTENT_UPLOAD,
            targetType: TARGET_TYPES.CONTENT,
            targetId: productId || null,
            details: `Uploaded thumbnail: ${file.name}`,
            metadata: {
                filename: file.name,
                size: file.size,
                url: result.url
            },
        }, request);

        return NextResponse.json({
            success: true,
            url: result.url,
            message: 'Thumbnail uploaded successfully',
        });

    } catch (error) {
        console.error('[Admin Thumbnail Upload] Error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}));

export { uploadThumbnailHandler as POST };
