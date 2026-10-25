/**
 * Data Transfer Objects (DTOs)
 * 
 * These functions filter sensitive data before sending to the client.
 * Use them to prevent accidental data leaks in API responses.
 */

/**
 * Safe Product DTO - excludes contentUrl to prevent video link theft
 * @param {object} product - Raw Prisma product object
 * @returns {object} - Product without sensitive fields
 */
export function toSafeProduct(product) {
    if (!product) return null;
    const { contentUrl, ...safeProduct } = product;
    return safeProduct;
}

/**
 * Safe User DTO - excludes password hash
 * @param {object} user - Raw Prisma user object
 * @returns {object} - User without sensitive fields
 */
export function toSafeUser(user) {
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
}

/**
 * Safe Subscription DTO - includes safe product
 * @param {object} subscription - Raw Prisma subscription with product
 * @returns {object} - Subscription with filtered product
 */
export function toSafeSubscription(subscription) {
    if (!subscription) return null;
    return {
        ...subscription,
        product: subscription.product ? toSafeProduct(subscription.product) : null
    };
}
