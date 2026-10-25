'use client';

import { useState, useEffect } from 'react';
import { Loader2, Lock, AlertTriangle, Shield } from 'lucide-react';
import { useMediaProtection, EnhancedWatermark, RecordingBlocker, PROTECTION_LEVELS } from '@/lib/media-protection';

export default function EnhancedVdoCipherPlayer({ 
    videoId, 
    className = "",
    protectionLevel = "ENTERPRISE",
    watermarkText = "TradeX Floor Academy",
    onViolationDetected 
}) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [playerData, setPlayerData] = useState(null);
    const [recordingBlocked, setRecordingBlocked] = useState(false);

    // Apply comprehensive media protection
    const { containerRef } = useMediaProtection({
        ...PROTECTION_LEVELS[protectionLevel],
        watermarkText,
        onViolationDetected: (violation) => {
            console.warn('VdoCipher Protection Violation:', violation);
            if (onViolationDetected) {
                onViolationDetected(violation);
            }
            
            // Block recording on serious violations
            if (violation.type === 'potential_recorder_detected' || violation.violationCount > 2) {
                setRecordingBlocked(true);
                setTimeout(() => setRecordingBlocked(false), 8000); // Show for 8 seconds
            }
        }
    });

    useEffect(() => {
        if (!videoId) return;

        const fetchDRM = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch OTP and Playback Info from our secure backend
                const res = await fetch('/api/vdocipher/otp', {
                    method: 'POST',
                    body: JSON.stringify({ videoId }),
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = await res.json();

                if (!res.ok) throw new Error(data.error || 'DRM Authorization Failed');

                setPlayerData(data);
            } catch (err) {
                console.error("Player Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDRM();
    }, [videoId]);

    if (error) {
        return (
            <div className={`aspect-video bg-black rounded-xl flex flex-col items-center justify-center text-red-500 p-6 text-center border border-red-900/50 ${className}`}>
                <AlertTriangle size={48} className="mb-4" />
                <h3 className="text-xl font-bold mb-2">Security Check Failed</h3>
                <p className="text-sm opacity-80">{error}</p>
                <p className="text-xs mt-4 text-white/30">Error Code: DRM_401_UNAUTHORIZED</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={`aspect-video bg-black rounded-xl flex flex-col items-center justify-center text-white p-6 ${className}`}>
                <Loader2 size={48} className="mb-4 animate-spin text-purple-500" />
                <div className="flex items-center gap-2 text-sm font-medium opacity-80">
                    <Lock size={16} className="text-green-400" />
                    <span>Authenticating Secure Stream...</span>
                </div>
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
                className={`media-protection-container relative overflow-hidden rounded-xl bg-black shadow-2xl ${className}`}
            >
                {/* Enhanced Security Badge */}
                <div className="absolute top-0 right-0 z-20 bg-black/60 backdrop-blur-md px-3 py-1 m-2 rounded-full flex items-center gap-1.5 border border-white/10">
                    <Shield size={12} className="text-green-500" />
                    <span className="text-[10px] font-bold tracking-wider text-white/80 uppercase">DRM Protected</span>
                </div>

                {/* Enhanced Watermark Overlay */}
                <EnhancedWatermark 
                    text={watermarkText} 
                    density="high" 
                    animation={true} 
                />

                {/* VdoCipher Iframe with Enhanced Security */}
                <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                    <iframe
                        src={`https://player.vdocipher.com/v2/?otp=${playerData.otp}&playbackInfo=${playerData.playbackInfo}`}
                        style={{
                            border: 0,
                            width: '100%',
                            height: '100%',
                            position: 'absolute',
                            top: 0,
                            left: 0
                        }}
                        allow="encrypted-media; autoplay; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                        // Additional security attributes
                        sandbox="allow-scripts allow-same-origin allow-forms"
                    />
                </div>
            </div>
        </>
    );
}