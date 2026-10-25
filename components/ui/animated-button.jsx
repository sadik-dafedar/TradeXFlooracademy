'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const AnimatedButton = ({
    children = 'Browse Components',
    className = '',
    as = 'button',
    whileTap = { scale: 0.97 },
    transition = {
        stiffness: 20,
        damping: 15,
        mass: 2,
        scale: {
            type: 'spring',
            stiffness: 10,
            damping: 5,
            mass: 0.1,
        },
    },
    ...rest
}) => {
    const Component = motion[as] || motion.button;

    return (
        <Component
            {...rest}
            whileTap={whileTap}
            transition={transition}
            className={cn(
                'px-6 py-3 rounded-xl relative overflow-hidden',
                'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600',
                'text-white font-semibold',
                '[--shine:rgba(255,255,255,.66)]',
                className
            )}
        >
            <motion.span
                className="tracking-wide font-medium h-full w-full flex items-center justify-center relative z-10"
                style={{
                    WebkitMaskImage:
                        'linear-gradient(-75deg, white calc(var(--mask-x) + 20%), transparent calc(var(--mask-x) + 30%), white calc(var(--mask-x) + 100%))',
                    maskImage:
                        'linear-gradient(-75deg, white calc(var(--mask-x) + 20%), transparent calc(var(--mask-x) + 30%), white calc(var(--mask-x) + 100%))',
                }}
                initial={{ '--mask-x': '100%' }}
                animate={{ '--mask-x': '-100%' }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear', repeatDelay: 1 }}
            >
                {children}
            </motion.span>
            <motion.span
                className="block absolute inset-0 rounded-xl p-px"
                style={{
                    background:
                        'linear-gradient(-75deg, transparent 30%, var(--shine) 50%, transparent 70%)',
                    backgroundSize: '200% 100%',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                }}
                initial={{ backgroundPosition: '100% 0', opacity: 0 }}
                animate={{ backgroundPosition: ['100% 0', '0% 0'], opacity: [0, 1, 0] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
            />
        </Component>
    );
};

export default AnimatedButton;
