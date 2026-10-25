'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import GlobalLoader from '@/components/GlobalLoader';
import { useRouter } from 'next/navigation';
import {
  Play, BookOpen, Video, FileText, Shield, Users, TrendingUp,
  Star, Check, ArrowRight, Award, Clock, Headphones, Mail, Phone,
  Instagram, Youtube, MessageCircle, PlayCircle, Target, BarChart3,
  Zap, ChevronRight, MapPin, Send
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import LiquidGlassCard, { LiquidStatsCard, LiquidCourseCard } from '../components/LiquidGlassCard';
import Apple3DCard from '../components/Apple3DCard';

// VengenceUI Premium Components
import AnimatedButton from '../components/ui/animated-button';
import { AnimatedNumber } from '../components/ui/animated-number';
import { FlipText } from '@/components/ui/flip-text';
import { GlitchText, TypewriterText, WavyText, ScaleText, Float3DText } from '@/components/ui/text-effects';
import GlowBorderCard from '../components/ui/glow-border-card';
import LogoSlider from '../components/ui/logo-slider';
import Image from 'next/image';
import { SkeletonCard, SkeletonStats, SkeletonFeature, SkeletonReview, SkeletonVideo } from '@/components/ui/skeleton-card';
import { Skeleton } from '@/components/ui/skeleton';

const stats = [
  { value: 1500, suffix: '+', label: 'Students', icon: Users },
  { value: 50, suffix: '+', label: 'Course Hours', icon: Clock },
  { value: 90, suffix: '%', label: 'Success Rate', icon: Target },
  { value: 24, suffix: '/7', label: 'Support', icon: Headphones },
];

const keyTopics = [
  { title: 'Price Action', desc: 'Master reading raw price movements in markets', icon: BarChart3, image: '/images/price-action.png' },
  { title: 'SMC (Smart Money Concepts)', desc: 'Trade like institutional traders', icon: TrendingUp, image: '/images/smc.png' },
  { title: 'Risk Management', desc: 'Protect your capital while trading', icon: Shield, image: '/images/risk.png' },
  { title: 'Technical Analysis', desc: 'Chart patterns & indicators mastery', icon: Target, image: '/images/technical.png' },
];

const courses = [
  {
    id: 1,
    title: 'A to Z Guide PDF',
    slug: 'a-to-z-guide-pdf',
    desc: 'Complete guide covering every aspect of trading from lexicon to strategies.',
    price: '₹999',
    originalPrice: '₹1,999',
    type: 'PDF',
    duration: 'N/A',
    lessons: 'Comprehensive',
    features: ['Lexicon', 'Strategies', 'Patterns', 'Psychology'],
    badge: 'Popular Guide',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
  },
  {
    id: 2,
    title: 'Basic Trading',
    slug: 'basic-trading',
    desc: 'Start your journey with the fundamental concepts of the stock market.',
    price: '₹2,499',
    originalPrice: '₹4,999',
    type: 'VIDEO',
    duration: '10+ Hours',
    lessons: 'Starter Pack',
    features: ['Market Basics', 'Terminologies', 'Chart Intro', 'Support Access'],
    badge: 'Beginner',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
  },
  {
    id: 3,
    title: 'Basic to Advance',
    slug: 'basic-to-advance',
    desc: 'The complete roadmap to becoming a profitable professional trader.',
    price: '₹5,999',
    originalPrice: '₹11,999',
    type: 'VIDEO',
    duration: '40+ Hours',
    lessons: 'Masterclass',
    features: ['Price Action', 'SMC', 'Risk Mgmt', 'Psychology'],
    badge: 'Best Seller',
    isBestSeller: true,
    image: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&q=80',
  },
  {
    id: 4,
    title: 'One to One Classes',
    slug: 'one-to-one-classes',
    desc: 'Personalized mentorship to clear your doubts and refine your strategy.',
    price: 'Contact Us',
    originalPrice: '',
    type: 'LIVE',
    duration: 'Custom',
    lessons: 'Personal',
    features: ['Direct Mentorship', 'Live Analysis', 'Q&A', 'Strategy Review'],
    badge: 'Premium',
    image: 'https://images.unsplash.com/photo-1577962917302-cd874c4e3169?w=800&q=80',
  },
  {
    id: 5,
    title: 'AI Trading',
    slug: 'ai-trading',
    desc: 'Leverage the power of Artificial Intelligence in your trading setup.',
    price: '₹7,999',
    originalPrice: '₹15,999',
    type: 'VIDEO+TOOLS',
    duration: '20+ Hours',
    lessons: 'Advanced',
    features: ['Algo Strategies', 'AI Indicators', 'Backtesting', 'Automation'],
    badge: 'New Tech',
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80',
  },
];

const testimonials = [
  {
    name: 'Rahul Sharma',
    role: 'Full-Time Trader',
    content: 'TradeX Floor Academy changed my life. From losing money to consistent profits within 6 months!',
    image: '/images/testimonials/rahul.png',
    profit: '+₹2.5L/month',
  },
  {
    name: 'Priya Patel',
    role: 'Swing Trader',
    content: 'The SMC strategies taught here are pure gold. Best investment I made in my trading career.',
    image: '/images/testimonials/priya.png',
    profit: '+₹1.8L/month',
  },
  {
    name: 'Amit Kumar',
    role: 'Professional Trader',
    content: 'Finally understood price action after years of struggling. The mentors are amazing!',
    image: '/images/testimonials/amit.png',
    profit: '+₹3.2L/month',
  },
];

const features = [
  { title: 'A1 Trading Setup', desc: 'Professional-grade trading setups', icon: Zap },
  { title: 'Beginner Friendly Course', desc: 'Start from zero knowledge', icon: BookOpen },
  { title: '24/7 Support', desc: 'Round the clock assistance', icon: Headphones },
  { title: '90% Success Ratio', desc: 'Proven track record in trading', icon: Award },
];

function GlassCard({ children, className = '', hover = true }) {
  return (
    <div
      className={`relative rounded-2xl p-6 cursor-pointer liquid-glass ${hover ? 'hover:scale-[1.02] transition-all duration-300' : ''} ${className}`}
      style={{
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(139, 92, 246, 0.15)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
    >
      {children}
    </div>
  );
}

import Script from 'next/script'; // Import Script
import SectionErrorBoundary from '../components/SectionErrorBoundary';
import FAQSection from '@/components/FAQSection';

export default function Home() {
  const { data: session } = useSession();
  const { openAuthModal } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [cmsContent, setCmsContent] = useState(null); // CMS DATA
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  // Splash Screen & Data Fetching
  useEffect(() => {
    const fetchEverything = async () => {
      try {
        // Parallel Fetch for Speed
        const [productRes, cmsRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/content/home') // Unified CMS API
        ]);

        const productData = await productRes.json();
        const cmsData = await cmsRes.json();

        if (Array.isArray(productData)) setProducts(productData);
        if (cmsData) setCmsContent(cmsData);
      } catch (error) {
        console.error("Failed to load page content:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEverything();
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // DERIVE DISPLAYS from CMS or Defaults
  const hero = cmsContent?.hero || {
    badge: 'Best Trading Institute in India',
    title_line1: 'Master the Art of',
    title_highlight: 'Professional Trading',
    subtitle: 'Become Profitable Trader',
    description: 'TradeX Floor Academy is the best stock market institute that transform your journey with us. We are here to help you dominate the market and turn your dreams into reality.',
    review_count: '1500+ Students Enrolled'
  };

  const displayStats = cmsContent?.stats?.length > 0 ? cmsContent?.stats : stats;
  const displayFeatures = cmsContent?.features?.length > 0 ? cmsContent?.features : features;
  const displayTestimonials = cmsContent?.testimonials?.length > 0 ? cmsContent?.testimonials : testimonials;

  if (showSplash) {
    return <GlobalLoader />;
  }

  const handleBuy = async (courseSlug) => {
    if (!session) return openAuthModal('signup');

    // Match by stable slug/code instead of title
    const product = products.find(p => p.slug === courseSlug);

    if (!product) {
      alert("This course is currently not open for enrollment or sold out.");
      return;
    }

    const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!razorpayKey) {
      alert('Payment system configuration missing.');
      return;
    }

    // Check if Razorpay script is loaded
    if (!window.Razorpay) {
      alert("Payment gateway is loading. Please try again in 3 seconds.");
      return;
    }

    try {
      // 1. Create Order
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id })
      });

      if (!res.ok) throw new Error('Failed to create order');
      const order = await res.json();
      if (order.error) throw new Error(order.error);

      // 2. Open Razorpay
      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: "TradeX Floor Academy",
        description: product.title,
        order_id: order.id,
        handler: async function (response) {
          try {
            // 3. Verify Payment on Server
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              alert("Payment Verified! Redirecting to Dashboard...");
              router.push('/dashboard?tab=courses');
            } else {
              alert(
                `Payment Verification Failed. Your payment ID: ${response.razorpay_payment_id}\n` +
                `Please contact support with this ID if amount was deducted.\n` +
                `Error: ${verifyData.error || 'Unknown error'}`
              );
            }
          } catch (err) {
            console.error(err);
            alert("Payment verification error");
          }
        },
        theme: { color: "#10B981" }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      alert('Purchase failed: ' + error.message);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <main className="min-h-screen overflow-hidden relative selection:bg-purple-500/30 text-foreground">


        <SectionErrorBoundary sectionName="Hero Section">
          <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-32 px-6 overflow-hidden min-h-screen flex items-center">

            {/* 3D Aurora Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `
                            repeating-linear-gradient(
                                100deg,
                                #5b21b6 0%,
                                #5b21b6 7%,
                                transparent 10%,
                                transparent 12%,
                                #5b21b6 16%
                            ),
                            repeating-linear-gradient(
                                100deg,
                                #3b82f6 10%,
                                #ec4899 15%,
                                #3b82f6 20%,
                                #06b6d4 25%,
                                #3b82f6 30%
                            )
                        `,
                backgroundSize: '300%, 200%',
                backgroundPosition: '50% 50%, 50% 50%',
                filter: 'blur(30px)',
                maskImage: 'radial-gradient(ellipse at 50% 0%, black 40%, transparent 80%)',
                WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, black 40%, transparent 80%)',
              }} />
            </div>

            <div className="max-w-7xl mx-auto w-full relative z-10">
              <div className="flex flex-col items-center text-center">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="space-y-8 max-w-4xl"
                >
                  {loading ? (
                    <div className="space-y-6 flex flex-col items-center">
                      <Skeleton className="h-4 w-48 rounded-full bg-white/10" />
                      <div className="space-y-4 w-full flex flex-col items-center">
                        <Skeleton className="h-16 w-3/4 bg-white/10 rounded-2xl" />
                        <Skeleton className="h-16 w-1/2 bg-white/10 rounded-2xl" />
                      </div>
                      <Skeleton className="h-6 w-2/3 bg-white/5 rounded-lg" />
                      <div className="flex gap-4 pt-4">
                        <Skeleton className="h-14 w-40 rounded-xl bg-white/10" />
                        <Skeleton className="h-14 w-40 rounded-xl bg-white/5" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mx-auto"
                        style={{
                          background: 'rgba(168, 85, 247, 0.15)',
                          border: '1px solid rgba(168, 85, 247, 0.4)',
                        }}
                      >
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm font-medium text-green-400">Best Trading Institute in India</span>
                      </motion.div>

                      <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight text-white mb-6" style={{ color: '#ffffff' }}>
                        Master the Art of{' '}
                        <motion.span
                          className="block mt-3 relative"
                          animate={{
                            y: [0, -10, 0],
                            rotateX: [0, 5, 0],
                            scale: [1, 1.02, 1]
                          }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #10B981, #3B82F6)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 4px 0px rgba(16, 185, 129, 0.5))', // CSS 3D Effect
                            letterSpacing: '-2px',
                            transform: 'translateZ(0)', // Hardware acceleration
                            transformStyle: 'preserve-3d',
                            display: 'inline-block'
                          }}
                        >
                          Professional Trading
                        </motion.span>
                        <span className="block text-2xl sm:text-3xl lg:text-4xl mt-4 font-extrabold tracking-widest uppercase"
                          style={{
                            color: '#F59E0B',
                            textShadow: '2px 2px 0px rgba(245, 158, 11, 0.4), 4px 4px 0px rgba(0,0,0,0.5)' // Layered 3D shadow 
                          }}>
                          <GlitchText text="Become Profitable Trader" color="green" />
                        </span>
                      </h1>

                      <p className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        TradeX Floor Academy is the best stock market institute that transform your journey with us. We are here to help you dominate the market and turn your dreams into reality.
                      </p>

                      <div className="flex flex-wrap gap-4 justify-center pt-4">
                        <AnimatedButton
                          as="a"
                          href="#courses"
                          className="px-8 py-4 text-lg font-bold flex items-center gap-3"
                        >
                          Explore Courses <ArrowRight size={20} />
                        </AnimatedButton>
                        <motion.button
                          onClick={() => session ? router.push('/dashboard') : openAuthModal('signup')}
                          className="px-8 py-4 rounded-xl font-semibold flex items-center gap-3"
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(10px)',
                          }}
                          whileHover={{ background: 'rgba(255, 255, 255, 0.1)' }}
                        >
                          <PlayCircle size={20} className="text-green-400" /> Watch Demo
                        </motion.button>
                      </div>
                    </>
                  )}

                  <div className="flex items-center gap-6 justify-center pt-6">
                    <div className="flex -space-x-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-black overflow-hidden relative">
                          <Image
                            src={`https://i.pravatar.cc/100?img=${i + 10}`}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} size={14} fill="#fbbf24" className="text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-sm text-white/70">1500+ Students Enrolled</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="Stats Section">
          <section className="py-16 px-6 relative">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {loading ? (
                  // Show 4 Skeleton Stats while loading
                  Array(4).fill(0).map((_, idx) => (
                    <motion.div
                      key={`skel-stat-${idx}`}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <SkeletonStats />
                    </motion.div>
                  ))
                ) : (
                  displayStats.map((stat, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Apple3DCard
                        className="text-center h-full"
                      >
                        <div className="p-6">
                          {/* Icon rendering fallback if icon is string name */}
                          <div className="w-8 h-8 mx-auto mb-3 text-green-400 flex justify-center items-center">
                            {/* Simple check for now, ensuring icon exists or using generic */}
                            <TrendingUp className="w-full h-full" />
                          </div>
                          <div className="text-3xl md:text-4xl font-bold text-white flex items-center justify-center">
                            <AnimatedNumber value={parseInt(stat.value) || 0} className="text-white" />
                            <span className="text-white">{stat.suffix}</span>
                          </div>
                          <p className="text-sm text-white/70 mt-1">{stat.label}</p>
                        </div>
                      </Apple3DCard>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </section>
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="About Section">
          <section id="about" className="py-20 px-6 relative">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center max-w-3xl mx-auto mb-16"
              >
                <span className="text-green-400 font-semibold text-sm uppercase tracking-wider">Why Choose Us</span>
                <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
                  Why Choose{' '}
                  <span style={{
                    background: 'linear-gradient(135deg, #ec4899, #a855f7)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    TradeX Floor Academy?
                  </span>
                </h2>
                <p className="text-gray-700 dark:text-white/80 text-lg leading-relaxed">
                  TradeX Floor Academy provide you to learn about the market from basic to advance. We guide you to become profitable trader.
                </p>
              </motion.div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {loading ? (
                  Array(5).fill(0).map((_, idx) => (
                    <motion.div
                      key={`skel-feat-${idx}`}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <SkeletonFeature />
                    </motion.div>
                  ))
                ) : (
                  displayFeatures.map((feature, idx) => {
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Apple3DCard
                          className="flex items-center gap-4 p-5 h-full"
                          glowColor={null}
                        >
                          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10">
                            <Zap className="w-6 h-6 text-green-400" />
                          </div>
                          <h3 className="text-sm md:text-base font-bold text-white leading-tight break-words">{feature.title}</h3>
                        </Apple3DCard>
                      </motion.div>
                    );
                  }))}
              </div>

              <div className="mb-20 overflow-hidden relative">
                <h3 className="text-2xl font-bold text-center mb-8">Master Key Concepts</h3>
                <div className="relative w-full overflow-hidden mask-fade-sides">
                  {/* Wrapper for infinite scroll */}
                  <div className="flex gap-6 w-max animate-scroll hover:pause">
                    {/* Quadruple the list to ensure seamless infinite scroll on wide screens */}
                    {loading ? (
                      Array(6).fill(0).map((_, idx) => (
                        <div key={`skel-topic-${idx}`} className="relative flex-shrink-0 w-[280px]">
                          <SkeletonCard className="h-[320px] w-full" />
                        </div>
                      ))
                    ) : (
                      [...keyTopics, ...keyTopics, ...keyTopics, ...keyTopics].map((topic, idx) => (
                        <div key={idx} className="relative flex-shrink-0">
                          <Apple3DCard
                            className="w-[280px] h-[320px] overflow-hidden"
                            glowColor={null}
                          >
                            {/* Background Image */}
                            <Image
                              src={topic.image}
                              alt={topic.title}
                              fill
                              className="object-cover transition-transform duration-700 group-hover:scale-110"
                              sizes="(max-width: 768px) 100vw, 280px"
                            />

                            {/* Dark Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

                            {/* Content */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                              <h4 className="text-xl font-bold text-white mb-2 leading-tight">{topic.title}</h4>
                              <p className="text-sm text-white/70 line-clamp-3 leading-relaxed">
                                {topic.desc}
                              </p>
                            </div>
                          </Apple3DCard>
                        </div>
                      )))}
                  </div>
                  {/* Add custom keyframe style if needed or rely on existing tailwind animation utilities if 'animate-scroll' exists. I will assume it needs to be added or use inline style */}
                  <style jsx>{`
              @keyframes scroll {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .animate-scroll {
                animation: scroll 20s linear infinite;
              }
              .hover\\:pause:hover {
                animation-play-state: paused;
              }
            `}</style>
                </div>
              </div>
            </div>
          </section>
        </SectionErrorBoundary>


        <SectionErrorBoundary sectionName="Courses Section">
          <section id="courses" className="py-20 px-6 relative">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center max-w-3xl mx-auto mb-16"
              >
                <span className="text-cyan-400 font-semibold text-sm uppercase tracking-wider">Our Courses</span>
                <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
                  Premium Trading{' '}
                  <span style={{
                    background: 'linear-gradient(135deg, #06b6d4, #a855f7)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    Curriculum
                  </span>
                </h2>
                <p className="text-white/60 text-lg">
                  From Zero to Hero - Choose the course that fits your trading journey
                </p>
              </motion.div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                  // Show 6 Skeleton Cards while loading
                  Array(6).fill(0).map((_, idx) => (
                    <motion.div
                      key={`skel-course-${idx}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <SkeletonCard className="h-full" />
                    </motion.div>
                  ))
                ) : (
                  courses.map((course, idx) => {
                    return (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.15 }}
                      >
                        <Apple3DCard
                          className="h-full flex flex-col overflow-hidden p-0"
                          glowColor={null}
                        >
                          <div className="relative h-48 overflow-hidden">
                            <Image
                              src={course.image}
                              alt={course.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            <div className="absolute top-4 left-4 flex gap-2">
                              <span
                                className="px-3 py-1 rounded-full text-xs font-semibold"
                                style={{
                                  background: course.type === 'PDF' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(168, 85, 247, 0.9)',
                                }}
                              >
                                {course.type === 'PDF' ? <FileText size={12} className="inline mr-1" /> : <Video size={12} className="inline mr-1" />}
                                {course.type}
                              </span>
                              {course.isBestSeller && (
                                <span
                                  className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                                  style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}
                                >
                                  <Zap size={10} fill="currentColor" /> BESTSELLER
                                </span>
                              )}
                            </div>
                            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-4 text-white/80 text-sm">
                              <span className="flex items-center gap-1"><Clock size={14} /> {course.duration}</span>
                              <span className="flex items-center gap-1"><BookOpen size={14} /> {course.lessons}</span>
                            </div>
                          </div>

                          <div className="p-6 flex-1 flex flex-col">
                            <span
                              className="text-xs font-semibold px-3 py-1 rounded-full w-fit mb-3"
                              style={{
                                background: 'rgba(0, 255, 136, 0.1)',
                                color: '#00ff88',
                                border: '1px solid rgba(0, 255, 136, 0.3)',
                              }}
                            >
                              {course.badge}
                            </span>
                            <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                            <p className="text-sm text-white/50 mb-4 flex-1">{course.desc}</p>

                            <ul className="space-y-2 mb-6">
                              {course.features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-white/70">
                                  <Check size={14} className="text-green-400" /> {feature}
                                </li>
                              ))}
                            </ul>

                            <motion.button
                              onClick={() => handleBuy(course.slug)}
                              className="w-full relative overflow-hidden group font-bold py-3 px-6 rounded-xl shadow-lg mt-auto"
                              style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                              }}
                              whileHover={{ scale: 1.02, background: 'rgba(255, 255, 255, 0.2)' }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <span className="relative z-10 flex items-center justify-center gap-2 text-white tracking-wide">
                                Buy Now <ArrowRight size={18} />
                              </span>
                            </motion.button>
                          </div>
                        </Apple3DCard>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </SectionErrorBoundary >


        {/* Student Reviews (Infinite Slider) */}
        < SectionErrorBoundary sectionName="Reviews Section" >
          <section className="py-20 px-6 relative bg-white/5 overflow-hidden">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
                <GlitchText text="Student" className="text-white mr-2" />
                <GlitchText text="Reviews" color="green" className="text-green-400" />
              </h2>
              <div className="relative w-full overflow-hidden mask-fade-sides">
                <div className="flex gap-6 w-max animate-scroll hover:pause">
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <SkeletonReview key={`skel-rev-${i}`} />
                    ))
                  ) : (
                    [...testimonials, ...testimonials, ...testimonials, ...testimonials].map((t, i) => (
                      <Apple3DCard key={i} className="min-w-[350px] flex-shrink-0">
                        <div className="p-6 h-full relative">
                          {/* Profit Badge */}
                          <div className="absolute top-4 right-4 bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded-full border border-green-500/30">
                            {t.profit}
                          </div>

                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-full border-2 border-white/10 overflow-hidden relative">
                              <Image
                                src={t.image}
                                alt={t.name}
                                fill
                                className="object-cover"
                                sizes="56px"
                              />
                            </div>
                            <div>
                              <h3 className="font-bold text-white text-lg">{t.name}</h3>
                              <p className="text-xs text-white/50 uppercase tracking-wide">{t.role}</p>
                            </div>
                          </div>
                          <p className="text-white/80 text-sm italic leading-relaxed">&quot;{t.content}&quot;</p>
                          <div className="mt-4 flex items-center gap-1 text-yellow-400">
                            {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill="currentColor" />)}
                          </div>
                        </div>
                      </Apple3DCard>
                    )))}
                </div>
              </div>
            </div>
          </section>
        </SectionErrorBoundary >

        {/* FAQ Section */}
        < FAQSection />

        {/* Video Testimonials (Hover Info) */}
        < SectionErrorBoundary sectionName="Video Testimonials" >
          <section className="py-20 px-6 relative">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                <GlitchText text="Student" className="text-white mr-2" /> <GlitchText text="Reviews" color="green" className="text-green-400" />
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <SkeletonVideo key={`skel-vid-${i}`} />
                  ))
                ) : (
                  [{
                    id: 1, name: 'Vikram Singh', profit: '₹1.2L Profit', desc: 'Recovered losses in 2 months'
                  },
                  { id: 2, name: 'Anjali Sharma', profit: '₹80k Profit', desc: 'Quit job to trade full-time' },
                  { id: 3, name: 'Rohit Verma', profit: '₹3.5L Profit', desc: 'Mastered options selling' }
                  ].map((v) => (
                    <Apple3DCard key={v.id} className="aspect-video overflow-hidden group">
                      <div className="relative h-full w-full flex items-center justify-center">
                        <div className="absolute inset-0 bg-cover bg-center opacity-60 transition-opacity duration-300 group-hover:opacity-40" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80)` }} />

                        {/* Play Button */}
                        <PlayCircle size={64} className="text-white relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:text-green-400" />

                        {/* Hover Overlay Info */}
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 text-center z-20 backdrop-blur-sm">
                          <h3 className="text-xl font-bold text-white mb-1">{v.name}</h3>
                          <span className="text-green-400 font-bold mb-2">{v.profit}</span>
                          <p className="text-sm text-white/70">&quot;{v.desc}&quot;</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              alert(`Full success story video of ${v.name} is coming soon!`);
                            }}
                            className="mt-4 px-4 py-2 bg-white/10 rounded-full text-xs font-semibold border border-white/20 hover:bg-white/20 transition-colors z-30 cursor-pointer"
                          >
                            Watch Story
                          </button>
                        </div>

                        <span className="absolute bottom-4 left-4 text-white font-bold z-10 group-hover:opacity-0 transition-opacity">Student Story #{v.id}</span>
                      </div>
                    </Apple3DCard>
                  )))}
              </div>
            </div>
          </section>
        </SectionErrorBoundary >

        {/* Contact Form Section */}
        < SectionErrorBoundary sectionName="Contact Section" >
          <section className="py-20 px-6 relative">
            <Apple3DCard className="max-w-3xl mx-auto backdrop-blur-md">
              <div className="p-8">
                <h2 className="text-3xl font-bold text-center mb-8 flex justify-center">
                  <TypewriterText text="Contact Us" className="text-white text-4xl" />
                </h2>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target;
                  const submitBtn = form.querySelector('button[type="submit"]');
                  const originalText = submitBtn.innerText;

                  submitBtn.disabled = true;
                  submitBtn.innerText = 'Sending...';

                  try {
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData.entries());

                    const res = await fetch('/api/contact', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(data),
                    });

                    const result = await res.json();

                    if (!res.ok) throw new Error(result.error || 'Failed to send message');

                    alert("Your message was received successfully!");
                    form.reset();
                  } catch (error) {
                    alert(error.message);
                  } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerText = originalText;
                  }
                }} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="contact-name" className="text-sm text-white/60">Full Name</label>
                      <input id="contact-name" name="name" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 transition-colors" placeholder="NICK FURY" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="contact-phone" className="text-sm text-white/60">Phone Number</label>
                      <input id="contact-phone" name="phone" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 transition-colors" placeholder="+91 98765 43210" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="contact-email" className="text-sm text-white/60">Email Address</label>
                    <input id="contact-email" name="email" type="email" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 transition-colors" placeholder="nickfury@shield.gov" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="contact-reason" className="text-sm text-white/60">Reason for Contact</label>
                    <select id="contact-reason" name="reason" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 transition-colors text-white/80">
                      <option className="bg-gray-900" value="course">Course Inquiry</option>
                      <option className="bg-gray-900" value="support">Support</option>
                      <option className="bg-gray-900" value="mentorship">Mentorship</option>
                      <option className="bg-gray-900" value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="contact-message" className="text-sm text-white/60">Type your message (Optional)</label>
                    <textarea id="contact-message" name="message" rows="4" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 transition-colors" placeholder="For better understanding..." />
                  </div>
                  <button type="submit" className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-blue-600 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100">
                    Send Message
                  </button>
                </form>
              </div>
            </Apple3DCard>
          </section>
        </SectionErrorBoundary >

        <footer id="contact" className="py-16 border-t border-white/5 relative">
          <div
            className="absolute inset-0 opacity-50"
            style={{
              background: 'linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent)',
            }}
          />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid md:grid-cols-4 gap-12 mb-12">
              <div className="space-y-6">
                <Link href="/" className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold">TradeX Floor</span>
                </Link>
                <p className="text-sm text-white/50 leading-relaxed">
                  TradeX Floor Academy - Best Trading Institute. Transform your trading journey from Zero to Hero.
                </p>
                <div className="flex gap-3">
                  <a href="https://instagram.com" aria-label="Follow us on Instagram" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-green-500/20 hover:text-green-400 transition-all focus-visible:ring-2 focus-visible:ring-green-400 focus:outline-none">
                    <Instagram size={18} />
                  </a>
                  <a href="https://t.me/tradexfloor" aria-label="Join our Telegram channel" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 transition-all focus-visible:ring-2 focus-visible:ring-blue-400 focus:outline-none">
                    <Send size={18} />
                  </a>
                  <a href="https://wa.me/919876543210" aria-label="Chat with us on WhatsApp" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-green-500/20 hover:text-green-400 transition-all focus-visible:ring-2 focus-visible:ring-green-400 focus:outline-none">
                    <MessageCircle size={18} />
                  </a>
                  <a href="https://youtube.com" aria-label="Subscribe to our YouTube channel" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-all focus-visible:ring-2 focus-visible:ring-red-400 focus:outline-none">
                    <Youtube size={18} />
                  </a>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-6 text-lg">Quick Links</h4>
                <ul className="space-y-3 text-sm text-white/50">
                  <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
                  <li><a href="#courses" className="hover:text-white transition-colors">Courses</a></li>
                  <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                  <li><a href="#contact" className="hover:text-white transition-colors">Contact Us</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold mb-6 text-lg">Legal</h4>
                <ul className="space-y-3 text-sm text-white/50">
                  <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
                  <li><a href="/refund" className="hover:text-white transition-colors">Refund Policy</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold mb-6 text-lg">Contact Us</h4>
                <div className="space-y-4 text-sm text-white/50">
                  <div className="flex items-center gap-3"><Mail size={16} className="text-green-400 flex-shrink-0" /><span>tradexflooracademy@gmail.com</span></div>
                  <div className="flex items-center gap-3"><Phone size={16} className="text-green-400 flex-shrink-0" /><span>+91 98765 43210</span></div>
                  <div className="flex items-center gap-3"><MapPin size={16} className="text-cyan-400 flex-shrink-0" /><span>India</span></div>
                </div>
                <div className="mt-6">
                  <h5 className="font-semibold text-sm mb-3">Follow Us</h5>
                  <p className="text-sm text-white/50">Instagram | YouTube | Telegram | WhatsApp</p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/5 text-center">
              <p className="text-sm text-white/30">© 2026 TradeX Floor Academy. All rights reserved. | Become Profitable Trader</p>
            </div>
          </div>
        </footer>
      </main >
    </>
  );
}
