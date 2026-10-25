'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, Lock, AlertTriangle } from 'lucide-react'

/**
 * DRM Protected Video Player Component
 * Features:
 * - Prevents screen recording detection
 * - Disables right-click context menu
 * - Watermarks with user info
 * - Custom controls for better UX
 */
export default function DRMVideoPlayer({ 
  videoUrl, 
  videoId,
  user,
  productTitle,
  onProgress,
  onComplete 
}) {
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isScreenRecording, setIsScreenRecording] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const controlsTimeoutRef = useRef(null)

  // Format time (seconds to MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Prevent right-click
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault()
      setShowWarning(true)
      setTimeout(() => setShowWarning(false), 3000)
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('contextmenu', handleContextMenu)
    }

    return () => {
      if (container) {
        container.removeEventListener('contextmenu', handleContextMenu)
      }
    }
  }, [])

  // Screen recording detection
  useEffect(() => {
    const detectScreenCapture = async () => {
      try {
        // Check for screen capture API
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          // Monitor visibility changes which might indicate recording
          const handleVisibilityChange = () => {
            if (document.hidden && isPlaying) {
              // Pause when tab is hidden (might be switching to recording app)
              videoRef.current?.pause()
              setIsPlaying(false)
            }
          }
          document.addEventListener('visibilitychange', handleVisibilityChange)
          return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
      } catch (error) {
        console.log('Screen capture detection not available')
      }
    }

    detectScreenCapture()

    // Detect screen recording via keyboard shortcuts (common ones)
    const handleKeyDown = (e) => {
      // Block common screen recording shortcuts
      if (
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) || // Mac screenshots
        (e.key === 'PrintScreen') || // Windows screenshot
        (e.ctrlKey && e.shiftKey && e.key === 'I') // Dev tools
      ) {
        e.preventDefault()
        setShowWarning(true)
        setTimeout(() => setShowWarning(false), 3000)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying])

  // Video event handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime
      const total = videoRef.current.duration
      setCurrentTime(current)
      setProgress((current / total) * 100)
      
      if (onProgress) {
        onProgress(current, total)
      }
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    if (onComplete) {
      onComplete()
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    if (videoRef.current) {
      videoRef.current.currentTime = pos * videoRef.current.duration
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Auto-hide controls
  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 3000)
  }

  // CSS to prevent screenshots
  const antiScreenshotStyles = `
    .drm-video-container {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
      -webkit-touch-callout: none;
    }
    
    .drm-video-container video {
      pointer-events: none;
    }
    
    /* Blur content when dev tools is detected */
    @media print {
      .drm-video-container {
        display: none !important;
      }
    }
  `

  return (
    <>
      <style>{antiScreenshotStyles}</style>
      
      <div 
        ref={containerRef}
        className="drm-video-container relative bg-black rounded-xl overflow-hidden group"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        {/* DRM Warning Overlay */}
        {showWarning && (
          <div className="absolute inset-0 z-50 bg-red-900/90 flex items-center justify-center backdrop-blur-sm">
            <div className="text-center p-8">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
              <h3 className="text-xl font-bold text-white mb-2">Screen Recording Detected!</h3>
              <p className="text-red-200">
                This content is DRM protected. Screen recording and screenshots are not allowed.
              </p>
            </div>
          </div>
        )}

        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full aspect-video"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          playsInline
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Watermark */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="text-white/10 text-2xl font-bold transform rotate-[-30deg] select-none">
            {user?.email || 'TRADEXFLOOR'}
          </div>
        </div>

        {/* Dynamic Watermark (moves around) */}
        <div 
          className="absolute pointer-events-none text-white/20 text-sm font-medium select-none"
          style={{
            top: `${20 + (Math.sin(currentTime * 0.5) * 30)}%`,
            left: `${10 + (Math.cos(currentTime * 0.3) * 20)}%`,
          }}
        >
          {user?.email} • {new Date().toLocaleDateString()}
        </div>

        {/* DRM Badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
          <Lock size={14} className="text-[#FF00CC]" />
          <span className="text-xs font-medium">DRM Protected</span>
        </div>

        {/* Custom Controls */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Progress Bar */}
          <div 
            className="w-full h-1 bg-white/20 rounded-full mb-4 cursor-pointer group/progress"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-gradient-to-r from-[#FF00CC] to-[#00CCFF] rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Play/Pause */}
              <button 
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
              </button>

              {/* Volume */}
              <button 
                onClick={toggleMute}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>

              {/* Time */}
              <span className="text-sm text-white/80">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Title */}
              <span className="text-sm text-white/60 mr-4">{productTitle}</span>

              {/* Fullscreen */}
              <button 
                onClick={toggleFullscreen}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <Maximize size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Play Button Overlay (when paused) */}
        {!isPlaying && !showWarning && (
          <div 
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={togglePlay}
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#FF00CC] to-[#00CCFF] flex items-center justify-center hover:scale-110 transition-transform">
              <Play size={36} className="ml-1" />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
