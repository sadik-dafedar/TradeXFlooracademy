'use client';

import { motion } from 'framer-motion';

export default function LiquidGlassCard({
    children,
    className = '',
    hover = true,
    glow = false,
    border = false,
    reflection = false,
    onClick,
}) {
    return (
        <motion.div
            className={`
        relative rounded-2xl p-6 cursor-pointer
        ${hover ? 'liquid-glass' : ''}
        ${glow ? 'fintech-glow' : ''}
        ${border ? 'liquid-border' : ''}
        ${reflection ? 'glass-reflection' : ''}
        ${className}
      `}
            style={{
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(139, 92, 246, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
            whileHover={hover ? {
                scale: 1.02,
                transition: { duration: 0.3, ease: 'easeOut' }
            } : {}}
            whileTap={hover ? { scale: 0.98 } : {}}
            onClick={onClick}
        >
            {/* Animated gradient overlay */}
            <div
                className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(245, 158, 11, 0.05) 50%, rgba(236, 72, 153, 0.1) 100%)',
                }}
            />

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
}

// Variant for course cards
export function LiquidCourseCard({
    children,
    className = '',
    isBestSeller = false,
}) {
    return (
        <motion.div
            className={`
        relative rounded-2xl overflow-hidden cursor-pointer
        liquid-glass fintech-glow
        ${className}
      `}
            style={{
                background: 'rgba(15, 23, 42, 0.9)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: isBestSeller
                    ? '1px solid rgba(245, 158, 11, 0.4)'
                    : '1px solid rgba(139, 92, 246, 0.2)',
            }}
            whileHover={{
                scale: 1.02,
                y: -8,
                transition: { duration: 0.3, ease: 'easeOut' }
            }}
            whileTap={{ scale: 0.98 }}
        >
            {/* Best seller glow effect */}
            {isBestSeller && (
                <div
                    className="absolute inset-0 opacity-30 pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.3), transparent 50%)',
                    }}
                />
            )}

            {children}
        </motion.div>
    );
}

// Stats card variant
export function LiquidStatsCard({
    icon: Icon,
    value,
    label,
    className = '',
}) {
    return (
        <motion.div
            className={`
        relative rounded-2xl p-6 text-center cursor-pointer
        liquid-glass
        ${className}
      `}
            style={{
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(139, 92, 246, 0.15)',
            }}
            whileHover={{
                scale: 1.05,
                transition: { duration: 0.3, ease: 'easeOut' }
            }}
        >
            {/* Icon with glow */}
            <div className="relative inline-block mb-3">
                <Icon className="w-8 h-8 text-amber-400" />
                <div
                    className="absolute inset-0 blur-lg opacity-50"
                    style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.5), transparent)' }}
                />
            </div>

            {/* Value with gradient */}
            <p
                className="text-3xl md:text-4xl font-bold"
                style={{
                    background: 'linear-gradient(135deg, #F59E0B, #ec4899)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                }}
            >
                {value}
            </p>

            {/* Label */}
            <p className="text-sm text-white/60 mt-1">{label}</p>
        </motion.div>
    );
}
