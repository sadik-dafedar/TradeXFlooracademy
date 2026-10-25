'use client';

import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
            <h1 className="text-6xl font-bold mb-4">404</h1>
            <h2 className="text-2xl mb-8">Page Not Found</h2>
            <p className="text-gray-400 mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
            <Link
                href="/"
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg hover:opacity-90 transition-opacity"
            >
                Go Home
            </Link>
        </div>
    );
}
