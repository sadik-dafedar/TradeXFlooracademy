'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import { Loader2, AlertTriangle, EyeOff, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaProtection, EnhancedWatermark, RecordingBlocker, PROTECTION_LEVELS } from '@/lib/media-protection';

const SecureVideoPlayer = ({ 
    url, 
    watermarkText = "TradeX Floor Academy", 
    poster,
    protectionLevel = "STANDARD",
    onViolationDetected 
}) => {
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState(false);
    const [recordingBlocked, setRecordingBlocked] = useState(false);
    const playerRef = useRef(null);

    // Apply comprehensive media protection
    const { containerRef } = useMediaProtection({
        ...PROTECTION_LEVELS[protectionLevel],
        watermarkText,
        onViolationDetected: (violation) => {
            console.warn('Video Protection Violation:', violation);
            if (onViolationDetected) {
                onViolationDetected(violation);
            }
            
            // Block recording on serious violations
            if (violation.type === 'potential_recorder_detected' || violation.violationCount > 3) {
                setRecordingBlocked(true);
                setTimeout(() => setRecordingBlocked(false), 5000); // Show for 5 seconds
            }
        }
    });

    // Prevent Context Menu
    const handleContextMenu = (e) => {
        e.preventDefault();
        return false;
    };

    return (
        <>
            {/* Recording Blocker Overlay */}
            <RecordingBlocker 
                isActive={recordingBlocked} 
                message="Unauthorized Recording Detected" 
            />

            <div
                ref={containerRef}
                className="media-protection-container relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl group select-none"
                onContextMenu={handleContextMenu}
            >
                {/* Security Status Indicator */}
                <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                    <Shield className="text-green-500" size={16} />
                    <span className="text-xs text-white/70">Protected</span>
                </div>

                {/* Enhanced Dynamic Watermark */}
                <EnhancedWatermark 
                    text={watermarkText} 
                    density="high" 
                    animation={true} 
                />

                {/* Blur Overlay (Anti-Recording Trigger) */}
                <AnimatePresence>
                    {containerRef.current?.classList.contains('media-hidden') && (
                        <motion.div
                            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                            animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
                            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80"
                        >
                            <EyeOff size={48} className="text-red-500 mb-4 animate-pulse" />
                            <h3 className="text-xl font-bold text-white">Security Mode Active</h3>
                            <p className="text-white/50 text-sm mt-2">Please keep this window focused to watch.</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Transparent Overlay (Prevents Direct Video Interaction) */}
                <div className="absolute inset-0 z-30 bg-transparent" onContextMenu={handleContextMenu} />

                {/* Video Player */}
                <ReactPlayer
                    ref={playerRef}
                    url={url}
                    width="100%"
                    height="100%"
                    controls={true}
                    light={poster}
                    playing={!containerRef.current?.classList.contains('media-hidden')}
                    config={{
                        file: {
                            attributes: {
                                onContextMenu: (e) => e.preventDefault(),
                                controlsList: 'nodownload nofullscreen noremoteplayback',
                                disablePictureInPicture: true,
                            }
                        }
                    }}
                    onReady={() => setIsReady(true)}
                    onError={() => setError(true)}
                    style={{ position: 'absolute', top: 0, left: 0, zIndex: 10 }}
                />

                {/* Loading State */}
                {!isReady && !error && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50">
                        <Loader2 className="animate-spin text-pink-500" size={40} />
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/90 text-red-500">
                        <AlertTriangle size={48} className="mb-2" />
                        <p>Failed to load video stream.</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default SecureVideoPlayer;
