'use client';

import { motion } from 'framer-motion';
import { MonitorPlay, Zap, BrainCircuit } from 'lucide-react';

const tradingFeatures = [
    {
        icon: MonitorPlay,
        title: 'Trading Solution',
        description: 'Comprehensive trading solutions for both active day traders and new market entrants. We provide the tools you need.'
    },
    {
        icon: Zap,
        title: 'Cutting Edge Methods',
        description: 'Our aim is to help you gain confidence with modern, tested strategies that work in today\'s volatile markets.'
    },
    {
        icon: BrainCircuit,
        title: "Don't Influence",
        description: 'Master trading psychology. We teach you to take the emotion out of trading and execute with machine-like precision.'
    }
];

export default function TradingFeatures() {
    return (
        <section className="py-24 relative z-10">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid lg:grid-cols-3 gap-8">
                    {tradingFeatures.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.2 }}
                            viewport={{ once: true }}
                            className="glass-card p-10 rounded-3xl border border-white/10 text-center space-y-6 hover:-translate-y-2 transition-transform duration-500"
                        >
                            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                <feature.icon size={36} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-bold">{feature.title}</h3>
                            <p className="text-white/60 leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
