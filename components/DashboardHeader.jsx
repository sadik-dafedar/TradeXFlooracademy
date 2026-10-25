'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Home, LogOut, Settings, User } from 'lucide-react';

export default function DashboardHeader({ showAdminLink = false }) {
    const { data: session } = useSession();

    const handleLogout = () => {
        // Trigger logout sync for multi-tab
        if (typeof window !== 'undefined') {
            localStorage.setItem('logout', Date.now().toString());
        }
        signOut({ callbackUrl: '/' });
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                {/* Logo / Brand */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20 group-hover:scale-105 transition-transform">
                        <span className="text-white font-bold text-lg">T</span>
                    </div>
                    <span className="text-white font-bold text-lg">TradeXFloor Academy</span>
                </Link>

                {/* Right Side Actions */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white transition-colors text-sm"
                    >
                        <Home size={18} />
                        <span className="hidden sm:inline">Home</span>
                    </Link>

                    {showAdminLink && session?.user?.role === 'ADMIN' && (
                        <Link
                            href="/admin/dashboard"
                            className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white transition-colors text-sm"
                        >
                            <Settings size={18} />
                            <span className="hidden sm:inline">Admin</span>
                        </Link>
                    )}

                    {session?.user && (
                        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                                <span className="text-white text-sm font-semibold">
                                    {session.user.name?.[0] || session.user.email?.[0] || 'U'}
                                </span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
                            >
                                <LogOut size={18} />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
