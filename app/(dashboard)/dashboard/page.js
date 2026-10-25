'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
    Play, FileText, Lock, Check, Loader2,
    User, Mail, Key, Settings, Calendar,

    ChevronRight, Award, CreditCard, Video, File, ShoppingCart, Home, Link2,
    Camera, AtSign, Shield
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { useTheme } from 'next-themes';
import LinkedAccounts from '@/components/LinkedAccounts';
import GlobalLoader from '@/components/GlobalLoader';

function DashboardContent() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const [products, setProducts] = useState([]);
    const [myCourses, setMyCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('courses');
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Check for deep link to shop tab
        const tab = searchParams.get('tab');
        if (tab === 'shop') setActiveTab('shop');
    }, [searchParams]);

    // Profile data from API (for correct createdAt)
    const [profileData, setProfileData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodRes, subRes, profileRes] = await Promise.all([
                    fetch('/api/products'),
                    fetch('/api/user/my-courses'),
                    fetch('/api/user/profile')
                ]);

                if (prodRes.ok) setProducts(await prodRes.json());
                if (subRes.ok) setMyCourses(await subRes.json());
                if (profileRes.ok) setProfileData(await profileRes.json());
            } catch (error) {
                console.error('Fetch Error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleBuy = async (productId) => {
        if (!session) return alert('Please login first');

        // Check if Razorpay key is configured
        const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (!razorpayKey) {
            alert('Payment system is not configured. Please contact support.');
            console.error('Missing NEXT_PUBLIC_RAZORPAY_KEY_ID environment variable');
            return;
        }

        try {
            const res = await fetch('/api/payments/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `Payment server error: ${res.status}`);
            }

            const order = await res.json();

            if (order.error) throw new Error(order.error);

            // Check if Razorpay SDK is loaded
            if (!window.Razorpay) {
                throw new Error('Payment gateway not loaded. Please refresh and try again.');
            }

            const options = {
                key: razorpayKey,
                amount: order.amount,
                currency: order.currency,
                name: "TradeXFloor Academy",
                description: "Course Purchase",
                order_id: order.id,
                handler: async function (response) {
                    try {
                        // Call verify API to complete payment and create subscription
                        const verifyRes = await fetch('/api/payments/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        const verifyData = await verifyRes.json();

                        if (verifyRes.ok && verifyData.success) {
                            alert('✅ Payment verified! You now have access to the course.');
                            window.location.reload();
                        } else {
                            throw new Error(verifyData.error || 'Verification failed');
                        }
                    } catch (error) {
                        console.error('Payment verification error:', error);
                        alert(`⚠️ Payment received (ID: ${response.razorpay_payment_id}) but verification pending. Please contact support if access is not granted within 5 minutes.`);
                        window.location.reload();
                    }
                },
                modal: {
                    ondismiss: function () {
                        console.log('Payment modal closed');
                    }
                },
                theme: { color: "#10B981" }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                alert('Payment failed: ' + response.error.description);
            });
            rzp.open();

        } catch (error) {
            console.error('Payment Error:', error);
            alert('Payment initialization failed: ' + error.message);
        }
    };

    const isPurchased = (productId) => {
        return myCourses.some(sub => sub.productId === productId && sub.isActive);
    };

    // Profile editing
    const [editingName, setEditingName] = useState(false);
    const [newName, setNewName] = useState(session?.user?.name || '');
    const [savingProfile, setSavingProfile] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const handleUpdateProfile = async () => {
        try {
            setSavingProfile(true);
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            });
            if (res.ok) {
                const updated = await res.json();
                setProfileData(prev => ({ ...prev, ...updated }));
                alert('Profile updated! Changes will reflect after re-login.');
                setEditingName(false);
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to update');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSavingProfile(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (max 100KB)
        if (file.size > 100 * 1024) {
            alert('Image too large! Maximum size is 100KB.');
            return;
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        try {
            setUploadingImage(true);

            // Convert to base64
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const base64Image = event.target.result;

                    const res = await fetch('/api/user/profile', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image: base64Image })
                    });

                    if (res.ok) {
                        const updated = await res.json();
                        setProfileData(prev => ({ ...prev, ...updated }));
                        alert('Profile photo updated!');
                    } else {
                        const err = await res.json();
                        alert(err.error || 'Failed to upload image');
                    }
                } catch (error) {
                    console.error('Image upload error:', error);
                    alert('Failed to upload image');
                } finally {
                    setUploadingImage(false);
                }
            };
            reader.onerror = () => {
                alert('Failed to read image file');
                setUploadingImage(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error(error);
            setUploadingImage(false);
        }
    };

    const handleLogout = () => {
        localStorage.setItem('logout-event', Date.now());
        signOut({ callbackUrl: '/' });
    };

    const isDark = true; // Force dark mode

    // Calculate content stats
    const videoCourses = myCourses.filter(c => c.product?.type === 'VIDEO_COURSE');
    const pdfCourses = myCourses.filter(c => c.product?.type === 'PDF');
    const hasContent = myCourses.length > 0;

    if (loading) {
        return <GlobalLoader />;
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />

            {/* Fixed Header */}
            <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b bg-black/80 border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-lg shadow-pink-500/20 group-hover:scale-105 transition-transform relative">
                            <Image src="/neon_bull_charge_with_financial_ascent.png" alt="TradeXFloor" fill className="object-cover" />
                        </div>
                        <span className={`font-bold text-sm sm:text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            TradeXFloor
                        </span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${isDark ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                        >
                            <Home size={18} />
                            <span className="hidden sm:inline">Home</span>
                        </Link>
                        {session?.user?.role === 'ADMIN' && (
                            <Link
                                href="/admin/dashboard"
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${isDark ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                            >
                                <Shield size={18} />
                                <span className="hidden sm:inline">Admin Panel</span>
                            </Link>
                        )}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-6 pt-24">
                {/* Content Stats Bar - TOP */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl border p-4 mb-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}
                >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            My Dashboard
                        </h1>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
                                    <Video size={20} className="text-green-500" />
                                </div>
                                <div>
                                    <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{videoCourses.length}</div>
                                    <div className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Videos</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                                    <File size={20} className="text-blue-500" />
                                </div>
                                <div>
                                    <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{pdfCourses.length}</div>
                                    <div className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>PDFs</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-pink-500/20' : 'bg-pink-100'}`}>
                                    <Award size={20} className="text-pink-500" />
                                </div>
                                <div>
                                    <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{myCourses.length}</div>
                                    <div className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Total</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Profile Section */}
                <div className="grid lg:grid-cols-3 gap-6 mb-10">
                    {/* User Profile Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`lg:col-span-1 rounded-2xl border overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}
                    >
                        <div className="h-24 bg-gradient-to-br from-pink-500/30 via-purple-500/30 to-blue-500/30 relative">
                            <div className="absolute -bottom-10 left-6">
                                <div className="relative group">
                                    {/* Profile Image or Initial */}
                                    {profileData?.image || session?.user?.image ? (
                                        <Image
                                            src={profileData?.image || session?.user?.image}
                                            alt="Profile"
                                            width={80}
                                            height={80}
                                            unoptimized
                                            className="rounded-full object-cover border-4 border-black shadow-xl"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white border-4 border-black shadow-xl">
                                            {profileData?.name?.[0]?.toUpperCase() || session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                    )}
                                    {/* Upload Button Overlay */}
                                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                        {uploadingImage ? (
                                            <Loader2 size={20} className="animate-spin text-white" />
                                        ) : (
                                            <Camera size={20} className="text-white" />
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            disabled={uploadingImage}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 pt-14">
                            <div className="mb-4">
                                {editingName ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className={`border rounded-lg px-3 py-2 text-sm flex-1 ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-gray-100 border-gray-200 text-gray-900'}`}
                                            placeholder="Enter your name"
                                        />
                                        <button
                                            onClick={handleUpdateProfile}
                                            disabled={savingProfile}
                                            className="px-3 py-2 bg-green-500/20 text-green-500 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                                        >
                                            {savingProfile ? '...' : 'Save'}
                                        </button>
                                        <button
                                            onClick={() => setEditingName(false)}
                                            className="px-3 py-2 bg-red-500/20 text-red-500 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {session?.user?.name || 'User'}
                                        </h2>
                                        <button
                                            onClick={() => { setNewName(session?.user?.name || ''); setEditingName(true); }}
                                            className="text-xs text-pink-500 hover:text-pink-400 transition-colors"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className={`flex items-center gap-3 text-sm mb-2 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                                <Mail size={16} />
                                <span className="truncate">{session?.user?.email || 'No email'}</span>
                            </div>

                            {/* Username - Always show, readonly */}
                            <div className={`flex items-center justify-between text-sm mb-2 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                                <div className="flex items-center gap-3">
                                    <AtSign size={16} />
                                    <span>{profileData?.username || session?.user?.username || 'No username'}</span>
                                </div>
                                <Lock size={12} className={`${isDark ? 'text-white/30' : 'text-gray-400'}`} title="Username cannot be changed" />
                            </div>

                            {/* Join Date - Use profileData from API */}
                            <div className={`flex items-center gap-3 text-sm mb-6 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                                <Calendar size={16} />
                                <span>Joined {new Date(profileData?.createdAt || session?.user?.createdAt || Date.now()).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} • {new Date(profileData?.createdAt || session?.user?.createdAt || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>

                            <div className={`grid grid-cols-2 gap-3 pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                <div className={`text-center p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                    <div className="text-2xl font-bold text-green-500">{myCourses.length}</div>
                                    <div className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Courses</div>
                                </div>
                                <div className={`text-center p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                    <div className="text-2xl font-bold text-pink-500">{hasContent ? 'Active' : 'Free'}</div>
                                    <div className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Status</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className={`lg:col-span-2 rounded-2xl border p-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}
                    >
                        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            <Settings size={20} className="text-pink-500" />
                            Account Settings
                        </h3>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => { setNewName(session?.user?.name || ''); setEditingName(true); }}
                                className={`flex items-center gap-4 p-4 rounded-xl transition-colors text-left group ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                                    <User size={20} className="text-blue-500" />
                                </div>
                                <div className="flex-1">
                                    <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Edit Profile</div>
                                    <div className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Update your name</div>
                                </div>
                                <ChevronRight size={18} className={`transition-colors ${isDark ? 'text-white/30 group-hover:text-white/60' : 'text-gray-300 group-hover:text-gray-500'}`} />
                            </button>

                            <Link
                                href="/forgot-password"
                                className={`flex items-center gap-4 p-4 rounded-xl transition-colors text-left group ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                                    <Key size={20} className="text-purple-500" />
                                </div>
                                <div className="flex-1">
                                    <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Change Password</div>
                                    <div className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Reset your password</div>
                                </div>
                                <ChevronRight size={18} className={`transition-colors ${isDark ? 'text-white/30 group-hover:text-white/60' : 'text-gray-300 group-hover:text-gray-500'}`} />
                            </Link>

                            <button
                                onClick={() => setActiveTab('courses')}
                                className={`flex items-center gap-4 p-4 rounded-xl transition-colors text-left group ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
                                    <CreditCard size={20} className="text-green-500" />
                                </div>
                                <div className="flex-1">
                                    <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>My Purchases</div>
                                    <div className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{myCourses.length} courses owned</div>
                                </div>
                                <ChevronRight size={18} className={`transition-colors ${isDark ? 'text-white/30 group-hover:text-white/60' : 'text-gray-300 group-hover:text-gray-500'}`} />
                            </button>

                            <button
                                onClick={() => setActiveTab('shop')}
                                className={`flex items-center gap-4 p-4 rounded-xl transition-colors text-left group ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
                                    <ShoppingCart size={20} className="text-orange-500" />
                                </div>
                                <div className="flex-1">
                                    <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Browse Courses</div>
                                    <div className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Explore new content</div>
                                </div>
                                <ChevronRight size={18} className={`transition-colors ${isDark ? 'text-white/30 group-hover:text-white/60' : 'text-gray-300 group-hover:text-gray-500'}`} />
                            </button>
                        </div>

                        {/* Linked Accounts Section */}
                        <div className={`mt-6 pt-6 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                            <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                                <Link2 size={16} className="text-pink-500" />
                                Connected Login Methods
                            </h4>
                            <LinkedAccounts />
                        </div>
                    </motion.div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('courses')}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${activeTab === 'courses' ? 'bg-pink-500/20 text-pink-500' : (isDark ? 'bg-white/5 text-white/60 hover:text-white' : 'bg-gray-100 text-gray-600 hover:text-gray-900')}`}
                    >
                        My Courses
                    </button>
                    <button
                        onClick={() => setActiveTab('shop')}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${activeTab === 'shop' ? 'bg-pink-500/20 text-pink-500' : (isDark ? 'bg-white/5 text-white/60 hover:text-white' : 'bg-gray-100 text-gray-600 hover:text-gray-900')}`}
                    >
                        Browse Courses
                    </button>
                </div>

                {/* Content based on tab */}
                {activeTab === 'courses' && (
                    <section>
                        <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            <Check className="text-green-500" /> My Purchases
                        </h2>
                        {myCourses.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myCourses.map((sub) => (
                                    <motion.div
                                        key={sub.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-6 rounded-2xl border relative overflow-hidden group ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}
                                    >
                                        <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-semibold ${sub.product?.type === 'VIDEO_COURSE' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                            {sub.product?.type === 'VIDEO_COURSE' ? '📹 Video' : '📄 PDF'}
                                        </div>
                                        <h3 className={`text-lg font-bold mb-2 pr-16 ${isDark ? 'text-white' : 'text-gray-900'}`}>{sub.product?.title}</h3>
                                        <p className={`text-sm mb-4 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                                            Expires: {new Date(sub.expiryAt).toLocaleDateString()}
                                        </p>
                                        <Link
                                            href={`/course/${sub.product?.id}`}
                                            className="block w-full text-center bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-pink-500/20"
                                        >
                                            {sub.product?.type === 'VIDEO_COURSE' ? '▶ Watch Now' : '📄 View PDF'}
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`text-center py-16 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}
                            >
                                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                                    <ShoppingCart size={40} className={`${isDark ? 'text-white/30' : 'text-gray-300'}`} />
                                </div>
                                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    No Content Purchased Yet
                                </h3>
                                <p className={`max-w-md mx-auto mb-6 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                                    You haven&apos;t purchased any video courses or PDFs yet. Browse our collection to start learning!
                                </p>
                                <button
                                    onClick={() => setActiveTab('shop')}
                                    className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-pink-500/20 transition-all"
                                >
                                    🛒 Browse Courses
                                </button>
                            </motion.div>
                        )}
                    </section>
                )}

                {activeTab === 'shop' && (
                    <section>
                        <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            <ShoppingCart className="text-pink-500" /> Available Courses
                        </h2>
                        {products.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.map((product) => {
                                    const purchased = isPurchased(product.id);
                                    return (
                                        <motion.div
                                            key={product.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`p-6 rounded-2xl border flex flex-col ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}
                                        >
                                            <div className={`h-40 rounded-xl mb-4 relative overflow-hidden flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                                {product.type === 'VIDEO_COURSE' ? (
                                                    <Play size={40} className={`${isDark ? 'text-white/20' : 'text-gray-300'}`} />
                                                ) : (
                                                    <FileText size={40} className={`${isDark ? 'text-white/20' : 'text-gray-300'}`} />
                                                )}
                                                <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold ${product.type === 'VIDEO_COURSE' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                                    {product.type === 'VIDEO_COURSE' ? '📹 Video' : '📄 PDF'}
                                                </div>
                                            </div>
                                            <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{product.title}</h3>
                                            <p className={`text-sm mb-4 flex-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{product.description || 'No description'}</p>

                                            <div className="flex justify-between items-center mt-4">
                                                <span className="text-xl font-bold text-pink-500">₹{product.price}</span>
                                                {purchased ? (
                                                    <Link
                                                        href={`/course/${product.id}`}
                                                        className="px-4 py-2 rounded-xl bg-green-500/20 text-green-500 text-sm font-bold hover:bg-green-500/30 transition-colors"
                                                    >
                                                        ✓ Access
                                                    </Link>
                                                ) : (
                                                    <button
                                                        onClick={() => handleBuy(product.id)}
                                                        className="px-6 py-2 rounded-xl text-sm font-bold text-white shadow-lg shadow-pink-500/20 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition-all"
                                                    >
                                                        Buy Now
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className={`text-center py-12 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                                <p className={`${isDark ? 'text-white/50' : 'text-gray-500'}`}>No courses available yet. Check back soon!</p>
                            </div>
                        )}


                    </section>
                )}
            </div>
        </div>
    );
}

export default function UserDashboard() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 bg-opacity-10">
                <Loader2 className="animate-spin text-pink-500" size={40} />
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}
