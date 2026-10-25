'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { detectScreenCapture, detectRecordingSoftware } from './screen-detector';
import { logViolation } from './violation-logger';

// Protection levels configuration
export const PROTECTION_LEVELS = {
  BASIC: {
    detectDevTools: true,
    detectScreenshotKeys: true,
    detectWindowBlur: true,
    watermarkDensity: 'low',
    violationThreshold: 5
  },
  STANDARD: {
    detectDevTools: true,
    detectScreenshotKeys: true,
    detectWindowBlur: true,
    detectScreenCapture: true,
    detectRecordingSoftware: true,
    watermarkDensity: 'medium',
    violationThreshold: 3
  },
  ENTERPRISE: {
    detectDevTools: true,
    detectScreenshotKeys: true,
    detectWindowBlur: true,
    detectScreenCapture: true,
    detectRecordingSoftware: true,
    detectMouseAnomalies: true,
    detectCanvasFingerprinting: true,
    watermarkDensity: 'high',
    violationThreshold: 2,
    autoBlockDuration: 10000
  }
};

// Violation types for logging
const VIOLATION_TYPES = {
  DEVTOOLS_OPENED: 'devtools_opened',
  SCREENSHOT_ATTEMPT: 'screenshot_attempt',
  WINDOW_BLURRED: 'window_blurred',
  RECORDING_DETECTED: 'recording_detected',
  SCREEN_CAPTURE_DETECTED: 'screen_capture_detected',
  MOUSE_ANOMALY: 'mouse_anomaly',
  CONTEXT_MENU: 'context_menu'
};

/**
 * Custom hook for comprehensive media protection
 * @param {Object} options - Protection configuration
 * @returns {Object} Protection utilities and refs
 */
export function useMediaProtection({
  protectionLevel = 'STANDARD',
  watermarkText = '',
  onViolationDetected = null,
  autoBlockViolations = true
}) {
  const [violations, setViolations] = useState([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const containerRef = useRef(null);
  const violationTimerRef = useRef(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const lastMouseTimeRef = useRef(Date.now());

  const config = PROTECTION_LEVELS[protectionLevel] || PROTECTION_LEVELS.STANDARD;

  // Add violation to tracking system
  const addViolation = useCallback((type, details = {}) => {
    const violation = {
      type,
      timestamp: Date.now(),
      details,
      violationCount: violationCount + 1
    };

    setViolations(prev => [...prev, violation]);
    setViolationCount(prev => prev + 1);

    // Log to backend
    logViolation(type, details);

    // Notify callback
    if (onViolationDetected) {
      onViolationDetected(violation);
    }

    // Auto-block if threshold exceeded
    if (autoBlockViolations && violationCount + 1 >= config.violationThreshold) {
      setIsBlocked(true);
      if (config.autoBlockDuration) {
        if (violationTimerRef.current) clearTimeout(violationTimerRef.current);
        violationTimerRef.current = setTimeout(() => {
          setIsBlocked(false);
          violationTimerRef.current = null;
        }, config.autoBlockDuration);
      }
    }

    return violation;
  }, [violationCount, config, onViolationDetected, autoBlockViolations]);

  // Detect Developer Tools
  useEffect(() => {
    if (!config.detectDevTools) return;

    let devtools = false;
    const detector = setInterval(() => {
      if (window.outerHeight - window.innerHeight > 200 ||
        window.outerWidth - window.innerWidth > 200) {
        if (!devtools) {
          devtools = true;
          addViolation(VIOLATION_TYPES.DEVTOOLS_OPENED, {
            windowHeight: window.outerHeight,
            innerHeight: window.innerHeight
          });
        }
      } else {
        devtools = false;
      }
    }, 1000);

    return () => clearInterval(detector);
  }, [config.detectDevTools, addViolation]);

  // Detect screenshot key combinations
  useEffect(() => {
    if (!config.detectScreenshotKeys) return;

    const handleKeyDown = (e) => {
      // Print Screen key
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        addViolation(VIOLATION_TYPES.SCREENSHOT_ATTEMPT, {
          key: 'PrintScreen',
          ctrlKey: e.ctrlKey,
          altKey: e.altKey
        });
        return false;
      }

      // Ctrl+Shift+P (Chrome DevTools screenshot)
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        addViolation(VIOLATION_TYPES.SCREENSHOT_ATTEMPT, {
          key: 'Ctrl+Shift+P'
        });
        return false;
      }

      // Ctrl+S (Save)
      if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [config.detectScreenshotKeys, addViolation]);

  // Detect window blur/focus
  useEffect(() => {
    if (!config.detectWindowBlur) return;

    const handleBlur = () => {
      // Only count as violation if user has been active recently
      if (Date.now() - lastMouseTimeRef.current < 30000) {
        addViolation(VIOLATION_TYPES.WINDOW_BLURRED, {
          inactiveTime: Date.now() - lastMouseTimeRef.current
        });

        // Hide media content when window loses focus
        if (containerRef.current) {
          containerRef.current.classList.add('media-hidden');
        }
      }
    };

    const handleFocus = () => {
      // Restore media content when window regains focus
      if (containerRef.current) {
        containerRef.current.classList.remove('media-hidden');
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [config.detectWindowBlur, addViolation]);

  // Detect screen capture attempts
  useEffect(() => {
    if (!config.detectScreenCapture) return;

    const interval = setInterval(async () => {
      try {
        const captureDetected = await detectScreenCapture();
        if (captureDetected) {
          addViolation(VIOLATION_TYPES.SCREEN_CAPTURE_DETECTED, {
            method: captureDetected.method
          });

          // Apply visual deterrent
          if (containerRef.current) {
            containerRef.current.classList.add('media-obscured');
            setTimeout(() => {
              if (containerRef.current) {
                containerRef.current.classList.remove('media-obscured');
              }
            }, 3000);
          }
        }
      } catch (error) {
        console.warn('Screen capture detection failed:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [config.detectScreenCapture, addViolation]);

  // Detect recording software
  useEffect(() => {
    if (!config.detectRecordingSoftware) return;

    const interval = setInterval(async () => {
      try {
        const recordingDetected = await detectRecordingSoftware();
        if (recordingDetected) {
          addViolation(VIOLATION_TYPES.RECORDING_DETECTED, {
            software: recordingDetected.name,
            process: recordingDetected.process
          });
        }
      } catch (error) {
        console.warn('Recording software detection failed:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [config.detectRecordingSoftware, addViolation]);

  // Mouse movement anomaly detection
  useEffect(() => {
    if (!config.detectMouseAnomalies) return;

    const handleMouseMove = (e) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastMouseTimeRef.current;
      const distance = Math.sqrt(
        Math.pow(e.clientX - mousePositionRef.current.x, 2) +
        Math.pow(e.clientY - mousePositionRef.current.y, 2)
      );

      // Detect suspicious rapid movements
      if (timeDiff > 0 && distance / timeDiff > 2) {
        addViolation(VIOLATION_TYPES.MOUSE_ANOMALY, {
          speed: distance / timeDiff,
          position: { x: e.clientX, y: e.clientY }
        });
      }

      mousePositionRef.current = { x: e.clientX, y: e.clientY };
      lastMouseTimeRef.current = currentTime;
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [config.detectMouseAnomalies, addViolation]);

  // Canvas fingerprinting detection
  useEffect(() => {
    if (!config.detectCanvasFingerprinting) return;

    const detectCanvasChanges = () => {
      const canvases = document.querySelectorAll('canvas');
      canvases.forEach(canvas => {
        try {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Store original state
            const originalState = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Check periodically for unauthorized modifications
            setTimeout(() => {
              try {
                const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
                // Compare states (simplified comparison)
                if (JSON.stringify(originalState) !== JSON.stringify(currentState)) {
                  addViolation(VIOLATION_TYPES.CANVAS_FINGERPRINTING, {
                    canvasId: canvas.id || 'anonymous'
                  });
                }
              } catch (e) {
                // Canvas might be tainted, which is also suspicious
                addViolation(VIOLATION_TYPES.CANVAS_FINGERPRINTING, {
                  error: e.message,
                  canvasId: canvas.id || 'anonymous'
                });
              }
            }, 1000);
          }
        } catch (e) {
          console.warn('Canvas protection error:', e);
        }
      });
    };

    // Check for new canvases periodically
    const interval = setInterval(detectCanvasChanges, 3000);
    return () => clearInterval(interval);
  }, [config.detectCanvasFingerprinting, addViolation]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (violationTimerRef.current) {
        clearTimeout(violationTimerRef.current);
      }
    };
  }, []);

  return {
    containerRef,
    violations,
    violationCount,
    isBlocked,
    addViolation,
    VIOLATION_TYPES
  };
}

/**
 * Enhanced Watermark Component
 */
export function EnhancedWatermark({
  text,
  density = 'medium',
  animation = true,
  opacity = 0.1
}) {
  const watermarkRef = useRef(null);

  useEffect(() => {
    if (!animation || !watermarkRef.current) return;

    const animateWatermark = () => {
      if (watermarkRef.current) {
        const elements = watermarkRef.current.querySelectorAll('.watermark-item');
        elements.forEach((el, index) => {
          // Random position and timing
          const delay = (index * 0.5) + Math.random() * 2;
          el.style.animationDelay = `${delay}s`;
          el.style.left = `${Math.random() * 100}%`;
          el.style.top = `${Math.random() * 100}%`;
        });
      }
    };

    // Initial animation
    animateWatermark();

    // Periodic repositioning
    const interval = setInterval(animateWatermark, 10000);
    return () => clearInterval(interval);
  }, [animation]);

  // Generate watermark elements based on density
  const generateWatermarks = () => {
    const counts = { low: 5, medium: 15, high: 30 };
    const count = counts[density] || counts.medium;

    return Array.from({ length: count }, (_, i) => (
      <div
        key={i}
        className="watermark-item absolute text-white font-bold select-none pointer-events-none whitespace-nowrap"
        style={{
          fontSize: `${12 + Math.random() * 8}px`,
          opacity: opacity + (Math.random() * 0.05),
          transform: `rotate(${-15 + Math.random() * 30}deg)`,
          transition: 'all 2s ease-in-out'
        }}
      >
        {text}
      </div>
    ));
  };

  return (
    <div
      ref={watermarkRef}
      className="absolute inset-0 pointer-events-none z-20 overflow-hidden"
    >
      {generateWatermarks()}
    </div>
  );
}

/**
 * Recording Blocker Component
 */
export function RecordingBlocker({ isActive, message = "Recording Blocked" }) {
  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
      <div className="text-center p-8 rounded-xl bg-red-900/20 border border-red-500/30 max-w-md">
        <div className="text-red-400 text-6xl mb-4 animate-pulse">⚠️</div>
        <h2 className="text-2xl font-bold text-white mb-2">{message}</h2>
        <p className="text-red-300 mb-6">
          Unauthorized recording attempt detected. Content temporarily blocked.
        </p>
        <div className="flex justify-center space-x-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 bg-red-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}