'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, FileText } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen text-white pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft size={18} /> Back to Home
          </Link>
          
          <div className="flex items-center gap-4 mb-6">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(168, 85, 247, 0.2))',
                border: '1px solid rgba(236, 72, 153, 0.3)',
              }}
            >
              <Shield className="w-7 h-7 text-pink-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
              <p className="text-white/50">Last updated: January 2026</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-8"
        >
          <section 
            className="rounded-2xl p-8"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
              <Eye className="text-cyan-400" size={22} />
              Information We Collect
            </h2>
            <p className="text-white/70 leading-relaxed mb-4">
              At TradeXFloor Academy, we collect information to provide better services to our users:
            </p>
            <ul className="space-y-2 text-white/60">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                Personal information (name, email, phone number) when you register
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                Payment information for course purchases
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                Course progress and learning data
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                Device and browser information for security purposes
              </li>
            </ul>
          </section>

          <section 
            className="rounded-2xl p-8"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
              <Lock className="text-pink-400" size={22} />
              How We Use Your Information
            </h2>
            <p className="text-white/70 leading-relaxed mb-4">
              We use the collected information for the following purposes:
            </p>
            <ul className="space-y-2 text-white/60">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                To provide and maintain our educational services
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                To process payments and deliver course content
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                To send important updates about your courses
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                To improve our platform and user experience
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                To protect against fraud and unauthorized access
              </li>
            </ul>
          </section>

          <section 
            className="rounded-2xl p-8"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
              <Shield className="text-purple-400" size={22} />
              Data Security
            </h2>
            <p className="text-white/70 leading-relaxed">
              We implement industry-standard security measures to protect your personal information. 
              Our platform uses DRM protection for video content to prevent unauthorized recording or 
              screenshots. All payment transactions are processed through secure, encrypted channels.
            </p>
          </section>

          <section 
            className="rounded-2xl p-8"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
              <FileText className="text-green-400" size={22} />
              Your Rights
            </h2>
            <p className="text-white/70 leading-relaxed mb-4">
              You have the following rights regarding your personal data:
            </p>
            <ul className="space-y-2 text-white/60">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                Right to access your personal information
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                Right to correct inaccurate data
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                Right to delete your account and data
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                Right to withdraw consent at any time
              </li>
            </ul>
          </section>

          <section 
            className="rounded-2xl p-8"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <h2 className="text-xl font-bold mb-4">Contact Us</h2>
            <p className="text-white/70 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-pink-400 font-semibold mt-2">tradexflooracademy@gmail.com</p>
          </section>
        </motion.div>
      </div>
    </main>
  );
}
