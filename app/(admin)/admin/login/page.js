'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, KeyRound, ArrowRight, Loader2, Shield, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
    const router = useRouter();
    const [step, setStep] = useState('email'); // 'email' or 'otp'
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showOtp, setShowOtp] = useState(false);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: email.trim().toLowerCase(),
                    action: 'send-otp'
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to send authentication code');
            }

            // Move to OTP step
            setStep('otp');
            setError('');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: email.trim().toLowerCase(),
                    otp: otp.replace(/\s/g, ''),
                    action: 'verify-otp'
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Invalid authentication code');
            }

            // Store session token
            document.cookie = `admin-session=${data.token}; path=/; max-age=1800; SameSite=Lax`;
            
            // Redirect to admin dashboard
            router.push('/admin/dashboard');
            router.refresh();

        } catch (err) {
            setError(err.message);
            setOtp(''); // Clear invalid OTP
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_70%)]" />
                <div 
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `linear-gradient(rgba(99,102,241,0.2) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(99,102,241,0.2) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Glass card container */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000" />
                    
                    <div className="relative bg-gray-900/90 backdrop-blur-xl p-8 rounded-2xl border border-gray-800 shadow-2xl">
                        
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-500/10 rounded-2xl mb-4 border border-indigo-500/20">
                                <Shield className="w-8 h-8 text-indigo-400" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">Admin Access</h1>
                            <p className="text-gray-400 text-sm">Secure authentication required</p>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"
                            >
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                {error}
                            </motion.div>
                        )}

                        {/* Email Step */}
                        {step === 'email' ? (
                            <form onSubmit={handleSendOTP} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Administrator Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="admin@tradexfloor.com"
                                            className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <motion.button
                                    type="submit"
                                    disabled={loading || !email}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            Sending Code...
                                        </>
                                    ) : (
                                        <>
                                            Send Authentication Code
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </motion.button>
                            </form>
                        ) : (
                            /* OTP Step */
                            <form onSubmit={handleVerifyOTP} className="space-y-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-400">Code sent to:</span>
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setStep('email');
                                            setOtp('');
                                        }}
                                        className="text-sm text-indigo-400 hover:text-indigo-300"
                                    >
                                        Change Email
                                    </button>
                                </div>
                                
                                <div className="text-center mb-6">
                                    <p className="font-mono text-indigo-400">{email}</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Authentication Code</label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                        <input
                                            type={showOtp ? "text" : "password"}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="••••••"
                                            className="w-full pl-10 pr-12 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-center text-xl tracking-widest transition-all"
                                            maxLength={6}
                                            required
                                            disabled={loading}
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowOtp(!showOtp)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                        >
                                            {showOtp ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 text-center">Enter the 6-digit code sent to your email</p>
                                </div>

                                <motion.button
                                    type="submit"
                                    disabled={loading || otp.length !== 6}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            Authenticating...
                                        </>
                                    ) : (
                                        <>
                                            Authenticate & Access
                                            <Shield size={18} />
                                        </>
                                    )}
                                </motion.button>
                            </form>
                        )}

                        {/* Footer */}
                        <div className="mt-8 pt-6 border-t border-gray-800 text-center">
                            <p className="text-xs text-gray-500">
                                This is a secure administrative portal. Unauthorized access is prohibited.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}