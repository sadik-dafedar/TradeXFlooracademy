'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save, Plus, Trash2, Layout, Users, Star, Award, Edit3 } from 'lucide-react';

export default function SiteEditorPage() {
    const [activeTab, setActiveTab] = useState('hero');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Data States
    const [hero, setHero] = useState({});
    const [stats, setStats] = useState([]);
    const [features, setFeatures] = useState([]);
    const [testimonials, setTestimonials] = useState([]);

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const res = await fetch('/api/admin/cms');
            if (res.ok) {
                const data = await res.json();
                setHero(data.hero || {});
                setStats(data.stats || []);
                setFeatures(data.features || []);
                setTestimonials(data.testimonials || []);
            }
        } catch (error) {
            console.error('Failed to load CMS content');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveHero = async () => {
        setSaving(true);
        await updateCMS('hero', 'update', hero);
        setSaving(false);
    };

    const updateCMS = async (section, action, data, id = null) => {
        try {
            const res = await fetch('/api/admin/cms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ section, action, data, id })
            });
            if (res.ok) {
                alert('Saved successfully!');
                fetchContent(); // Refresh
            } else {
                alert('Save failed');
            }
        } catch (error) {
            console.error(error);
            alert('Error saving content');
        }
    };

    if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" /></div>;

    const tabs = [
        { id: 'hero', label: 'Hero Section', icon: Layout },
        { id: 'stats', label: 'Stats Counter', icon: Award },
        { id: 'features', label: 'Features', icon: Star },
        { id: 'testimonials', label: 'Testimonials', icon: Users },
    ];

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Site Editor (CMS)</h1>
                <a href="/" target="_blank" className="text-sm text-indigo-400 hover:text-indigo-300">View Live Site &rarr;</a>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-800 overflow-x-auto pb-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-gray-800 text-white border-b-2 border-indigo-500' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* HERO EDITOR */}
            {activeTab === 'hero' && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4 max-w-3xl">
                    <h2 className="text-lg font-semibold text-white mb-4">Edit Hero Section</h2>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Badge Text</label>
                        <input value={hero.badge || ''} onChange={e => setHero({ ...hero, badge: e.target.value })} className="w-full bg-gray-800 border-gray-700 rounded-lg p-2 text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Title Line 1</label>
                        <input value={hero.title_line1 || ''} onChange={e => setHero({ ...hero, title_line1: e.target.value })} className="w-full bg-gray-800 border-gray-700 rounded-lg p-2 text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Highlighted Title (Gradient)</label>
                        <input value={hero.title_highlight || ''} onChange={e => setHero({ ...hero, title_highlight: e.target.value })} className="w-full bg-gray-800 border-gray-700 rounded-lg p-2 text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Subtitle (Glitch Text)</label>
                        <input value={hero.subtitle || ''} onChange={e => setHero({ ...hero, subtitle: e.target.value })} className="w-full bg-gray-800 border-gray-700 rounded-lg p-2 text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                        <textarea rows={3} value={hero.description || ''} onChange={e => setHero({ ...hero, description: e.target.value })} className="w-full bg-gray-800 border-gray-700 rounded-lg p-2 text-white" />
                    </div>

                    <button onClick={handleSaveHero} disabled={saving} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium mt-4">
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Save Changes
                    </button>
                </div>
            )}

            {/* TESTIMONIALS EDITOR */}
            {activeTab === 'testimonials' && (
                <div className="space-y-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Add New Testimonial</h3>
                        <TestimonialForm onSubmit={(data) => updateCMS('testimonials', 'create', data)} />
                    </div>

                    <div className="grid gap-4">
                        {testimonials.map(t => (
                            <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-white">{t.name} <span className="text-sm font-normal text-gray-400">({t.role})</span></h4>
                                    <p className="text-gray-400 text-sm mt-1">&quot;{t.content}&quot;</p>
                                    <p className="text-green-400 text-xs mt-1 font-mono">{t.profit}</p>
                                </div>
                                <button onClick={() => { if (confirm('Delete?')) updateCMS('testimonials', 'delete', null, t.id) }} className="text-red-400 hover:text-red-300 p-2"><Trash2 size={18} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* STATS EDITOR */}
            {activeTab === 'stats' && (
                <div className="space-y-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Add New Statistic</h3>
                        <StatForm onSubmit={(data) => updateCMS('stats', 'create', data)} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {stats.map(s => (
                            <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center relative group">
                                <h4 className="text-2xl font-bold text-white">{s.value}{s.suffix}</h4>
                                <p className="text-gray-400 text-xs uppercase">{s.label}</p>
                                <button onClick={() => { if (confirm('Delete?')) updateCMS('stats', 'delete', null, s.id) }} className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* FEATURES EDITOR */}
            {activeTab === 'features' && (
                <div className="space-y-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Add Feature Card</h3>
                        <FeatureForm onSubmit={(data) => updateCMS('features', 'create', data)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {features.map(f => (
                            <div key={f.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex gap-4 items-center relative group">
                                <div className="p-3 bg-gray-800 rounded-full text-indigo-400 font-bold">{f.icon?.charAt(0)}</div>
                                <div>
                                    <h4 className="font-bold text-white">{f.title}</h4>
                                    <p className="text-gray-400 text-xs">{f.desc}</p>
                                </div>
                                <button onClick={() => { if (confirm('Delete?')) updateCMS('features', 'delete', null, f.id) }} className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function TestimonialForm({ onSubmit }) {
    const [data, setData] = useState({ name: '', role: '', content: '', profit: '', image: '/images/testimonials/default.png' });
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Name" className="bg-gray-800 border-gray-700 rounded p-2 text-white" value={data.name} onChange={e => setData({ ...data, name: e.target.value })} />
            <input placeholder="Role" className="bg-gray-800 border-gray-700 rounded p-2 text-white" value={data.role} onChange={e => setData({ ...data, role: e.target.value })} />
            <textarea placeholder="Review Content" className="bg-gray-800 border-gray-700 rounded p-2 text-white md:col-span-2" rows={2} value={data.content} onChange={e => setData({ ...data, content: e.target.value })} />
            <input placeholder="Profit (e.g. +$500)" className="bg-gray-800 border-gray-700 rounded p-2 text-white" value={data.profit} onChange={e => setData({ ...data, profit: e.target.value })} />
            <button onClick={() => onSubmit(data)} className="bg-green-600 text-white px-4 py-2 rounded">Add Review</button>
        </div>
    );
}

function StatForm({ onSubmit }) {
    const [data, setData] = useState({ label: '', value: '', suffix: '', icon: 'Users', order: 0 });
    return (
        <div className="grid grid-cols-2 gap-4">
            <input placeholder="Label (e.g. Students)" className="bg-gray-800 border-gray-700 rounded p-2 text-white" value={data.label} onChange={e => setData({ ...data, label: e.target.value })} />
            <input placeholder="Value (e.g. 1500)" className="bg-gray-800 border-gray-700 rounded p-2 text-white" value={data.value} onChange={e => setData({ ...data, value: e.target.value })} />
            <input placeholder="Suffix (e.g. +)" className="bg-gray-800 border-gray-700 rounded p-2 text-white" value={data.suffix} onChange={e => setData({ ...data, suffix: e.target.value })} />
            <button onClick={() => onSubmit(data)} className="bg-green-600 text-white px-4 py-2 rounded">Add Stat</button>
        </div>
    );
}

function FeatureForm({ onSubmit }) {
    const [data, setData] = useState({ title: '', desc: '', icon: 'Zap', order: 0 });
    return (
        <div className="grid grid-cols-1 gap-4">
            <input placeholder="Title" className="bg-gray-800 border-gray-700 rounded p-2 text-white" value={data.title} onChange={e => setData({ ...data, title: e.target.value })} />
            <input placeholder="Description" className="bg-gray-800 border-gray-700 rounded p-2 text-white" value={data.desc} onChange={e => setData({ ...data, desc: e.target.value })} />
            <button onClick={() => onSubmit(data)} className="bg-green-600 text-white px-4 py-2 rounded w-fit">Add Feature</button>
        </div>
    );
}
