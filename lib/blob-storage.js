/**
 * Vercel Blob Storage Wrapper
 * Handles file uploads to Vercel Blob storage
 */
import { put, del, list } from '@vercel/blob';

// Allowed file types
const ALLOWED_TYPES = {
    pdf: ['application/pdf'],
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    video: ['video/mp4', 'video/webm', 'video/quicktime'],
};

// Max file sizes (in bytes)
const MAX_SIZES = {
    pdf: 50 * 1024 * 1024,      // 50MB
    image: 5 * 1024 * 1024,     // 5MB
    thumbnail: 2 * 1024 * 1024, // 2MB
    video: 500 * 1024 * 1024,   // 500MB
};

/**
 * Upload a file to Vercel Blob
 * @param {File|Blob} file - File to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result with URL
 */
export async function uploadToBlob(file, options = {}) {
    const {
        folder = 'uploads',
        filename = null,
        contentType = null,
        access = 'public',
    } = options;

    // Generate filename if not provided
    const finalFilename = filename || `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const pathname = `${folder}/${finalFilename}`;

    try {
        const blob = await put(pathname, file, {
            access,
            contentType: contentType || file.type,
        });

        return {
            success: true,
            url: blob.url,
            pathname: blob.pathname,
            contentType: blob.contentType,
            size: file.size,
        };
    } catch (error) {
        console.error('[BlobStorage] Upload error:', error);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Upload a PDF file with validation
 * @param {File} file - PDF file to upload
 * @returns {Promise<Object>} Upload result
 */
export async function uploadPdf(file) {
    // Validate type
    if (!ALLOWED_TYPES.pdf.includes(file.type)) {
        return { success: false, error: 'Invalid file type. Only PDF allowed.' };
    }

    // Validate size
    if (file.size > MAX_SIZES.pdf) {
        return { success: false, error: `File too large. Max ${MAX_SIZES.pdf / 1024 / 1024}MB allowed.` };
    }

    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    return uploadToBlob(file, {
        folder: 'pdfs',
        filename,
        contentType: 'application/pdf',
    });
}

/**
 * Upload a thumbnail image with validation
 * @param {File|Blob} file - Image file to upload
 * @param {string} originalName - Original filename
 * @returns {Promise<Object>} Upload result
 */
export async function uploadThumbnail(file, originalName = 'thumbnail') {
    // Validate type
    if (!ALLOWED_TYPES.image.includes(file.type)) {
        return { success: false, error: 'Invalid file type. Only JPG, PNG, WebP allowed.' };
    }

    // Validate size
    if (file.size > MAX_SIZES.thumbnail) {
        return { success: false, error: `File too large. Max ${MAX_SIZES.thumbnail / 1024 / 1024}MB allowed.` };
    }

    const ext = file.type.split('/')[1];
    const filename = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}.${ext}`;

    return uploadToBlob(file, {
        folder: 'thumbnails',
        filename,
    });
}

/**
 * Delete a file from Vercel Blob
 * @param {string} url - Blob URL to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteFromBlob(url) {
    try {
        await del(url);
        return { success: true };
    } catch (error) {
        console.error('[BlobStorage] Delete error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * List files in a folder
 * @param {string} prefix - Folder prefix
 * @returns {Promise<Object>} List of blobs
 */
export async function listBlobs(prefix = '') {
    try {
        const result = await list({ prefix });
        return {
            success: true,
            blobs: result.blobs,
        };
    } catch (error) {
        console.error('[BlobStorage] List error:', error);
        return { success: false, error: error.message };
    }
}

// Export constants
export { ALLOWED_TYPES, MAX_SIZES };
