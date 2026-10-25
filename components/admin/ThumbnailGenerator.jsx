'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Upload, Image as ImageIcon, X, Loader2, CheckCircle, Video, FileText, Sparkles } from 'lucide-react';

export default function ThumbnailGenerator({
    contentType = 'video', // 'video' or 'pdf'
    contentUrl = '',
    onThumbnailSelect,
    currentThumbnail = null,
    className = ''
}) {
    const [thumbnailUrl, setThumbnailUrl] = useState(currentThumbnail);
    const [uploading, setUploading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [mode, setMode] = useState('upload'); // 'upload' or 'generate'

    const inputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setError('Only JPG, PNG, or WebP images allowed');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setError('Image too large. Max 2MB allowed.');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/admin/upload/thumbnail', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Upload failed');
            }

            const result = await res.json();
            setThumbnailUrl(result.url);
            onThumbnailSelect?.(result.url);

        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const generateFromVideo = async () => {
        if (!contentUrl || contentType !== 'video') return;

        setGenerating(true);
        setError(null);

        try {
            // For VdoCipher videos, we can't access frames directly
            // Instead, use their thumbnail API or a placeholder
            // This is a limitation - VdoCipher doesn't expose raw video for frame extraction

            // For regular video URLs:
            const video = videoRef.current || document.createElement('video');
            video.crossOrigin = 'anonymous';
            video.src = contentUrl;

            await new Promise((resolve, reject) => {
                video.onloadedmetadata = resolve;
                video.onerror = reject;
                setTimeout(reject, 10000); // 10s timeout
            });

            // Seek to 25% of video
            video.currentTime = video.duration * 0.25;

            await new Promise(resolve => {
                video.onseeked = resolve;
            });

            // Capture frame
            const canvas = canvasRef.current || document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);

            // Convert to blob and upload
            const blob = await new Promise(resolve =>
                canvas.toBlob(resolve, 'image/jpeg', 0.85)
            );

            const formData = new FormData();
            formData.append('file', blob, 'video-thumbnail.jpg');

            const res = await fetch('/api/admin/upload/thumbnail', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const result = await res.json();
                setThumbnailUrl(result.url);
                onThumbnailSelect?.(result.url);
            }

        } catch (err) {
            setError('Could not generate thumbnail. Try uploading manually.');
            console.error('Video thumbnail generation failed:', err);
        } finally {
            setGenerating(false);
        }
    };

    const clearThumbnail = () => {
        setThumbnailUrl(null);
        onThumbnailSelect?.(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Hidden elements */}
            <video ref={videoRef} className="hidden" />
            <canvas ref={canvasRef} className="hidden" />

            {/* Mode Tabs */}
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => setMode('upload')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${mode === 'upload'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                >
                    <Upload size={14} /> Upload
                </button>
                {contentType === 'video' && contentUrl && (
                    <button
                        type="button"
                        onClick={() => setMode('generate')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${mode === 'generate'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        <Sparkles size={14} /> Auto-Generate
                    </button>
                )}
            </div>

            {/* Current Thumbnail Preview */}
            {thumbnailUrl && (
                <div className="relative group">
                    <Image
                        src={thumbnailUrl}
                        alt="Thumbnail"
                        className="w-full h-32 object-cover rounded-lg border border-gray-700"
                        width={300}
                        height={128}
                    />
                    <button
                        type="button"
                        onClick={clearThumbnail}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X size={14} className="text-white" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white flex items-center gap-1">
                        <CheckCircle size={12} className="text-green-400" /> Thumbnail set
                    </div>
                </div>
            )}

            {/* Upload Mode */}
            {mode === 'upload' && !thumbnailUrl && (
                <div
                    onClick={() => inputRef.current?.click()}
                    className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-gray-600 hover:bg-gray-800/50 transition-all"
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    {uploading ? (
                        <Loader2 className="mx-auto animate-spin text-indigo-400" size={32} />
                    ) : (
                        <>
                            <ImageIcon className="mx-auto text-gray-500 mb-2" size={32} />
                            <p className="text-gray-400 text-sm">Click to upload thumbnail</p>
                            <p className="text-gray-500 text-xs mt-1">JPG, PNG, WebP (max 2MB)</p>
                        </>
                    )}
                </div>
            )}

            {/* Generate Mode */}
            {mode === 'generate' && !thumbnailUrl && (
                <div className="border border-gray-700 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <Video className="text-indigo-400" size={24} />
                        <span className="text-gray-300 text-sm">Extract frame from video</span>
                    </div>
                    <button
                        type="button"
                        onClick={generateFromVideo}
                        disabled={generating || !contentUrl}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="animate-spin" size={16} />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} />
                                Generate Thumbnail
                            </>
                        )}
                    </button>
                    {!contentUrl && (
                        <p className="text-gray-500 text-xs mt-2">Enter video URL first</p>
                    )}
                </div>
            )}

            {/* Error */}
            {error && (
                <p className="text-red-400 text-xs">{error}</p>
            )}
        </div>
    );
}
