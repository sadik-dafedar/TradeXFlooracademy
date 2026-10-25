'use client';

import { motion } from 'framer-motion';
import { Settings, Tool, Wrench, AlertTriangle } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px]" />
      
      {/* Animated Glows */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-yellow-500/10 rounded-full blur-[100px] animate-pulse" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-lg w-full bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-3xl shadow-2xl"
      >
        <div className="flex justify-center mb-6 relative">
          <div className="relative">
            <Settings className="w-20 h-20 text-white/20 animate-spin-slow" />
            <Wrench className="w-10 h-10 text-yellow-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Under Maintenance
        </h1>
        
        <div className="h-1 w-20 bg-yellow-500 mx-auto mb-6 rounded-full" />

        <p className="text-lg text-white/60 mb-8 leading-relaxed">
          We are upgrading our systems to provide you with a better trading experience. 
          Please check back shortly.
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-500 text-sm font-medium">
          <AlertTriangle size={16} />
          <span>Expected Up-time: 1 Hour</span>
        </div>
      </motion.div>

      <div className="absolute bottom-8 text-white/20 text-sm">
        TradeX Floor Academy • System Upgrade
      </div>
    </div>
  );
}
