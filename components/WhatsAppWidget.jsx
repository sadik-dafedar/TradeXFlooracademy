'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';

export default function WhatsAppWidget() {
    const [isHovered, setIsHovered] = useState(false);
    const whatsappNumber = '919876543210';
    const defaultMessage = 'Hi! I am interested in TradeXFloor Academy courses.';

    const handleClick = () => {
        const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultMessage)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <motion.button
                onClick={handleClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="group relative flex items-center gap-2 px-5 py-2.5 rounded-full shadow-2xl overflow-hidden"
                style={{
                    background: '#25D366', // Standard WhatsApp Green
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                    scale: { type: 'spring', stiffness: 260, damping: 20, delay: 1 }
                }}
            >

                <MessageCircle fill="white" className="w-5 h-5 text-white relative z-10" />
                <span className="text-white font-bold text-sm relative z-10 tracking-wide">
                    Chat with us
                </span>
            </motion.button>

            <style jsx global>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 1.5s infinite;
                }
            `}</style>
        </div>
    );
}
