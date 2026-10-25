'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Loader2, CheckCircle, ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl text-center relative">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              title="Close"
            >
              <X size={20} className="text-white/60" />
            </button>

            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
            <h1 className="text-2xl font-bold mb-2">Check Your Email</h1>
            <p className="text-white/50 mb-6">
              If an account exists with <span className="text-pink-400">{email}</span>, you will receive a password reset link.
            </p>
            <p className="text-white/40 text-sm mb-6">
              The link will expire in <span className="text-pink-400 font-semibold">5 minutes</span>
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 font-medium"
            >
              <ArrowLeft size={16} />
              Back to Login
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
        <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl relative">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X size={20} className="text-white/60" />
          </button>

          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-4">
              <Image src="/logo.png" alt="Logo" width={48} height={48} className="rounded-xl mx-auto shadow-lg shadow-purple-500/20" />
            </Link>
            <h1 className="text-2xl font-bold mb-2">Forgot Password?</h1>
            <p className="text-white/40 text-sm">No worries, we&apos;ll send you reset instructions</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-6 text-center"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #06b6d4, #8B5CF6)',
                boxShadow: '0 4px 20px rgba(6, 182, 212, 0.3)',
              }}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send Reset Link'}
              {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>

            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
              Back to Login
            </Link>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
