/**
 * Frontend performance optimization utilities
 */

/**
 * Bundle optimization configuration
 */
export const bundleOptimization = {
    // Code splitting configuration
    codeSplitting: {
        chunks: 'all',
        cacheGroups: {
            vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
                priority: 10
            },
            common: {
                minChunks: 2,
                chunks: 'all',
                priority: 5
            }
        }
    },

    // Minification settings
    minimizer: {
        terser: {
            parallel: true,
            terserOptions: {
                compress: {
                    drop_console: process.env.NODE_ENV === 'production',
                    drop_debugger: true
                },
                mangle: true
            }
        }
    },

    // Asset optimization
    assets: {
        images: {
            maxSize: 8192, // 8KB
            quality: 75
        },
        fonts: {
            maxSize: 102400 // 100KB
        }
    }
};

/**
 * Lazy loading utilities
 */
export const lazyLoading = {
    /**
     * Create lazy-loaded component
     */
    createLazyComponent(importFn, fallback = null) {
        const LazyComponent = dynamic(importFn, {
            ssr: false,
            loading: fallback || (() => (
                <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
            ))
        });
        return LazyComponent;
    },

    /**
     * Intersection Observer based lazy loading
     */
    useIntersectionObserver(options = {}) {
        const [isVisible, setIsVisible] = useState(false);
        const elementRef = useRef();

        useEffect(() => {
            const element = elementRef.current;
            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        observer.unobserve(entry.target);
                    }
                },
                { threshold: 0.1, ...options }
            );

            if (element) {
                observer.observe(element);
            }

            return () => {
                if (element) {
                    observer.unobserve(element);
                }
            };
        }, [options]); // Added elementRef.current to dependencies
        // to re-observe if the ref's element changes
        // and removed duplicate 'options'
        return [elementRef, isVisible];
    }
};

/**
 * Image optimization utilities
 */
export const imageOptimization = {
    /**
     * Generate responsive image attributes
     */
    getResponsiveImageProps(src, alt, sizes = '100vw') {
        return {
            src,
            alt,
            sizes,
            style: { width: '100%', height: 'auto' },
            placeholder: 'blur',
            blurDataURL: 'data:image/svg+xml;base64,...' // Base64 encoded placeholder
        };
    },

    /**
     * Preload critical images
     */
    preloadImages(imageUrls) {
        imageUrls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = url;
            document.head.appendChild(link);
        });
    }
};

/**
 * Performance monitoring hooks
 */
export const performanceHooks = {
    /**
     * Measure component render performance
     */
    useRenderTimer(componentName) {
        const mountTime = useRef(performance.now());

        useEffect(() => {
            const renderTime = performance.now() - mountTime.current;
            console.log(`[Performance] ${componentName} rendered in ${renderTime.toFixed(2)}ms`);

            // Send to performance monitoring service
            if (typeof window !== 'undefined' && window.performanceReporter) {
                window.performanceReporter.recordFrontendMetrics({
                    page: window.location.pathname,
                    loadTime: renderTime,
                    userId: window.currentUser?.id
                });
            }
        }, [componentName]); // Removed duplicate 'componentName'
    },

    /**
     * Monitor API request performance
     */
    useAPIMonitor() {
        const [metrics, setMetrics] = useState({
            requestCount: 0,
            avgResponseTime: 0,
            errorCount: 0
        });

        const monitorRequest = useCallback(async (url, options = {}) => {
            const startTime = performance.now();

            try {
                const response = await fetch(url, options);
                const endTime = performance.now();
                const duration = endTime - startTime;

                setMetrics(prev => ({
                    requestCount: prev.requestCount + 1,
                    avgResponseTime: ((prev.avgResponseTime * prev.requestCount) + duration) / (prev.requestCount + 1),
                    errorCount: prev.errorCount + (response.ok ? 0 : 1)
                }));

                return response;
            } catch (error) {
                const endTime = performance.now();
                const duration = endTime - startTime;

                setMetrics(prev => ({
                    requestCount: prev.requestCount + 1,
                    avgResponseTime: ((prev.avgResponseTime * prev.requestCount) + duration) / (prev.requestCount + 1),
                    errorCount: prev.errorCount + 1
                }));

                throw error;
            }
        }, []);

        return { monitorRequest, metrics };
    }
};

/**
 * Critical resource loading
 */
export const criticalResources = {
    /**
     * Preload critical CSS
     */
    preloadCriticalCSS(cssPaths) {
        cssPaths.forEach(path => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'style';
            link.href = path;
            document.head.appendChild(link);
        });
    },

    /**
     * Load non-critical JavaScript defer
     */
    loadDeferredScript(src, onLoad) {
        const script = document.createElement('script');
        script.src = src;
        script.defer = true;
        if (onLoad) script.onload = onLoad;
        document.body.appendChild(script);
    },

    /**
     * Priority-based resource loading
     */
    loadResources(resources) {
        resources.forEach(({ type, src, priority = 'low' }) => {
            switch (type) {
                case 'script':
                    const script = document.createElement('script');
                    script.src = src;
                    script[priority === 'high' ? 'async' : 'defer'] = true;
                    document.body.appendChild(script);
                    break;
                case 'stylesheet':
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = src;
                    if (priority === 'high') {
                        link.media = 'print';
                        link.onload = () => { link.media = 'all'; };
                    }
                    document.head.appendChild(link);
                    break;
            }
        });
    }
};

/**
 * Memory leak prevention
 */
export const memoryManagement = {
    /**
     * Cleanup event listeners
     */
    useEventListener(target, event, handler, options) {
        useEffect(() => {
            target.addEventListener(event, handler, options);
            return () => target.removeEventListener(event, handler, options);
        }, [target, event, handler, options]);
    },

    /**
     * Memory usage monitoring
     */
    monitorMemoryUsage(callback) {
        if ('memory' in performance) {
            const interval = setInterval(() => {
                const memory = performance.memory;
                callback({
                    used: Math.round(memory.usedJSHeapSize / 1048576), // MB
                    total: Math.round(memory.totalJSHeapSize / 1048576), // MB
                    limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
                });
            }, 5000);

            return () => clearInterval(interval);
        }
    }
};

// Export React imports for convenience
// Note: These should be imported directly from 'react' in components
// export { useState, useEffect, useCallback, useRef, dynamic } from 'react';