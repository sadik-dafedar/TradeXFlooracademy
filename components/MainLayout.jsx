'use client';

import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Scene3D from './Scene3D';
import AuthContext from './AuthContext';
import WhatsAppWidget from './WhatsAppWidget';
import { usePathname } from 'next/navigation';

export default function MainLayout({ children }) {
    const pathname = usePathname();

    // openAuthModal now redirects to /login page instead of opening modal
    const openAuthModal = (mode = 'login') => {
        window.location.href = mode === 'signup' ? '/login?tab=signup' : '/login';
    };

    const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/signup') || pathname?.startsWith('/forgot-password') || pathname?.startsWith('/reset-password');
    const isDashboardPage = pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin') || pathname?.startsWith('/course');

    return (
        <div className="relative min-h-screen">
            <Scene3D />

            <AuthContext.Provider value={{ openAuthModal }}>
                {!isAuthPage && !isDashboardPage && (
                    <Navbar onOpenAuth={openAuthModal} />
                )}

                <main className="relative z-10">
                    {children}
                </main>

                {!isAuthPage && (
                    <WhatsAppWidget />
                )}
            </AuthContext.Provider>
        </div>
    );
}
