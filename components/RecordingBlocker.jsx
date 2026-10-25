'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, EyeOff, Shield } from 'lucide-react';

/**
 * Recording Blocker Component
 * Displays visual deterrent when recording attempts are detected
 */
export default function RecordingBlocker({ 
  isActive, 
  message = "Unauthorized Recording Detected",
  duration = 5000,
  onDismiss 
}) {
  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.8, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 20 }}
          className="bg-gradient-to-br from-red-900/90 to-black/90 border border-red-500/50 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
        >
          {/* Warning Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center"
              >
                <AlertTriangle size={32} className="text-red-400" />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute inset-0 rounded-full border-4 border-red-400/30"
              />
            </div>
          </div>

          {/* Message Content */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-3">
              {message}
            </h2>
            <p className="text-red-200/80 text-sm leading-relaxed">
              This content is protected. Recording attempts have been detected 
              and logged. Please respect intellectual property rights.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onDismiss}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <EyeOff size={18} />
              Acknowledge & Continue
            </motion.button>
            
            <div className="text-center">
              <p className="text-xs text-red-300/60">
                Protection automatically resumes in {Math.ceil(duration/1000)} seconds
              </p>
            </div>
          </div>

          {/* Security Badge */}
          <div className="mt-6 pt-4 border-t border-red-500/20 flex items-center justify-center gap-2">
            <Shield size={16} className="text-red-400" />
            <span className="text-xs text-red-300/70 font-medium">
              TRADEX FLOOR ACADEMY SECURITY
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Predefined blocker variants
RecordingBlocker.Variants = {
  STANDARD: {
    message: "Recording Attempt Blocked",
    duration: 5000
  },
  
  STRICT: {
    message: "Unauthorized Access Detected",
    duration: 10000
  },
  
  WARNING: {
    message: "Security Violation Recorded",
    duration: 3000
  }
};