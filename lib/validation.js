import { z } from 'zod';

/**
 * Input sanitization and validation utilities
 */

// Base sanitizers
const sanitizeString = (str) => {
    if (typeof str !== 'string') return '';
    return str
        .trim()
        .replace(/[<>]/g, '') // Remove HTML tags
        .replace(/["']/g, '') // Remove quotes
        .substring(0, 1000); // Limit length
};

const sanitizeEmail = (email) => {
    if (typeof email !== 'string') return '';
    return email
        .trim()
        .toLowerCase()
        .replace(/[<>"]/g, '')
        .substring(0, 254); // RFC 5321 limit
};

const sanitizeNumber = (num) => {
    const parsed = parseFloat(num);
    return isNaN(parsed) ? 0 : parsed;
};

// Zod schemas for admin inputs
export const adminSchemas = {
    // User management
    updateUser: z.object({
        userId: z.string().min(1, 'User ID is required'),
        isVerified: z.boolean().optional(),
        isBanned: z.boolean().optional(),
        role: z.enum(['USER', 'ADMIN']).optional()
    }),

    // Product/course management
    product: z.object({
        title: z.string()
            .min(3, 'Title must be at least 3 characters')
            .max(100, 'Title must be less than 100 characters')
            .transform(sanitizeString),
        description: z.string()
            .max(1000, 'Description must be less than 1000 characters')
            .optional()
            .transform(val => val ? sanitizeString(val) : undefined),
        type: z.enum(['VIDEO_COURSE', 'PDF_RESOURCE']),
        price: z.number()
            .positive('Price must be positive')
            .max(999999, 'Price too high'),
        contentUrl: z.string()
            .url('Must be a valid URL')
            .max(500, 'URL too long'),
        validityDays: z.number()
            .int('Must be whole number')
            .min(1, 'Must be at least 1 day')
            .max(3650, 'Cannot exceed 10 years'),
        thumbnail: z.string()
            .url('Must be a valid URL')
            .max(500, 'URL too long')
            .optional()
    }),

    // Admin login
    adminLogin: z.object({
        email: z.string()
            .email('Invalid email format')
            .transform(sanitizeEmail),
        action: z.enum(['send-otp', 'verify-otp']),
        otp: z.string()
            .length(6, 'OTP must be 6 digits')
            .regex(/^\d{6}$/, 'OTP must contain only digits')
            .optional()
    }).refine(
        (data) => data.action !== 'verify-otp' || data.otp,
        { message: 'OTP is required for verification', path: ['otp'] }
    ),

    // Contact message
    contactMessage: z.object({
        name: z.string()
            .min(2, 'Name must be at least 2 characters')
            .max(50, 'Name too long')
            .transform(sanitizeString),
        email: z.string()
            .email('Invalid email format')
            .transform(sanitizeEmail),
        phone: z.string()
            .max(20, 'Phone number too long')
            .optional()
            .transform(val => val ? sanitizeString(val) : undefined),
        reason: z.string()
            .max(50, 'Reason too long')
            .optional()
            .transform(val => val ? sanitizeString(val) : 'General'),
        message: z.string()
            .min(10, 'Message must be at least 10 characters')
            .max(2000, 'Message too long')
            .transform(sanitizeString)
    }),

    // System settings
    systemSettings: z.object({
        siteName: z.string()
            .min(1, 'Site name is required')
            .max(100, 'Site name too long')
            .transform(sanitizeString),
        siteDescription: z.string()
            .max(500, 'Description too long')
            .optional()
            .transform(val => val ? sanitizeString(val) : undefined),
        supportEmail: z.string()
            .email('Invalid email format')
            .transform(sanitizeEmail)
            .optional(),
        razorpayMode: z.enum(['test', 'live']),
        defaultValidityDays: z.number()
            .int()
            .min(1)
            .max(3650),
        enableEmailNotifications: z.boolean(),
        enableNewUserWelcome: z.boolean(),
        maintenanceMode: z.boolean()
    }),

    // CMS content
    testimonial: z.object({
        name: z.string()
            .min(2, 'Name required')
            .max(50, 'Name too long')
            .transform(sanitizeString),
        role: z.string()
            .min(2, 'Role required')
            .max(50, 'Role too long')
            .transform(sanitizeString),
        content: z.string()
            .min(10, 'Content required')
            .max(500, 'Content too long')
            .transform(sanitizeString),
        profit: z.string()
            .max(50, 'Profit info too long')
            .optional()
            .transform(val => val ? sanitizeString(val) : undefined),
        image: z.string()
            .url('Invalid image URL')
            .max(300, 'URL too long')
            .optional()
    }),

    stat: z.object({
        label: z.string()
            .min(1, 'Label required')
            .max(30, 'Label too long')
            .transform(sanitizeString),
        value: z.string()
            .min(1, 'Value required')
            .max(20, 'Value too long')
            .transform(sanitizeString),
        suffix: z.string()
            .max(10, 'Suffix too long')
            .optional()
            .transform(val => val ? sanitizeString(val) : ''),
        icon: z.string()
            .min(1, 'Icon required')
            .max(20, 'Icon name too long')
            .transform(sanitizeString),
        order: z.number()
            .int()
            .min(0)
            .default(0)
    }),

    feature: z.object({
        title: z.string()
            .min(3, 'Title required')
            .max(50, 'Title too long')
            .transform(sanitizeString),
        desc: z.string()
            .min(10, 'Description required')
            .max(200, 'Description too long')
            .transform(sanitizeString),
        icon: z.string()
            .min(1, 'Icon required')
            .max(20, 'Icon name too long')
            .transform(sanitizeString),
        order: z.number()
            .int()
            .min(0)
            .default(0)
    })
};

/**
 * Validate and sanitize request body
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {any} data - Request body data
 * @returns {Object} Result with success, data, and errors
 */
export function validateInput(schema, data) {
    try {
        const result = schema.safeParse(data);
        return {
            success: result.success,
            data: result.success ? result.data : null,
            errors: result.success ? null : result.error.flatten()
        };
    } catch (error) {
        return {
            success: false,
            data: null,
            errors: { formErrors: ['Validation failed'], fieldErrors: {} }
        };
    }
}

/**
 * Validation middleware for API routes
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Middleware function
 */
export function withValidation(schema) {
    return (handler) => {
        return async (request, ...args) => {
            try {
                const body = await request.json();
                const validation = validateInput(schema, body);
                
                if (!validation.success) {
                    console.log('[Validation] Input validation failed:', validation.errors);
                    return new Response(
                        JSON.stringify({ 
                            error: 'Invalid input data', 
                            details: validation.errors 
                        }), 
                        { 
                            status: 400,
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                }

                // Add validated data to request context
                request.validatedData = validation.data;
                return handler(request, ...args);

            } catch (error) {
                console.error('[Validation] Middleware error:', error);
                return new Response(
                    JSON.stringify({ error: 'Invalid request format' }), 
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                );
            }
        };
    };
}

/**
 * Sanitize query parameters
 * @param {URLSearchParams} searchParams - URL search parameters
 * @returns {Object} Sanitized parameters
 */
export function sanitizeQueryParams(searchParams) {
    const sanitized = {};
    
    // Common pagination params
    const page = parseInt(searchParams.get('page'));
    if (!isNaN(page) && page > 0) {
        sanitized.page = Math.min(page, 1000); // Prevent excessive pagination
    }
    
    const limit = parseInt(searchParams.get('limit'));
    if (!isNaN(limit) && limit > 0) {
        sanitized.limit = Math.min(limit, 100); // Reasonable limit
    }
    
    // Search term
    const search = searchParams.get('search');
    if (search) {
        sanitized.search = sanitizeString(search);
    }
    
    // Filter parameters
    const filter = searchParams.get('filter');
    if (filter) {
        sanitized.filter = sanitizeString(filter);
    }
    
    return sanitized;
}

/**
 * XSS prevention for output
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
    if (typeof str !== 'string') return String(str);
    
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
    };
    
    return str.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Validate and sanitize file uploads
 * @param {File} file - Uploaded file
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export function validateFile(file, options = {}) {
    const {
        maxSize = 5 * 1024 * 1024, // 5MB default
        allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
        allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp']
    } = options;

    if (!file) {
        return { valid: false, error: 'No file provided' };
    }

    // Check file size
    if (file.size > maxSize) {
        return { valid: false, error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB` };
    }

    // Check MIME type
    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'Invalid file type' };
    }

    // Check extension
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(extension)) {
        return { valid: false, error: 'Invalid file extension' };
    }

    return { valid: true, file };
}