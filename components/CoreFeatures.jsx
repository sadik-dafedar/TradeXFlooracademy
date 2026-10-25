'use client';

import { motion } from 'framer-motion';
import { Users, BookOpen, TrendingUp, ShieldCheck } from 'lucide-react';

const features = [
    {
        icon: Users,
        title: 'Expert Instructors',
        description: 'Learn from industry experts with proven track records, ensuring you receive top-notch education and insights.'
    },
    {
        icon: BookOpen,
        title: 'Interactive Learning',
        description: 'Engage in hands-on learning experiences through our interactive courses designed to demystify complex currency markets concepts.'
    },
    {
        icon: TrendingUp,
        title: 'Cutting-edge Curriculum',
        description: 'Stay ahead of the curve with our up-to-date curriculum that reflects the latest trends and advancements in the market.'
    },
    {
        icon: ShieldCheck,
        title: 'Our Commitment',
        description: 'We are dedicated to your success. We are here not just to impart knowledge but to empower you to navigate financial markets.'
    }
];

export default function CoreFeatures() {
    return (
        <section className="py-24 relative z-10">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-sm font-semibold text-pink-500 uppercase tracking-widest">About TradeX Floor Academy</h2>
                    <h3 className="text-3xl md:text-5xl font-bold">Empowering Your Trading Journey</h3>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                            className="glass-card p-8 rounded-2xl border border-white/5 hover:border-purple-500/50 hover:bg-white/5 transition-all group"
                        >
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <feature.icon size={28} className="text-white" />
                            </div>
                            <h4 className="text-xl font-bold mb-4">{feature.title}</h4>
                            <p className="text-white/60 leading-relaxed text-sm">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
