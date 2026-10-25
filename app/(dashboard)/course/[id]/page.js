'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import SecureVideoPlayer from '@/components/SecureVideoPlayer';
import EnhancedVdoCipherPlayer from '@/components/EnhancedVdoCipherPlayer';
import SecurePdfViewer from '@/components/SecurePdfViewer';


export default function CoursePlayerPage() {
    const params = useParams();
    const router = useRouter();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await fetch(`/api/course/${params.id}`);
                const json = await res.json();

                if (!res.ok) {
                    throw new Error(json.error || 'Failed to load course');
                }
                setData(json);
            } catch (err) {
                setError(err.message);
                // Optional: Redirect back after delay
                // setTimeout(() => router.push('/dashboard'), 3000);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) fetchCourse();
    }, [params.id, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <Loader2 className="animate-spin text-pink-500" size={40} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
                <div className="text-red-400 text-xl font-bold mb-2">Access Denied</div>
                <p className="text-white/50 mb-6">{error}</p>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    const { product, userEmail } = data;
    // VdoCipher IDs are usually 32 chars alphanumeric, URLs start with http
    const isVdoCipher = product.contentUrl && !product.contentUrl.startsWith('http');

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            {/* Header / Nav */}
            <div className="h-16 border-b border-white/10 flex items-center px-6 bg-black/50 backdrop-blur-md sticky top-0 z-50">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mr-4"
                >
                    <ArrowLeft size={20} />
                    <span className="hidden sm:inline">Dashboard</span>
                </button>
                <a
                    href="/"
                    className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mr-6 text-sm"
                >
                    Home
                </a>
                <div className="flex-1 truncate">
                    <h1 className="text-lg font-bold">{product.title}</h1>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col relative">
                {product.type === 'VIDEO_COURSE' ? (
                    <div className="flex-1 bg-black relative">
                        {/* Centered Video Player */}
                        <div className="absolute inset-0 flex items-center justify-center p-4 md:p-10">
                            <div className="w-full max-w-5xl aspect-video rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                                {isVdoCipher ? (
                                    <EnhancedVdoCipherPlayer
                                        videoId={product.contentUrl}
                                        watermarkText={userEmail}
                                        protectionLevel="ENTERPRISE"
                                    />
                                ) : (
                                    <SecureVideoPlayer
                                        url={product.contentUrl}
                                        watermarkText={userEmail}
                                        protectionLevel="ENTERPRISE"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 bg-neutral-900">
                        <SecurePdfViewer
                            url={product.contentUrl}
                            title={product.title}
                            watermarkText={userEmail}
                            protectionLevel="ENTERPRISE"
                        />
                    </div>
                )}
            </div>

            {/* Info Footer */}
            <div className="p-6 border-t border-white/10 bg-black/50">
                <h2 className="font-semibold text-lg mb-2">About this content</h2>
                <p className="text-white/50 text-sm max-w-3xl">
                    {product.description || 'No description available for this course.'}
                </p>
            </div>
        </div>
    );
}
