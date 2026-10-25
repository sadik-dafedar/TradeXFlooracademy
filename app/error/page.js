'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

// Error messages for different OAuth/Auth errors
const errorMessages = {
    'Configuration': 'Server configuration error. Please contact support.',
    'AccessDenied': 'Access was denied. You may not have permission to sign in.',
    'Verification': 'The verification link has expired or has already been used.',
    'OAuthSignin': 'Error starting the OAuth sign-in process. Please try again.',
    'OAuthCallback': 'Error during OAuth callback. Please check if your account is properly configured.',
    'OAuthCreateAccount': 'Could not create OAuth account. The email might already be registered.',
    'EmailCreateAccount': 'Could not create email account.',
    'Callback': 'Error in authentication callback.',
    'OAuthAccountNotLinked': 'This email is already registered with a different sign-in method. Please use your original sign-in method.',
    'EmailSignin': 'The email could not be sent.',
    'CredentialsSignin': 'Invalid credentials. Please check your email and OTP.',
    'SessionRequired': 'Please sign in to access this page.',
    'Default': 'An authentication error occurred. Please try again.',
};

function ErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');
    
    const errorMessage = errorMessages[error] || errorMessages['Default'];
    const errorCode = error || 'Unknown';

    return (
        <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl text-center max-w-md w-full bg-black/50">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold mb-2">Authentication Error</h1>
            
            <div className="mb-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                <p className="text-xs text-red-400 font-mono mb-1">Error Code: {errorCode}</p>
                <p className="text-white/70 text-sm">{errorMessage}</p>
            </div>
            
            <p className="text-white/40 text-xs mb-6">
                If this problem persists, please try clearing your browser cookies or contact support.
            </p>
            
            <div className="flex gap-3 justify-center">
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-pink-400 hover:text-pink-300 hover:bg-white/10 transition-all"
                >
                    <ArrowLeft size={16} />
                    Back to Login
                </Link>
                <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-cyan-500/30 transition-all"
                >
                    <RefreshCw size={16} />
                    Retry
                </button>
            </div>
        </div>
    );
}

export default function ErrorPage() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden text-white">
            <Suspense fallback={<div className="text-white">Loading...</div>}>
                <ErrorContent />
            </Suspense>
        </div>
    );
}
