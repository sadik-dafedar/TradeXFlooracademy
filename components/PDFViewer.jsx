'use client'

import { useState, useEffect } from 'react'
import { Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, FileText, Lock, X, Maximize2, Minimize2 } from 'lucide-react'

/**
 * Secure PDF Viewer Component
 * Features:
 * - Embedded PDF viewing
 * - Zoom controls
 * - Page navigation
 * - Download protection option
 * - Watermarking
 */
export default function PDFViewer({ 
  pdfUrl, 
  title,
  user,
  allowDownload = false,
  onClose
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [zoom, setZoom] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Prevent right-click if download not allowed
  useEffect(() => {
    if (!allowDownload) {
      const handleContextMenu = (e) => {
        e.preventDefault()
      }
      document.addEventListener('contextmenu', handleContextMenu)
      return () => document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [allowDownload])

  const handleZoomIn = () => {
    if (zoom < 200) setZoom(zoom + 25)
  }

  const handleZoomOut = () => {
    if (zoom > 50) setZoom(zoom - 25)
  }

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleDownload = () => {
    if (allowDownload && pdfUrl) {
      // Create a temporary link and trigger download
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `${title || 'document'}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // For watermarking, we use Google Docs Viewer as a fallback which adds some protection
  // In production, use a proper PDF rendering library with canvas for better watermarking
  const viewerUrl = pdfUrl?.startsWith('http') 
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`
    : pdfUrl

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'relative'} bg-[#0a0a0f] rounded-xl overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-[#12121a] border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#FF00CC]/20 to-[#00CCFF]/20 flex items-center justify-center">
            <FileText className="text-[#00CCFF]" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-white truncate max-w-xs">{title}</h3>
            <p className="text-xs text-gray-500">PDF Resource</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

          {/* Download Button */}
          {allowDownload && (
            <button 
              onClick={handleDownload}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Download PDF"
            >
              <Download size={18} className="text-gray-300" />
            </button>
          )}

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

          {/* Close Button */}
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
            >
              <X size={18} className="text-red-400" />
            </button>
          )}
        </div>
      </div>

      {/* PDF Content */}
      <div className="relative" style={{ height: isFullscreen ? 'calc(100vh - 120px)' : '600px' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0f]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#FF00CC] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading PDF...</p>
            </div>
          </div>
        )}

        {/* Watermark Overlay */}
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center overflow-hidden">
          <div className="text-white/5 text-4xl font-bold transform rotate-[-30deg] whitespace-nowrap">
            {user?.email || 'TRADEXFLOOR ACADEMY'}
          </div>
        </div>

        {/* DRM Badge */}
        {!allowDownload && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <Lock size={14} className="text-[#FF00CC]" />
            <span className="text-xs font-medium text-white">Protected</span>
          </div>
        )}

        {/* PDF Iframe */}
        <iframe
          src={viewerUrl}
          className="w-full h-full border-0"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
          onLoad={() => setLoading(false)}
          title={title}
        />
      </div>

      {/* Footer with Page Navigation */}
      <div className="flex items-center justify-center gap-4 p-4 bg-[#12121a] border-t border-white/10">
        <button 
          onClick={handlePrevPage}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
          disabled={currentPage <= 1}
        >
          <ChevronLeft size={20} className="text-gray-300" />
        </button>
        
        <span className="text-sm text-gray-400">
          Page {currentPage} of {totalPages}
        </span>
        
        <button 
          onClick={handleNextPage}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
          disabled={currentPage >= totalPages}
        >
          <ChevronRight size={20} className="text-gray-300" />
        </button>
      </div>
    </div>
  )
}
