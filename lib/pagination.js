/**
 * Pagination utilities for admin panel
 */

/**
 * Generate pagination metadata
 * @param {number} totalCount - Total number of items
 * @param {number} currentPage - Current page number (1-indexed)
 * @param {number} pageSize - Items per page
 * @returns {Object} Pagination metadata
 */
export function generatePaginationMetadata(totalCount, currentPage, pageSize) {
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNext = currentPage < totalPages;
    const hasPrev = currentPage > 1;
    
    return {
        currentPage,
        pageSize,
        totalCount,
        totalPages,
        hasNext,
        hasPrev,
        startIndex: (currentPage - 1) * pageSize,
        endIndex: Math.min(currentPage * pageSize, totalCount)
    };
}

/**
 * Paginate array data (client-side pagination)
 * @param {Array} data - Array of items
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Object} Paginated result
 */
export function paginateArray(data, page = 1, limit = 20) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = data.slice(startIndex, endIndex);
    
    return {
        data: paginatedData,
        pagination: generatePaginationMetadata(data.length, page, limit)
    };
}

/**
 * Parse pagination parameters from request
 * @param {URLSearchParams|Object} params - Request parameters
 * @param {Object} options - Configuration options
 * @returns {Object} Normalized pagination parameters
 */
export function parsePaginationParams(params, options = {}) {
    const {
        defaultPage = 1,
        defaultLimit = 20,
        maxLimit = 100
    } = options;
    
    let page = defaultPage;
    let limit = defaultLimit;
    
    // Handle different parameter sources
    const getPage = (params) => {
        if (params instanceof URLSearchParams) {
            return parseInt(params.get('page')) || defaultPage;
        }
        return parseInt(params.page) || defaultPage;
    };
    
    const getLimit = (params) => {
        if (params instanceof URLSearchParams) {
            return parseInt(params.get('limit')) || defaultLimit;
        }
        return parseInt(params.limit) || defaultLimit;
    };
    
    page = Math.max(1, getPage(params));
    limit = Math.min(maxLimit, Math.max(1, getLimit(params)));
    
    return { page, limit, skip: (page - 1) * limit };
}

/**
 * Create pagination response for API
 * @param {Array} data - Paginated data
 * @param {number} totalCount - Total count from database
 * @param {Object} pagination - Pagination parameters
 * @returns {Object} Formatted response
 */
export function createPaginatedResponse(data, totalCount, pagination) {
    return {
        data,
        pagination: {
            ...generatePaginationMetadata(totalCount, pagination.page, pagination.limit),
            // Add navigation links
            links: generatePaginationLinks(totalCount, pagination)
        }
    };
}

/**
 * Generate pagination navigation links
 * @param {number} totalCount - Total number of items
 * @param {Object} pagination - Pagination parameters
 * @returns {Object} Navigation links
 */
function generatePaginationLinks(totalCount, pagination) {
    const { page, limit } = pagination;
    const totalPages = Math.ceil(totalCount / limit);
    
    const links = {};
    
    // Previous link
    if (page > 1) {
        links.prev = {
            page: page - 1,
            limit
        };
    }
    
    // Next link
    if (page < totalPages) {
        links.next = {
            page: page + 1,
            limit
        };
    }
    
    // First and Last links
    if (totalPages > 1) {
        links.first = { page: 1, limit };
        links.last = { page: totalPages, limit };
    }
    
    return links;
}

/**
 * Pagination component props generator
 * @param {Object} pagination - Pagination metadata
 * @param {Function} onPageChange - Page change handler
 * @returns {Object} Props for pagination component
 */
export function getPaginationProps(pagination, onPageChange) {
    return {
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
        hasNext: pagination.hasNext,
        hasPrev: pagination.hasPrev,
        totalCount: pagination.totalCount,
        pageSize: pagination.pageSize,
        onPageChange,
        showNumbers: true,
        showFirstLast: true,
        siblingCount: 1
    };
}

/**
 * Debounce function for search inputs
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function for scroll/pagination events
 * @param {Function} func - Function to throttle
 * @param {number} limit - Throttle limit in ms
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Infinite scroll hook for React components
 * @param {Function} fetchData - Function to fetch more data
 * @param {Object} options - Scroll options
 * @returns {Object} Scroll handlers and state
 */
export function useInfiniteScroll(fetchData, options = {}) {
    const {
        threshold = 100,
        enabled = true
    } = options;
    
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    
    const loadMore = useCallback(async () => {
        if (!enabled || isLoading || !hasMore) return;
        
        setIsLoading(true);
        try {
            const result = await fetchData();
            setHasMore(result.hasMore);
        } catch (error) {
            console.error('Infinite scroll error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [enabled, isLoading, hasMore, fetchData]);
    
    // Intersection Observer for infinite scroll
    useEffect(() => {
        if (!enabled) return;
        
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );
        
        const sentinel = document.getElementById('scroll-sentinel');
        if (sentinel) {
            observer.observe(sentinel);
        }
        
        return () => observer.disconnect();
    }, [loadMore, hasMore, isLoading, enabled]);
    
    return { isLoading, hasMore, loadMore };
}

// Export commonly used pagination configurations
export const PAGINATION_CONFIGS = {
    DEFAULT: { defaultPage: 1, defaultLimit: 20, maxLimit: 100 },
    COMPACT: { defaultPage: 1, defaultLimit: 10, maxLimit: 50 },
    EXPANDED: { defaultPage: 1, defaultLimit: 50, maxLimit: 200 },
    MINIMAL: { defaultPage: 1, defaultLimit: 5, maxLimit: 25 }
};