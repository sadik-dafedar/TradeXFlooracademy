'use client';

import { motion } from 'framer-motion';
import { Wallet, Users, Award, PieChart, BarChart2, Briefcase } from 'lucide-react';

const benefits = [
    {
        icon: Wallet,
        title: 'Direct Activation Bonus',
        description: 'Earn Activation Bonus on sharing the platform referral link with your friends and network.'
    },
    {
        icon: Users,
        title: 'Matching Income',
        description: 'Grow your network and earn matching income when you balance your team growth efficiently.'
    },
    {
        icon: Award,
        title: 'Rank Bonus',
        description: 'Unlock exclusive rank bonuses and rewards as you achieve new milestones in your journey.'
    },
    {
        icon: PieChart,
        title: 'Direct Profit Sharing',
        description: 'Keep earning from the unique Profit Sharing feature, exclusively designed for our community.'
    },
    {
        icon: BarChart2,
        title: 'Rank Profit Sharing',
        description: 'Earn additional profit sharing dividends based on your achieved rank tiers.'
    },
    {
        icon: Briefcase,
        title: 'Brokerage Rewards',
        description: 'Earn per lot brokerage rebates like never before with our partner programs.'
    }
];

export default function BenefitsSection() {
    return (
        <section className="py-24 relative z-10">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-widest">Rewards & Income</h2>
                    <h3 className="text-3xl md:text-5xl font-bold">Multiple Ways to Earn</h3>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {benefits.map((benefit, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                            className="glass-card p-8 rounded-2xl border border-white/5 relative overflow-hidden group hover:shadow-2xl hover:shadow-purple-500/20 transition-all"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <benefit.icon size={100} />
                            </div>

                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mb-6">
                                    <benefit.icon size={24} className="text-cyan-400" />
                                </div>
                                <h4 className="text-xl font-bold mb-3">{benefit.title}</h4>
                                <p className="text-white/60 text-sm">
                                    {benefit.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
