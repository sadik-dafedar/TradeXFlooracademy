'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Image from 'next/image';

export default function PdfUploader({
    onUploadComplete,
    onThumbnailGenerated,
    maxSize = 50, // MB
    className = ''
}) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [uploadResult, setUploadResult] = useState(null);
    const [thumbnailUrl, setThumbnailUrl] = useState(null);
    const [generatingThumb, setGeneratingThumb] = useState(false);

    const inputRef = useRef(null);
    const canvasRef = useRef(null);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer?.files?.[0];
        if (droppedFile?.type === 'application/pdf') {
            setFile(droppedFile);
            setError(null);
        } else {
            setError('Only PDF files are allowed');
        }
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
    }, []);

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile?.type === 'application/pdf') {
            setFile(selectedFile);
            setError(null);
        } else if (selectedFile) {
            setError('Only PDF files are allowed');
        }
    };

    const generateThumbnail = async (pdfUrl) => {
        setGeneratingThumb(true);
        try {
            // Use pdf.js to render first page
            const pdfjsLib = await import('pdfjs-dist');
            pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

            const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
            const page = await pdf.getPage(1);

            const scale = 1.5;
            const viewport = page.getViewport({ scale });

            const canvas = canvasRef.current || document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
                canvasContext: context,
                viewport: viewport,
            }).promise;

            // Convert to blob
            const blob = await new Promise(resolve =>
                canvas.toBlob(resolve, 'image/jpeg', 0.8)
            );

            // Upload thumbnail
            const formData = new FormData();
            formData.append('file', blob, 'pdf-thumbnail.jpg');

            const res = await fetch('/api/admin/upload/thumbnail', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setThumbnailUrl(data.url);
                onThumbnailGenerated?.(data.url);
            }
        } catch (err) {
            console.error('Thumbnail generation failed:', err);
            // Non-fatal error, just log it
        } finally {
            setGeneratingThumb(false);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        // Validate size
        if (file.size > maxSize * 1024 * 1024) {
            setError(`File too large. Max ${maxSize}MB allowed.`);
            return;
        }

        setUploading(true);
        setProgress(10);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            setProgress(30);

            const res = await fetch('/api/admin/upload/pdf', {
                method: 'POST',
                body: formData,
            });

            setProgress(70);

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Upload failed');
            }

            const result = await res.json();
            setProgress(90);
            setUploadResult(result);

            // Generate thumbnail
            await generateThumbnail(result.url);

            setProgress(100);
            onUploadComplete?.(result.url, file.name);

        } catch (err) {
            setError(err.message);
            setUploadResult(null);
        } finally {
            setUploading(false);
        }
    };

    const resetUploader = () => {
        setFile(null);
        setUploadResult(null);
        setThumbnailUrl(null);
        setError(null);
        setProgress(0);
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Hidden canvas for PDF rendering */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Upload Zone */}
            {!uploadResult ? (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => inputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${file
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                        }`}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {file ? (
                        <div className="space-y-2">
                            <FileText className="mx-auto text-indigo-400" size={40} />
                            <p className="text-white font-medium">{file.name}</p>
                            <p className="text-gray-400 text-sm">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Upload className="mx-auto text-gray-500" size={40} />
                            <p className="text-gray-300">Drag & drop PDF here</p>
                            <p className="text-gray-500 text-sm">or click to browse</p>
                        </div>
                    )}
                </div>
            ) : (
                // Success State
                <div className="border border-green-500/30 bg-green-500/10 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        {thumbnailUrl ? (
                            <Image
                                src={thumbnailUrl}
                                alt="PDF Preview"
                                width={64}
                                height={80}
                                unoptimized
                                className="object-cover rounded border border-gray-700"
                            />
                        ) : generatingThumb ? (
                            <div className="w-16 h-20 bg-gray-800 rounded flex items-center justify-center">
                                <Loader2 className="animate-spin text-gray-400" size={20} />
                            </div>
                        ) : (
                            <div className="w-16 h-20 bg-gray-800 rounded flex items-center justify-center">
                                <FileText className="text-gray-400" size={24} />
                            </div>
                        )}
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="text-green-400" size={16} />
                                <span className="text-green-400 text-sm font-medium">Uploaded</span>
                            </div>
                            <p className="text-white text-sm truncate">{uploadResult.filename}</p>
                        </div>
                        <button
                            onClick={resetUploader}
                            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <X className="text-gray-400" size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* Progress Bar */}
            {uploading && (
                <div className="space-y-1">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-400 text-center">
                        {progress < 90 ? 'Uploading...' : 'Generating thumbnail...'}
                    </p>
                </div>
            )}

            {/* Upload Button */}
            {file && !uploadResult && (
                <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {uploading ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <Upload size={18} />
                            Upload PDF
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
