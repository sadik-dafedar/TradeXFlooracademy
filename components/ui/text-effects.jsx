'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';

// 1. Cyberpunk Glitch Text (Hero/Headings)
export const GlitchText = ({ text, className, color = 'white' }) => {
    return (
        <div className={cn("relative inline-block", className)}>
            <span className="relative z-10">{text}</span>
            <span
                className={cn("absolute top-0 left-0 -z-10 w-full h-full opacity-70 animate-glitch-1",
                    color === 'green' ? 'text-green-400' : 'text-pink-500')}
                aria-hidden="true"
            >
                {text}
            </span>
            <span
                className={cn("absolute top-0 left-0 -z-20 w-full h-full opacity-70 animate-glitch-2",
                    color === 'green' ? 'text-blue-400' : 'text-cyan-400')}
                aria-hidden="true"
            >
                {text}
            </span>
        </div>
    );
};

// 2. Typewriter Line (Explanations/Subtitles)
export const TypewriterText = ({ text, className, delay = 0 }) => {
    const [displayedText, setDisplayedText] = useState('');
    const intervalRef = useRef(null);

    useEffect(() => {
        const timeout = setTimeout(() => {
            let i = 0;
            intervalRef.current = setInterval(() => {
                setDisplayedText(text.substring(0, i + 1));
                i++;
                if (i === text.length) clearInterval(intervalRef.current);
            }, 50); // Speed
        }, delay * 1000);

        return () => {
            clearTimeout(timeout);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [text, delay]);

    return (
        <span className={cn("font-mono border-r-2 border-green-400 pr-1 animate-pulse", className)}>
            {displayedText}
        </span>
    );
};

// 3. Wavy Text (Friendly/Contact)
export const WavyText = ({ text, className, delay = 0 }) => {
    const letters = Array.from(text);

    const container = {
        hidden: { opacity: 0 },
        visible: (i = 1) => ({
            opacity: 1,
            transition: { staggerChildren: 0.05, delayChildren: 0.04 * i + delay },
        }),
    };

    const child = {
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                damping: 12,
                stiffness: 200,
                repeat: Infinity,
                repeatType: "mirror",
                duration: 2,
                repeatDelay: 2
            },
        },
        hidden: {
            opacity: 0,
            y: 20,
            transition: {
                type: "spring",
                damping: 12,
                stiffness: 200,
            },
        },
    };

    return (
        <motion.div
            style={{ display: "inline-block" }} // Changed from flex to inline-block to prevent layout break
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }} // Re-animate on scroll
            className={className}
        >
            {letters.map((letter, index) => (
                <motion.span variants={child} key={index} className="inline-block relative">
                    {letter === " " ? "\u00A0" : letter}
                </motion.span>
            ))}
        </motion.div>
    );
};

// 4. Scale/Pop Text (Courses/Features)
export const ScaleText = ({ text, className, delay = 0 }) => {
    return (
        <motion.span
            initial={{ scale: 0.5, opacity: 0, filter: 'blur(10px)' }}
            whileInView={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
            transition={{
                delay: delay,
                type: "spring",
                stiffness: 100,
                damping: 10
            }}
            className={cn("inline-block", className)}
        >
            {text}
        </motion.span>
    );
};

// 5. 3D Floating Text (Hero)
export const Float3DText = ({ text, className }) => {
    return (
        <motion.div
            initial={{ rotateX: 90, opacity: 0 }}
            whileInView={{ rotateX: 0, opacity: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className={cn("perspective-text", className)}
            style={{ transformStyle: 'preserve-3d' }}
        >
            <motion.span
                animate={{
                    y: [0, -10, 0],
                    rotateX: [0, 5, 0]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="block"
            >
                {text}
            </motion.span>
        </motion.div>
    );
};
