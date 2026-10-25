'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Search, Trash2, Calendar, User, Phone, CheckCircle, AlertCircle, MessageSquare, Terminal, Hash, MessageCircle } from 'lucide-react';

export default function AdminMessagesPage() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const res = await fetch('/api/contact/messages');
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (error) {
            console.error('Failed to fetch messages', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredMessages = messages.filter(msg =>
        msg.name.toLowerCase().includes(search.toLowerCase()) ||
        msg.email.toLowerCase().includes(search.toLowerCase()) ||
        msg.message.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-10 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent tracking-tight uppercase">
                        Signal_Intercept.log
                    </h1>
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-mono text-cyan-500/60 mt-1">
                        <MessageCircle size={12} className="text-cyan-500 animate-pulse" />
                        External_Inquiry_Stream
                    </div>
                </div>

                <div className="relative group w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-cyan-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="SEARCH_BY_SIGNAL_DATA"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[#0a0a0c]/80 border border-white/5 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-mono text-xs placeholder:text-white/10 tracking-wider"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 border-2 border-dashed border-cyan-500/30 rounded-full animate-spin" />
                        <Terminal className="absolute inset-0 m-auto text-cyan-500/40" size={20} />
                    </div>
                    <p className="text-[10px] font-mono text-cyan-500/40 uppercase tracking-[0.5em]">Decoding_Data_Packets...</p>
                </div>
            ) : filteredMessages.length === 0 ? (
                <div className="bg-[#0a0a0c]/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5 border-dashed p-32 text-center">
                    <div className="flex flex-col items-center gap-4 text-white/10 opacity-20 uppercase font-mono">
                        <MessageSquare size={48} className="mb-2" />
                        <p className="text-[10px] tracking-[0.5em]">No_Intercepts_Recorded</p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-6">
                    <AnimatePresence>
                        {filteredMessages.map((msg, idx) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group relative bg-[#0a0a0c]/60 backdrop-blur-xl rounded-[2rem] border border-white/5 p-8 hover:border-cyan-500/30 transition-all duration-300 shadow-2xl overflow-hidden"
                            >
                                {/* Hardware ID Badge */}
                                <div className="absolute top-0 right-10 flex flex-col items-center">
                                    <div className="w-[1px] h-4 bg-cyan-500/20" />
                                    <div className="bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-b-xl">
                                        <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-tighter">SIG_{msg.id.slice(-4)}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col lg:flex-row justify-between gap-8">
                                    <div className="flex-1 space-y-6">
                                        {/* Sender info */}
                                        <div className="flex items-start gap-5">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/5 flex items-center justify-center group-hover:border-cyan-500/30 transition-all overflow-hidden relative">
                                                <User className="text-white/20 group-hover:text-cyan-400/40 transition-colors" size={28} />
                                                <div className="absolute inset-0 flex items-center justify-center font-black text-xl text-white">
                                                    {msg.name.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="font-black text-white text-lg uppercase tracking-tight group-hover:text-cyan-400 transition-colors">{msg.name}</h3>
                                                <div className="flex flex-wrap items-center gap-4 text-[10px] text-white/30 mt-1 font-mono uppercase tracking-widest">
                                                    <span className="flex items-center gap-2 text-white/50"><Mail size={12} className="text-cyan-400/40" /> {msg.email}</span>
                                                    {msg.phone && <span className="flex items-center gap-2"><Phone size={12} /> {msg.phone}</span>}
                                                    <span className="flex items-center gap-2"><Calendar size={12} /> {new Date(msg.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Message Content */}
                                        <div className="relative">
                                            <div className="absolute -left-4 top-0 bottom-0 w-[1px] bg-gradient-to-b from-cyan-500/30 via-transparent to-transparent" />
                                            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl text-[13px] leading-relaxed text-white/70 font-mono tracking-tight group-hover:bg-cyan-500/[0.02] transition-colors">
                                                {msg.message || <span className="text-white/20 italic tracking-widest">[NO_ATTACHED_PAYLOAD]</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sidebar actions/reason */}
                                    <div className="flex lg:flex-col justify-between lg:justify-start items-end lg:items-end gap-4 min-w-[140px]">
                                        <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-lg ${msg.reason === 'Support' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-purple-500/5' :
                                                msg.reason === 'Sales' ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-green-500/5' :
                                                    msg.reason === 'Partnership' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-cyan-500/5' :
                                                        'bg-white/5 text-white/40 border-white/5'
                                            }`}>
                                            {msg.reason || 'General'}
                                        </div>

                                        <button className="p-3 bg-red-500/10 text-red-500/40 hover:text-red-400 hover:bg-red-500/20 border border-white/5 hover:border-red-500/30 rounded-2xl transition-all active:scale-95 group/del">
                                            <Trash2 size={20} className="group-hover/del:scale-110 transition-transform" />
                                        </button>
                                    </div>
                                </div>

                                {/* Scanning Line Effect on Hover */}
                                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity overflow-hidden">
                                    <div className="w-full h-1 bg-cyan-500 blur-md animate-[scan_3s_linear_infinite]" />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <style jsx>{`
                @keyframes scan {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(1000%); }
                }
            `}</style>
        </div>
    );
}
