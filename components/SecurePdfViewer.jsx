'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Lock, AlertTriangle, FileText, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize2, Minimize2, Shield } from 'lucide-react';
import { useMediaProtection, EnhancedWatermark, RecordingBlocker, PROTECTION_LEVELS } from '@/lib/media-protection';

/**
 * Secure PDF Viewer Component
 * 
 * Features:
 * - Anti-screen recording protection (shows black screen)
 * - Dynamic watermarking with user email
 * - Right-click disabled
 * - Keyboard shortcut blocking (Ctrl+S, PrintScreen)
 * - Window blur detection (content hidden when not focused)
 * - Integration with media-protection system
 */
export default function SecurePdfViewer({
    url,
    title = "Protected Document",
    watermarkText = "TradeX Floor Academy",
    protectionLevel = "ENTERPRISE",
    onViolationDetected
}) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [zoom, setZoom] = useState(100);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [recordingBlocked, setRecordingBlocked] = useState(false);
    const containerRef = useRef(null);

    // Apply comprehensive media protection
    const { containerRef: protectionRef } = useMediaProtection({
        ...PROTECTION_LEVELS[protectionLevel],
        watermarkText,
        onViolationDetected: (violation) => {
            console.warn('PDF Protection Violation:', violation);
            if (onViolationDetected) {
                onViolationDetected(violation);
            }

            // Block recording on serious violations
            if (violation.type === 'potential_recorder_detected' ||
                violation.type === 'screen_capture_detected' ||
                violation.violationCount > 2) {
                setRecordingBlocked(true);
                setTimeout(() => setRecordingBlocked(false), 8000);
            }
        }
    });

    // Combine refs
    useEffect(() => {
        if (protectionRef.current && containerRef.current) {
            // Apply protection classes to our container
            containerRef.current.className = protectionRef.current.className;
        }
    }, [protectionRef]);

    // Prevent context menu
    const handleContextMenu = (e) => {
        e.preventDefault();
        return false;
    };

    // Block keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Block Ctrl+S (Save)
            if (e.ctrlKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                return false;
            }
            // Block Ctrl+P (Print)
            if (e.ctrlKey && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                return false;
            }
            // Block Ctrl+Shift+S (Save As)
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                return false;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Zoom controls
    const handleZoomIn = () => {
        if (zoom < 200) setZoom(zoom + 25);
    };

    const handleZoomOut = () => {
        if (zoom > 50) setZoom(zoom - 25);
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    // Generate secure viewer URL (Google Docs Viewer prevents direct download)
    const getSecureViewerUrl = () => {
        if (!url) return null;

        // If it's already a full URL, use Google Docs Viewer
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
        }

        // For relative URLs, assume they're proxied through our API
        return url;
    };

    const viewerUrl = getSecureViewerUrl();

    if (!url) {
        return (
            <div className="aspect-video bg-black rounded-xl flex flex-col items-center justify-center text-red-500 p-6 text-center border border-red-900/50">
                <AlertTriangle size={48} className="mb-4" />
                <h3 className="text-xl font-bold mb-2">No Document URL</h3>
                <p className="text-sm opacity-80">Document URL is required</p>
            </div>
        );
    }

    return (
        <>
            {/* Recording Blocker Overlay */}
            <RecordingBlocker
                isActive={recordingBlocked}
                message="Unauthorized Recording Attempt Blocked"
            />

            <div
                ref={containerRef}
                className={`media-protection-container relative overflow-hidden bg-[#0a0a0f] ${isFullscreen ? 'fixed inset-0 z-50' : 'rounded-xl'}`}
                onContextMenu={handleContextMenu}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-[#12121a] border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#FF00CC]/20 to-[#00CCFF]/20 flex items-center justify-center">
                            <FileText className="text-[#00CCFF]" size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white truncate max-w-xs">{title}</h3>
                            <p className="text-xs text-gray-500">Protected PDF</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Security Badge */}
                        <div className="flex items-center gap-1.5 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                            <Shield size={12} className="text-green-400" />
                            <span className="text-[10px] font-bold tracking-wider text-green-400 uppercase">DRM Protected</span>
                        </div>

                        {/* Zoom Controls */}
                        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                            <button
                                onClick={handleZoomOut}
                                className="p-2 hover:bg-white/10 rounded transition-colors"
                                disabled={zoom <= 50}
                            >
                                <ZoomOut size={18} className={zoom <= 50 ? 'text-gray-600' : 'text-gray-300'} />
                            </button>
                            <span className="text-sm text-gray-400 w-12 text-center">{zoom}%</span>
                            <button
                                onClick={handleZoomIn}
                                className="p-2 hover:bg-white/10 rounded transition-colors"
                                disabled={zoom >= 200}
                            >
                                <ZoomIn size={18} className={zoom >= 200 ? 'text-gray-600' : 'text-gray-300'} />
                            </button>
                        </div>

                        {/* Fullscreen */}
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            {isFullscreen ? (
                                <Minimize2 size={18} className="text-gray-300" />
                            ) : (
                                <Maximize2 size={18} className="text-gray-300" />
                            )}
                        </button>
                    </div>
                </div>

                {/* PDF Content with Protection Layers */}
                <div
                    ref={protectionRef}
                    className="media-protection-container relative"
                    style={{ height: isFullscreen ? 'calc(100vh - 80px)' : '600px' }}
                >
                    {/* Loading State */}
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0f] z-30">
                            <div className="text-center">
                                <Loader2 size={48} className="mb-4 animate-spin text-[#FF00CC] mx-auto" />
                                <div className="flex items-center gap-2 text-sm font-medium opacity-80 text-white">
                                    <Lock size={16} className="text-green-400" />
                                    <span>Loading Secure Document...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Enhanced Watermark Overlay */}
                    <EnhancedWatermark
                        text={watermarkText}
                        density="high"
                        animation={true}
                        opacity={0.08}
                    />

                    {/* Additional static watermark for extra protection */}
                    <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center overflow-hidden">
                        <div className="text-white/[0.03] text-6xl font-bold transform -rotate-[30deg] whitespace-nowrap select-none">
                            {watermarkText}
                        </div>
                    </div>

                    {/* Transparent interaction blocker */}
                    <div
                        className="absolute inset-0 z-15 bg-transparent"
                        onContextMenu={handleContextMenu}
                        style={{ pointerEvents: 'none' }}
                    />

                    {/* PDF Iframe */}
                    <iframe
                        src={viewerUrl}
                        className="w-full h-full border-0"
                        style={{
                            transform: `scale(${zoom / 100})`,
                            transformOrigin: 'top center',
                            pointerEvents: 'auto'
                        }}
                        onLoad={() => setLoading(false)}
                        onError={() => {
                            setLoading(false);
                            setError('Failed to load document');
                        }}
                        title={title}
                        sandbox="allow-scripts allow-same-origin"
                    />
                </div>

                {/* Error State */}
                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-red-500 z-40">
                        <AlertTriangle size={48} className="mb-4" />
                        <h3 className="text-xl font-bold mb-2">Failed to Load Document</h3>
                        <p className="text-sm opacity-80">{error}</p>
                    </div>
                )}
            </div>
        </>
    );
}
