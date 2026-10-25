'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Clock,
    Headphones,
    Smartphone,
    ShieldCheck,
    Plus,
    Minus,
    HelpCircle
} from 'lucide-react';
import { GlitchText } from '@/components/ui/text-effects';
import SectionErrorBoundary from '@/components/SectionErrorBoundary';

const faqData = [
    {
        question: "Who is this course for?",
        answer: "This course is designed for everyone—from complete beginners who have never traded before to experienced traders looking to refine their strategies with SMC and Price Action concepts. We start from the basics and take you to an advanced professional level.",
        icon: Users
    },
    {
        question: "Do I get lifetime access?",
        answer: "Yes! Once you enroll, you get lifetime access to the course content, including any future updates we add to the curriculum. You can learn at your own pace and revisit lessons whenever you need.",
        icon: Clock
    },
    {
        question: "Is support included?",
        answer: "Absolutely. We pride ourselves on our 24/7 mentor support. You'll get access to our exclusive discord community where you can ask questions, share charts, and get live guidance from mentors and successfully profitable students.",
        icon: Headphones
    },
    {
        question: "Can I watch on mobile?",
        answer: "Yes, our platform is fully optimized for mobile devices (Android & iOS). You can watch lectures, track your progress, and even join live sessions directly from your smartphone or tablet.",
        icon: Smartphone
    },
    {
        question: "What if I'm not satisfied?",
        answer: "We offer a transparent refund policy. If you find the course content doesn't match the description or value promised, you can request a refund within the first 7 days of purchase (terms apply—primarily that you haven't consumed more than 20% of the content).",
        icon: ShieldCheck
    }
];

export default function FAQSection() {
    const [openIndex, setOpenIndex] = useState(0);

    return (
        <SectionErrorBoundary sectionName="FAQ Section">
            <section className="py-20 px-6 relative overflow-hidden" id="faq">
                {/* Ambient Background Glows */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-5xl mx-auto relative z-10">
                    <div className="text-center mb-16 space-y-4">
                        <span className="text-sm font-semibold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 uppercase">
                            Common Questions
                        </span>
                        <h2 className="text-3xl md:text-5xl font-bold flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4">
                            <span className="text-white">Everything You</span>
                            <span className="relative">
                                <GlitchText text="Need to Know" className="text-green-400" />
                                <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50" />
                            </span>
                        </h2>
                        <p className="text-white/60 text-lg max-w-2xl mx-auto">
                            Got specific questions? We&apos;ve got answers to help you start your trading journey with confidence.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {faqData.map((item, index) => {
                            const isOpen = openIndex === index;
                            const Icon = item.icon || HelpCircle;

                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <motion.div
                                        onClick={() => setOpenIndex(isOpen ? -1 : index)}
                                        className={`
                      group relative overflow-hidden rounded-2xl border cursor-pointer transition-all duration-500
                      ${isOpen
                                                ? 'bg-white/10 border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.15)]'
                                                : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
                                            }
                    `}
                                    >
                                        {/* Active Gradient Border Overlay */}
                                        {isOpen && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-purple-500/5 pointer-events-none" />
                                        )}

                                        {/* Question Header */}
                                        <div className="relative p-6 md:p-8 flex items-center gap-6 z-10">
                                            {/* Icon Container */}
                                            <div className={`
                        flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500
                        ${isOpen
                                                    ? 'bg-gradient-to-br from-green-500 to-emerald-700 text-white shadow-lg scale-110'
                                                    : 'bg-white/5 text-white/50 group-hover:bg-white/10 group-hover:text-white'
                                                }
                      `}>
                                                <Icon size={24} />
                                            </div>

                                            <span className={`flex-1 text-lg md:text-xl font-semibold transition-colors duration-300 ${isOpen ? 'text-white' : 'text-white/90 group-hover:text-white'}`}>
                                                {item.question}
                                            </span>

                                            {/* Expand/Collapse Toggle */}
                                            <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300
                        ${isOpen
                                                    ? 'border-green-500 bg-green-500/20 text-green-400 rotate-180'
                                                    : 'border-white/20 text-white/40 group-hover:border-white/40 group-hover:text-white'
                                                }
                      `}>
                                                {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                                            </div>
                                        </div>

                                        {/* Answer Content */}
                                        <AnimatePresence initial={false}>
                                            {isOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                >
                                                    <div className="px-6 pb-6 md:px-8 md:pb-8 pl-[5.5rem] md:pl-[6.5rem]">
                                                        <p className="text-white/70 leading-relaxed text-base md:text-lg border-l-2 border-white/10 pl-6">
                                                            {item.answer}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </SectionErrorBoundary>
    );
}
