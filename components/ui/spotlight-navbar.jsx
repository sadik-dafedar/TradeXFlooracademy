'use client';

import React, { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';
import { cn } from '@/lib/utils';

export function SpotlightNavbar({
    items = [
        { label: 'Home', href: '#home' },
        { label: 'About', href: '#about' },
        { label: 'Events', href: '#events' },
        { label: 'Sponsors', href: '#sponsors' },
        { label: 'Pricing', href: '#pricing' },
    ],
    className,
    onItemClick,
    defaultActiveIndex = 0,
}) {
    const navRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(defaultActiveIndex);
    const [isHovered, setIsHovered] = useState(false);

    // Refs for the "light" positions so we can animate them imperatively
    const spotlightX = useRef(0);
    const ambienceX = useRef(0);
    const navRectRef = useRef(null);

    useEffect(() => {
        if (!navRef.current) return;
        const nav = navRef.current;

        const updateRect = () => {
            navRectRef.current = nav.getBoundingClientRect();
        };

        const handleMouseMove = (e) => {
            if (!navRectRef.current) updateRect();
            const rect = navRectRef.current;
            const x = e.clientX - rect.left;

            if (!isHovered) {
                setIsHovered(true);
            }
            // Direct update for immediate feedback
            spotlightX.current = x;
            nav.style.setProperty('--spotlight-x', `${x}px`);
        };

        const handleMouseLeave = () => {
            setIsHovered(false);
            // When mouse leaves, spring the spotlight back to the active item
            const activeItem = nav.querySelector(`[data-index="${activeIndex}"]`);
            if (activeItem) {
                const navRect = nav.getBoundingClientRect();
                const itemRect = activeItem.getBoundingClientRect();
                const targetX = itemRect.left - navRect.left + itemRect.width / 2;
                animate(spotlightX.current, targetX, {
                    type: 'spring',
                    stiffness: 200,
                    damping: 20,
                    onUpdate: (v) => {
                        spotlightX.current = v;
                        nav.style.setProperty('--spotlight-x', `${v}px`);
                    },
                });
            }
        };

        nav.addEventListener('mousemove', handleMouseMove);
        nav.addEventListener('mouseleave', handleMouseLeave);
        nav.addEventListener('mouseenter', updateRect);
        window.addEventListener('scroll', updateRect);
        window.addEventListener('resize', updateRect);

        return () => {
            nav.removeEventListener('mousemove', handleMouseMove);
            nav.removeEventListener('mouseleave', handleMouseLeave);
            nav.removeEventListener('mouseenter', updateRect);
            window.removeEventListener('scroll', updateRect);
            window.removeEventListener('resize', updateRect);
        };
    }, [activeIndex, isHovered]);

    // Handle the "Ambience" (Active Item) Movement
    useEffect(() => {
        if (!navRef.current) return;
        const nav = navRef.current;
        const activeItem = nav.querySelector(`[data-index="${activeIndex}"]`);

        if (activeItem) {
            const navRect = nav.getBoundingClientRect();
            const itemRect = activeItem.getBoundingClientRect();
            const targetX = itemRect.left - navRect.left + itemRect.width / 2;

            animate(ambienceX.current, targetX, {
                type: 'spring',
                stiffness: 200,
                damping: 20,
                onUpdate: (v) => {
                    ambienceX.current = v;
                    nav.style.setProperty('--ambience-x', `${v}px`);
                },
            });
        }
    }, [activeIndex]);

    const handleItemClick = (item, index) => {
        setActiveIndex(index);
        onItemClick?.(item, index);
    };

    return (
        <div className={cn('relative flex justify-center pt-10', className)}>
            <nav
                ref={navRef}
                className={cn(
                    'spotlight-nav relative h-11 rounded-full transition-all duration-300 overflow-hidden',
                    'bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md',
                    'border border-neutral-200 dark:border-neutral-700',
                    'shadow-lg shadow-neutral-200/50 dark:shadow-neutral-900/50'
                )}
            >
                {/* Content */}
                <ul className="relative flex items-center h-full px-2 gap-0 z-[10]">
                    {items.map((item, idx) => (
                        <li key={idx} className="relative h-full flex items-center justify-center">
                            <a
                                href={item.href}
                                data-index={idx}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleItemClick(item, idx);
                                }}
                                className={cn(
                                    'px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-full',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-white/30',
                                    // Active vs Inactive Text
                                    activeIndex === idx
                                        ? 'text-black dark:text-white'
                                        : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                                )}
                            >
                                {item.label}
                            </a>
                        </li>
                    ))}
                </ul>

                {/* LIGHTING LAYERS */}
                {/* 1. The Moving Spotlight (Follows Mouse) */}
                <div
                    className="pointer-events-none absolute bottom-0 left-0 w-full h-full z-[1] opacity-0 transition-opacity duration-300"
                    style={{
                        opacity: isHovered ? 1 : 0,
                        background: `
                            radial-gradient(
                                120px circle at var(--spotlight-x) 100%,
                                rgba(0,0,0,0.1) 0%,
                                transparent 50%
                            )
                        `,
                    }}
                />

                {/* 2. The Active State Ambience (Stays on Active) */}
                <div
                    className="pointer-events-none absolute bottom-0 left-0 w-full h-[2px] z-[2]"
                    style={{
                        background: `
                            radial-gradient(
                                60px circle at var(--ambience-x) 0%,
                                var(--neon-pink, #00E396) 0%,
                                transparent 100%
                            )
                        `,
                    }}
                />
            </nav>
        </div>
    );
}

export default SpotlightNavbar;
