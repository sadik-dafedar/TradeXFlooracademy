'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ShoppingBag, LogOut, User, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence, animate } from 'framer-motion';


export default function Navbar({ onOpenAuth }) {
    const { data: session } = useSession();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);


    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    setScrolled(window.scrollY > 50);
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'Courses', href: '#courses' },
        { name: 'About', href: '#about' },
        { name: 'Contact Us', href: '#contact' },
    ];

    const handleLogout = () => {
        localStorage.setItem('logout-event', Date.now());
        setUserMenuOpen(false);
        signOut({ callbackUrl: '/' });
    };

    const isDark = true;

    // --- Spotlight Logic ---
    const navRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const spotlightX = useRef(0);
    const ambienceX = useRef(0);
    const navRectRef = useRef(null);

    // Initial Ambience Position
    useEffect(() => {
        // Wait for mount
        if (!mounted || !navRef.current) return;
        const nav = navRef.current;
        const activeItem = nav.querySelector(`[data-index="${activeIndex}"]`);
        if (activeItem) {
            const navRect = nav.getBoundingClientRect();
            const itemRect = activeItem.getBoundingClientRect();
            const targetX = itemRect.left - navRect.left + itemRect.width / 2;
            ambienceX.current = targetX;
            nav.style.setProperty('--ambience-x', `${targetX}px`);
        }
    }, [mounted, activeIndex]);

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

            if (!isHovered) setIsHovered(true);

            spotlightX.current = x;
            nav.style.setProperty('--spotlight-x', `${x}px`);
        };

        const handleMouseLeave = () => {
            setIsHovered(false);
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

        return () => {
            nav.removeEventListener('mousemove', handleMouseMove);
            nav.removeEventListener('mouseleave', handleMouseLeave);
            nav.removeEventListener('mouseenter', updateRect);
        };
    }, [activeIndex, isHovered]);

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


    return (
        <>
            <nav
                className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${scrolled
                    ? 'backdrop-blur-xl border-b h-16'
                    : 'bg-transparent h-20'
                    }`}
                style={{
                    background: scrolled ? (isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)') : 'transparent',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                }}
            >
                <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                    <Link href="/" aria-label="Home" className="flex items-center gap-2 sm:gap-3 group">
                        <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-all duration-300">
                            <Image src="/neon_bull_charge_with_financial_ascent.png" alt="TradeXFloor" className="w-full h-full object-cover" width={40} height={40} />
                        </div>
                        <span className="font-bold text-sm sm:text-xl tracking-tight">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">TradeX Floor Academy</span>
                        </span>
                    </Link>

                    {/* Desktop Spotlight Menu */}
                    <div className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2">
                        <div
                            ref={navRef}
                            className="relative flex items-center gap-1 px-2 py-1.5 rounded-full overflow-hidden"
                            style={{
                                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                                backdropFilter: 'blur(20px) saturate(180%)',
                                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                                '--neon-pink': '#00E396' // Custom accent color
                            }}
                        >
                            {/* Links */}
                            <div className="relative z-10 flex">
                                {navLinks.map((link, idx) => (
                                    <a
                                        key={link.name}
                                        href={link.href}
                                        data-index={idx}
                                        onClick={() => setActiveIndex(idx)}
                                        className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 relative ${activeIndex === idx
                                                ? (isDark ? 'text-white' : 'text-black')
                                                : (isDark ? 'text-white/70 hover:text-white' : 'text-black/70 hover:text-black')
                                            }`}
                                    >
                                        {link.name}
                                    </a>
                                ))}
                            </div>

                            {/* LIGHTING LAYERS */}
                            {/* 1. The Moving Spotlight (Follows Mouse) */}
                            <div
                                className="pointer-events-none absolute inset-0 z-[1] transition-opacity duration-300"
                                style={{
                                    opacity: isHovered ? 1 : 0,
                                    background: `radial-gradient(120px circle at var(--spotlight-x) 50%, rgba(255,255,255,0.1), transparent 100%)`,
                                }}
                            />

                            {/* 2. The Active State Ambience (Stays on Active) */}
                            <div
                                className="pointer-events-none absolute bottom-0 left-0 w-full h-[2px] z-[2]"
                                style={{
                                    background: `radial-gradient(40px circle at var(--ambience-x) 100%, var(--neon-pink, #00E396) 0%, transparent 100%)`,
                                }}
                            />
                        </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-4">


                        {session?.user ? (
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/dashboard"
                                    className={`p-2 rounded-full transition-colors relative group ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
                                    title="My Courses"
                                    aria-label="My Courses"
                                >
                                    <ShoppingBag size={20} className={isDark ? 'text-white' : 'text-gray-700'} />
                                </Link>

                                {/* User Dropdown */}
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        aria-label="User Menu"
                                        aria-expanded={userMenuOpen}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                            {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                            {session.user.name || 'User'}
                                        </span>
                                        <ChevronDown size={16} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''} ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                                    </button>

                                    <AnimatePresence>
                                        {userMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                transition={{ duration: 0.15 }}
                                                className={`absolute right-0 top-full mt-2 w-48 rounded-xl border shadow-xl overflow-hidden ${isDark
                                                    ? 'bg-gray-900 border-white/10'
                                                    : 'bg-white border-gray-200'
                                                    }`}
                                            >
                                                <div className={`p-3 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                                                    <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {session.user.name || 'User'}
                                                    </p>
                                                    <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'} truncate`}>
                                                        {session.user.email}
                                                    </p>
                                                </div>
                                                <div className="p-1">
                                                    <Link
                                                        href="/dashboard"
                                                        onClick={() => setUserMenuOpen(false)}
                                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isDark
                                                            ? 'text-white/80 hover:bg-white/10 hover:text-white'
                                                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                                            }`}
                                                    >
                                                        <LayoutDashboard size={18} />
                                                        Dashboard
                                                    </Link>
                                                    <button
                                                        onClick={handleLogout}
                                                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors text-red-500 ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
                                                            }`}
                                                    >
                                                        <LogOut size={18} />
                                                        Sign Out
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => onOpenAuth('login')}
                                    className={`text-sm font-semibold px-4 py-2 rounded-full transition-all ${isDark
                                        ? 'text-white/80 hover:text-white hover:bg-white/5'
                                        : 'text-gray-700 hover:text-gray-900 hover:bg-black/5'
                                        }`}
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => onOpenAuth('signup')}
                                    className="px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all duration-300 hover:scale-105"
                                    style={{
                                        background: 'linear-gradient(135deg, #10B981, #3B82F6, #F59E0B)',
                                        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
                                    }}
                                >
                                    Get Started
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        aria-label="Open Mobile Menu"
                        className={`lg:hidden p-2 rounded-full ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/10 text-gray-700'}`}
                    >
                        <Menu size={24} />
                    </button>
                </div>
            </nav>

            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 lg:hidden"
                    >
                        <div
                            className="absolute inset-0"
                            onClick={() => setMobileMenuOpen(false)}
                            style={{
                                background: 'rgba(0, 0, 0, 0.8)',
                                backdropFilter: 'blur(10px)',
                            }}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25 }}
                            className={`absolute right-0 top-0 h-full w-80 p-6 border-l ${isDark
                                ? 'bg-gray-900 border-white/10'
                                : 'bg-white border-gray-200'
                                }`}
                        >
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                aria-label="Close Mobile Menu"
                                className={`absolute top-4 right-4 p-2 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
                            >
                                <X size={24} className={isDark ? 'text-white' : 'text-gray-700'} />
                            </button>

                            <div className="mt-16 space-y-6">
                                <div className="space-y-2">
                                    {navLinks.map((link) => (
                                        <a
                                            key={link.name}
                                            href={link.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`block px-4 py-3 rounded-xl text-lg font-medium transition-colors ${isDark
                                                ? 'text-white/80 hover:text-white hover:bg-white/5'
                                                : 'text-gray-700 hover:text-gray-900 hover:bg-black/5'
                                                }`}
                                        >
                                            {link.name}
                                        </a>
                                    ))}
                                </div>

                                <div className={`border-t pt-6 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>


                                    {session?.user ? (
                                        <div className="space-y-2">
                                            <Link
                                                href="/dashboard"
                                                onClick={() => setMobileMenuOpen(false)}
                                                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl ${isDark
                                                    ? 'text-white hover:bg-white/5'
                                                    : 'text-gray-700 hover:bg-black/5'
                                                    }`}
                                            >
                                                <LayoutDashboard size={20} />
                                                Dashboard
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className={`flex items-center gap-3 w-full px-4 py-3 text-red-500 rounded-xl ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
                                                    }`}
                                            >
                                                <LogOut size={20} /> Sign Out
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <button
                                                onClick={() => { setMobileMenuOpen(false); onOpenAuth('login'); }}
                                                className={`w-full py-3 rounded-xl font-semibold ${isDark
                                                    ? 'bg-white/5 border border-white/10 text-white'
                                                    : 'bg-gray-100 border border-gray-200 text-gray-900'
                                                    }`}
                                            >
                                                Login
                                            </button>
                                            <button
                                                onClick={() => { setMobileMenuOpen(false); onOpenAuth('signup'); }}
                                                className="w-full py-3 rounded-xl font-semibold text-white"
                                                style={{
                                                    background: 'linear-gradient(135deg, #10B981, #3B82F6, #F59E0B)',
                                                }}
                                            >
                                                Sign Up
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
