'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Loader2, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
            <h1 className="text-2xl font-bold mb-2">Password Reset Successfully!</h1>
            <p className="text-white/50 mb-6">Redirecting to login page...</p>
            <Link href="/login" className="text-pink-400 hover:text-pink-300 font-medium">
              Click here if not redirected
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-4">
              <Image src="/logo.png" width={48} height={48} alt="Logo" className="w-12 h-12 rounded-xl mx-auto shadow-lg shadow-purple-500/20" />
            </Link>
            <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
            <p className="text-white/40 text-sm">Enter your new password</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-6 text-center flex items-center justify-center gap-2"
            >
              <XCircle size={16} />
              {error}
            </motion.div>
          )}

          {!token ? (
            <div className="text-center">
              <p className="text-white/50 mb-4">Invalid or missing reset link</p>
              <Link href="/forgot-password" className="text-pink-400 hover:text-pink-300 font-medium">
                Request new reset link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60 ml-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-white placeholder-white/20 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60 ml-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-white placeholder-white/20 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full gradient-btn py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Reset Password'}
                {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </button>

              <p className="text-center text-sm text-white/40 mt-4">
                Remember your password?{' '}
                <Link href="/login" className="text-pink-400 hover:text-pink-300 font-medium">
                  Login here
                </Link>
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden text-white">
      <div className="w-full max-w-md relative z-10">
        <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-purple-400 animate-spin" />
          <p className="text-white/50">Loading...</p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
