import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { rateLimitPresets } from '@/lib/rate-limit-middleware';
import { uploadPdf, uploadThumbnail } from '@/lib/blob-storage';
import { logAdminAudit, AUDIT_ACTIONS, TARGET_TYPES } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

// POST - Upload PDF file
const uploadPdfHandler = rateLimitPresets.adminWrite(requireAdminAuth(async function POST(request) {
    const admin = request.admin;

    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const generateThumbnail = formData.get('generateThumbnail') !== 'false';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Upload PDF
        const pdfResult = await uploadPdf(file);

        if (!pdfResult.success) {
            return NextResponse.json({ error: pdfResult.error }, { status: 400 });
        }

        // Generate thumbnail from first page (client will handle this)
        // Just return the PDF URL for now, client generates thumbnail

        // Log the upload
        await logAdminAudit(admin, {
            action: AUDIT_ACTIONS.CONTENT_UPLOAD,
            targetType: TARGET_TYPES.CONTENT,
            details: `Uploaded PDF: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
            metadata: {
                filename: file.name,
                size: file.size,
                url: pdfResult.url
            },
        }, request);

        return NextResponse.json({
            success: true,
            url: pdfResult.url,
            filename: file.name,
            size: file.size,
            message: 'PDF uploaded successfully',
        });

    } catch (error) {
        console.error('[Admin PDF Upload] Error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}));

export { uploadPdfHandler as POST };
