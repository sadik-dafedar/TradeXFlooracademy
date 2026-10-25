'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, CheckCircle, Globe, CreditCard, Zap, Shield, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [settings, setSettings] = useState({
        siteName: '',
        siteDescription: '',
        supportEmail: '',
        razorpayMode: 'test',
        defaultValidityDays: 90,
        enableEmailNotifications: false,
        enableNewUserWelcome: false,
        maintenanceMode: false
    });
    const [fetchLoading, setFetchLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/admin/settings');
                if (res.ok) {
                    const data = await res.json();
                    if (data) setSettings(prev => ({ ...prev, ...data }));
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            } finally {
                setFetchLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (!res.ok) throw new Error('Failed to save');

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Save failed:', error);
            alert('Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    if (fetchLoading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-indigo-500" size={40} />
            <p className="text-sm text-gray-500">Loading Configuration...</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">System Settings</h1>
                    <p className="text-sm text-gray-400 mt-1">Manage global configurations and preferences</p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 className="animate-spin" size={18} />
                    ) : saved ? (
                        <>
                            <CheckCircle size={18} /> Saved
                        </>
                    ) : (
                        <>
                            <Save size={18} /> Save Changes
                        </>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* General Settings */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                            <Globe size={20} />
                        </div>
                        <h2 className="text-lg font-semibold text-white">General Information</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Site Name</label>
                            <input
                                type="text"
                                value={settings.siteName}
                                onChange={(e) => handleChange('siteName', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Meta Description</label>
                            <textarea
                                value={settings.siteDescription}
                                onChange={(e) => handleChange('siteDescription', e.target.value)}
                                rows={3}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Support Email</label>
                            <input
                                type="email"
                                value={settings.supportEmail}
                                onChange={(e) => handleChange('supportEmail', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Payment Settings */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                            <CreditCard size={20} />
                        </div>
                        <h2 className="text-lg font-semibold text-white">Payment Gateway</h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-3">Razorpay Mode</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => handleChange('razorpayMode', 'test')}
                                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${settings.razorpayMode === 'test'
                                        ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500'
                                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                                        }`}
                                >
                                    Sandbox (Test)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleChange('razorpayMode', 'live')}
                                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${settings.razorpayMode === 'live'
                                        ? 'bg-green-500/10 border-green-500 text-green-500'
                                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                                        }`}
                                >
                                    Production (Live)
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Default Validity (Days)</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    value={settings.defaultValidityDays}
                                    onChange={(e) => handleChange('defaultValidityDays', parseInt(e.target.value))}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                                />
                                <span className="text-xs text-gray-500 whitespace-nowrap">Standard: 90 Days</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Automation */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                            <Zap size={20} />
                        </div>
                        <h2 className="text-lg font-semibold text-white">Automation</h2>
                    </div>

                    <div className="space-y-4">
                        {[
                            { key: 'enableEmailNotifications', label: 'Email Notifications', sub: 'Receive alerts for new purchases' },
                            { key: 'enableNewUserWelcome', label: 'Welcome Emails', sub: 'Send onboarding email to new users' }
                        ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium text-white">{item.label}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings[item.key]}
                                        onChange={() => handleChange(item.key, !settings[item.key])}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Security */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
                        <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                            <Shield size={20} />
                        </div>
                        <h2 className="text-lg font-semibold text-white">Security & Maintenance</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-red-400">Maintenance Mode</p>
                                <p className="text-xs text-red-500/60 mt-0.5">Restrict access to admins only</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.maintenanceMode}
                                    onChange={() => handleChange('maintenanceMode', !settings.maintenanceMode)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                            </label>
                        </div>

                        <div className="p-4 bg-gray-800/50 rounded-lg flex gap-3">
                            <AlertTriangle className="text-yellow-500 shrink-0" size={20} />
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Ensure <span className="text-white font-mono">RAZORPAY_SIGNATURE</span> is verified in your environment variables before switching to Production mode.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
