'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';

/**
 * Apple-style 3D Glass Card
 * Features:
 * - Physics-based 3D tilt
 * - Dynamic glare effect following mouse
 * - Premium glassmorphism
 * - Depth layering
 */
export default function Apple3DCard({ children, className = '', intensity = 15, glowColor }) {
    const ref = useRef(null);

    // Motion values for tilt
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smoother spring physics (Apple-like resistance)
    const mouseX = useSpring(x, { stiffness: 60, damping: 20, mass: 0.8 });
    const mouseY = useSpring(y, { stiffness: 60, damping: 20, mass: 0.8 });

    // 3D rotation based on mouse position
    const rotateX = useMotionTemplate`${mouseY}deg`;
    const rotateY = useMotionTemplate`${mouseX}deg`;

    function handleMouseMove({ clientX, clientY }) {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        const centerX = rect.left + width / 2;
        const centerY = rect.top + height / 2;

        const xPos = (clientX - centerX) / (width / 2);
        const yPos = (clientY - centerY) / (height / 2);

        x.set(xPos * intensity);
        y.set(yPos * -intensity);
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
    }

    return (
        <motion.div
            ref={ref}
            className={`relative group perspective-1000 ${className}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                transformStyle: 'preserve-3d',
            }}
        >
            <motion.div
                className="relative h-full w-full rounded-2xl transition-all duration-200"
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: 'preserve-3d',
                }}
            >
                {/* Premium Glass Background */}
                <div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        boxShadow: glowColor
                            ? `0 8px 32px 0 rgba(0, 0, 0, 0.2), inset 0 0 0 1px ${glowColor}`
                            : '0 8px 32px 0 rgba(0, 0, 0, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.08)',
                        transform: 'translateZ(-1px)',
                    }}
                />

                {/* Mouse-following Glare */}
                <motion.div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-50"
                    style={{
                        background: useMotionTemplate`
              radial-gradient(
                600px circle at ${mouseX}px ${mouseY}px,
                rgba(255, 255, 255, 0.12),
                transparent 40%
              )
            `,
                        mixBlendMode: 'plus-lighter',
                    }}
                />

                {/* Subtle Inner Highlight */}
                <div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                        background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.2), transparent 50%, transparent)',
                        opacity: 0.5,
                        maskImage: 'linear-gradient(#fff, #fff)',
                        WebkitMaskImage: 'linear-gradient(#fff, #fff)',
                        maskClip: 'padding-box',
                        WebkitMaskClip: 'padding-box',
                    }}
                />

                {/* Content Layer */}
                <div className="relative z-10 h-full" style={{ transform: 'translateZ(10px)' }}>
                    {children}
                </div>

            </motion.div>
        </motion.div>
    );
}
