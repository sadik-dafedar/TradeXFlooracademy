"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

export default function LinkedAccounts() {
    const [accounts, setAccounts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        fetchLinkedAccounts();
    }, []);

    const fetchLinkedAccounts = async () => {
        try {
            const res = await fetch("/api/user/linked-accounts");
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);
            setAccounts(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const isDark = true; // Enforcing dark mode to match dashboard


    // Safe date formatter to guard against invalid values
    const formatDate = (dateValue) => {
        if (!dateValue) return 'Recently';
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return 'Recently';
        return date.toLocaleDateString();
    };

    // Provider icons mapping
    const providerIcons = {
        google: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
        ),
        credentials: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
            </svg>
        )
    };

    if (loading) {
        return (
            <div className={`rounded-xl p-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                <div className="animate-pulse">
                    <div className={`h-4 rounded w-1/3 mb-3 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}></div>
                    <div className={`h-10 rounded mb-2 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}></div>
                    <div className={`h-10 rounded ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`rounded-xl p-4 border ${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
                <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                    Failed to load linked accounts: {error}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className={`rounded-xl p-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    Login Methods
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-pink-500/20 text-pink-400' : 'bg-pink-100 text-pink-600'}`}>
                    {accounts?.totalLinked || 0} connected
                </span>
            </div>

            <div className="space-y-2">
                {accounts?.linkedProviders?.map((provider, index) => (
                    <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-white'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                                {providerIcons[provider.provider] || (
                                    <span className={`w-5 h-5 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>?</span>
                                )}
                            </div>
                            <div>
                                <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {provider.label}
                                </p>
                                <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                                    Connected {formatDate(provider.linkedAt)}
                                </p>
                            </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
                            Active
                        </span>
                    </div>
                ))}

                {(!accounts?.linkedProviders || accounts.linkedProviders.length === 0) && (
                    <p className={`text-center text-sm py-4 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                        No accounts linked yet
                    </p>
                )}
            </div>

            {/* Quick status indicators */}
            <div className={`mt-3 pt-3 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${accounts?.hasGoogle ? 'bg-green-500' : (isDark ? 'bg-white/20' : 'bg-gray-300')}`}></span>
                        <span className={isDark ? 'text-white/60' : 'text-gray-600'}>Google</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${accounts?.hasCredentials ? 'bg-green-500' : (isDark ? 'bg-white/20' : 'bg-gray-300')}`}></span>
                        <span className={isDark ? 'text-white/60' : 'text-gray-600'}>Email/OTP</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
