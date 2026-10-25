'use client';

/**
 * Violation Logger Utility
 * Logs media protection violations for monitoring and analytics
 */

// In-memory violation store (for client-side tracking)
let violationStore = [];
const MAX_STORED_VIOLATIONS = 100;

/**
 * Log a protection violation
 * @param {string} type - Type of violation (from VIOLATION_TYPES)
 * @param {Object} details - Additional violation details
 */
export function logViolation(type, details = {}) {
    const violation = {
        type,
        details,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    };

    // Store locally
    violationStore.push(violation);
    if (violationStore.length > MAX_STORED_VIOLATIONS) {
        violationStore = violationStore.slice(-MAX_STORED_VIOLATIONS);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
        console.warn('[SECURITY VIOLATION]', type, details);
    }

    // Send to backend API (fire and forget)
    try {
        fetch('/api/security/log-violation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(violation)
        }).catch(() => {
            // Silently fail - don't disrupt user experience
        });
    } catch (error) {
        // Ignore errors - logging should never break the app
    }

    return violation;
}

/**
 * Get all stored violations (for debugging)
 */
export function getStoredViolations() {
    return [...violationStore];
}

/**
 * Clear stored violations
 */
export function clearViolations() {
    violationStore = [];
}

/**
 * Check if user has exceeded violation threshold
 * @param {number} threshold - Maximum allowed violations
 * @param {number} timeWindowMs - Time window in milliseconds
 */
export function hasExceededThreshold(threshold = 5, timeWindowMs = 60000) {
    const now = Date.now();
    const recentViolations = violationStore.filter(v => {
        const violationTime = new Date(v.timestamp).getTime();
        return now - violationTime < timeWindowMs;
    });
    return recentViolations.length >= threshold;
}

const violationLogger = {
    logViolation,
    getStoredViolations,
    clearViolations,
    hasExceededThreshold
};

export default violationLogger;
