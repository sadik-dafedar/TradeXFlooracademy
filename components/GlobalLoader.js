'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function GlobalLoader() {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md">
            <div className="relative flex flex-col items-center">
                {/* Pulsing Glow behind Logo */}
                <motion.div
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="absolute inset-0 bg-green-500/20 rounded-full blur-3xl"
                />

                {/* Brand Logo with Float/Pulse */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative z-10 w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border-2 border-green-500/30 shadow-2xl shadow-green-500/20"
                >
                    <Image
                        src="/loader.png"
                        alt="Loading..."
                        className="w-full h-full object-cover"
                        width={128}
                        height={128}
                    />
                </motion.div>

                {/* Loading Bar */}
                <div className="mt-8 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{
                            repeat: Infinity,
                            duration: 1.5,
                            ease: "linear"
                        }}
                        className="h-full w-full bg-gradient-to-r from-transparent via-green-500 to-transparent"
                    />
                </div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-4 text-green-400 font-mono text-sm tracking-widest"
                >
                    LOADING SYSTEM...
                </motion.p>
            </div>
        </div>
    );
}
