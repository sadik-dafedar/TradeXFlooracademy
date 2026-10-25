'use client';

import React from 'react';
import SecureVideoPlayer from '@/components/SecureVideoPlayer';
import SecurePdfViewer from '@/components/SecurePdfViewer';
import { Shield, Lock } from 'lucide-react';
import MainLayout from '@/components/MainLayout';

export default function TestDRMPage() {
    return (
        <MainLayout>
            <div className="min-h-screen pt-24 px-4 pb-20 overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-12">

                    {/* Header */}
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400">
                            <Shield size={16} />
                            <span className="text-sm font-semibold">Content Protection Demo</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-white/80 to-white/40 bg-clip-text text-transparent">
                            Secure Content Delivery
                        </h1>
                        <p className="text-white/50 max-w-2xl mx-auto">
                            Demonstrating HLS video streaming and Canvas-based PDF rendering with anti-recording overlays, watermarking, and focusing protection.
                        </p>
                    </div>

                    {/* Video Section */}
                    <section className="glass-card p-6 md:p-8 rounded-3xl space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
                                <Lock size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Secure Video Player</h2>
                                <p className="text-white/40 text-sm">HLS Stream with dynamic watermark & focus protection</p>
                            </div>
                        </div>

                        <div className="rounded-xl overflow-hidden border border-white/10">
                            <SecureVideoPlayer
                                url="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
                                watermarkText="demo@tradexfloor.com"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <FeatureCard label="HLS Streaming" desc="Chunks video to prevent single-file download" />
                            <FeatureCard label="Dynamic Watermark" desc="Floating user ID prevents screen recording" />
                            <FeatureCard label="Focus Protection" desc="Blurs content when window loses focus" />
                        </div>
                    </section>

                    {/* PDF Section */}
                    <section className="glass-card p-6 md:p-8 rounded-3xl space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400">
                                <Lock size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Secure PDF Viewer</h2>
                                <p className="text-white/40 text-sm">Canvas rendering with text-selection disabled</p>
                            </div>
                        </div>

                        <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40">
                            {/* Using a sample PDF that allows CORS */}
                            <SecurePdfViewer
                                url="https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf"
                                watermarkText="demo@tradexfloor.com"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <FeatureCard label="Canvas Rendering" desc="Renders as image, text cannot be selected" />
                            <FeatureCard label="Context Menu Block" desc="Right-click 'Save As' is disabled" />
                            <FeatureCard label="Watermark Overlay" desc="Persistent attribution overlay" />
                        </div>
                    </section>

                </div>
            </div>
        </MainLayout>
    );
}

const FeatureCard = ({ label, desc }) => (
    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
        <h4 className="font-semibold text-white mb-1">{label}</h4>
        <p className="text-xs text-white/40">{desc}</p>
    </div>
);
