'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, AtSign, ArrowRight, Loader2, KeyRound, Sparkles, Zap, Shield, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AuthPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'
    const [loginStep, setLoginStep] = useState('credentials'); // 'credentials' | 'otp'
    const [signupStep, setSignupStep] = useState('form'); // Registration flow
    const [email, setEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState(''); // Password for login
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: ''
    });
    const [signupOtp, setSignupOtp] = useState(''); // OTP for signup verification
    const [showSignupPassword, setShowSignupPassword] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [userRole, setUserRole] = useState('USER'); // Store user role for redirect logic

    useEffect(() => {
        let interval;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    useEffect(() => {
        // Handle tab switching from URL params
        const tabParam = searchParams.get('tab');
        const signupSuccess = searchParams.get('signup') === 'success';

        if (tabParam === 'signup') {
            setActiveTab('signup');
            setSignupStep('form');
        } else if (signupSuccess) {
            setActiveTab('login');
            setLoginStep('credentials');
            setError('');
        }

        // Handle authentication errors
        const authError = searchParams.get('error');
        if (authError === 'Banned') {
            setError('ACCESS_DENIED: YOUR ACCOUNT HAS BEEN SUSPENDED BY SYSTEM ADMINISTRATOR.');
        }

        // Clear error when switching tabs
        if (tabParam || signupSuccess) {
            setError('');
        }
    }, [searchParams]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Password strength validation
    const validatePassword = (password) => {
        return {
            minLength: password.length >= 8,
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
            hasNumber: /[0-9]/.test(password),
            hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        };
    };

    const passwordChecks = validatePassword(formData.password);
    const isPasswordValid = Object.values(passwordChecks).every(Boolean);

    // ===== LOGIN HANDLERS =====
    const handleVerifyCredentials = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Validate inputs
            if (!email || !email.includes('@')) {
                throw new Error('Please enter a valid email address');
            }
            if (!loginPassword || loginPassword.length < 6) {
                throw new Error('Password must be at least 8 characters');
            }

            // Call login-init API to verify credentials and send OTP
            const res = await fetch('/api/auth/login-init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    identifier: email,
                    password: loginPassword
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Invalid email or password');
            }

            // Credentials verified, OTP sent - proceed to OTP step
            if (data.email) {
                setEmail(data.email); // Use email from response
            }
            if (data.role) {
                setUserRole(data.role); // Capture role from API
            }
            setLoginStep('otp');
            setResendTimer(30);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Validate OTP format
            if (!otp || otp.length !== 6 || !/^[0-9]{6}$/.test(otp)) {
                throw new Error('Please enter a valid 6-digit OTP');
            }

            const res = await signIn('credentials', {
                email,
                otp,
                redirect: false,
            });

            if (res?.error) {
                throw new Error(res.error || 'Invalid OTP. Please try again.');
            }

            // Successful login - redirect based on role
            if (userRole === 'ADMIN' || (activeTab === 'login' && email === 'partham302@gmail.com')) {
                router.push('/admin');
            } else {
                const destination = searchParams.get('callbackUrl') || '/dashboard';
                router.push(destination);
            }
            router.refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ===== SIGNUP HANDLER =====
    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Validate form data
            if (!formData.name || formData.name.trim().length < 2) {
                throw new Error('Name must be at least 2 characters');
            }

            if (!formData.username || formData.username.trim().length < 3) {
                throw new Error('Username must be at least 3 characters');
            }

            if (!formData.email || !formData.email.includes('@')) {
                throw new Error('Please enter a valid email address');
            }

            if (!formData.password || !isPasswordValid) {
                throw new Error('Password does not meet all requirements');
            }

            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                // Handle specific registration errors
                if (res.status === 400) {
                    if (data.error?.includes('Email already registered')) {
                        throw new Error('This email is already registered. Please login instead.');
                    } else if (data.error?.includes('Username already taken')) {
                        throw new Error('Username already taken. Please choose another.');
                    }
                }
                throw new Error(data.error || 'Registration failed');
            }

            // Registration successful - OTP sent, move to OTP verification step
            setSignupStep('otp');
            setResendTimer(30);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle Resend OTP
    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        setLoading(true);
        setError('');

        try {
            const identifier = activeTab === 'login' ? email : formData.email;
            const password = activeTab === 'login' ? loginPassword : formData.password;

            const res = await fetch('/api/auth/login-init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to resend OTP');

            setResendTimer(30);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle Signup OTP Verification
    const handleSignupVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!signupOtp || signupOtp.length !== 6) {
                throw new Error('Please enter the 6-digit OTP sent to your email');
            }

            // Verify OTP and complete signup using NextAuth signIn
            const res = await signIn('credentials', {
                email: formData.email,
                otp: signupOtp,
                redirect: false,
            });

            if (res?.error) {
                throw new Error(res.error || 'Invalid OTP. Please try again.');
            }

            // Successful signup - redirect to dashboard
            router.push('/dashboard');
            router.refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        const destination = searchParams.get('callbackUrl') || '/dashboard';
        signIn('google', { callbackUrl: destination });
    };

    return (
        <div className="min-h-screen bg-[#050510] flex items-center justify-center p-4 relative overflow-hidden text-white font-sans selection:bg-pink-500/30">
            {/* 2050 Cyber-Grid Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(236,72,153,0.12),transparent_70%)]" />
                <div
                    className="absolute inset-0 opacity-[0.1]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(59,130,246,0.15) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(59,130,246,0.15) 1px, transparent 1px)`,
                        backgroundSize: '50px 50px',
                        maskImage: 'radial-gradient(ellipse at center, black, transparent 80%)'
                    }}
                />

                {/* Moving perspective grid */}
                <div className="absolute inset-0 [perspective:1000px]">
                    <motion.div
                        animate={{ rotateX: [20, 25, 20] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 origin-bottom"
                    >
                        <div
                            className="absolute bottom-0 w-full h-[200%] opacity-20"
                            style={{
                                backgroundImage: `linear-gradient(to bottom, transparent, #06b6d4 1px),
                                                  linear-gradient(to right, transparent, #06b6d4 1px)`,
                                backgroundSize: '60px 60px',
                                transform: 'rotateX(60deg) translateY(-50%)'
                            }}
                        />
                    </motion.div>
                </div>

                {/* Floating Orbs - Pink & Blue */}
                <div className="absolute -top-20 -left-20 w-96 h-96 bg-pink-500/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-xl relative z-10"
            >
                {/* Outer Glow Wrapper */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-blue-500 to-pink-500 rounded-[2.5rem] blur opacity-40 group-hover:opacity-60 transition duration-500" />

                    <div className="relative bg-[#0a0a0c]/90 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">

                        {/* Back Button */}
                        <button
                            onClick={() => router.back()}
                            className="absolute top-6 left-6 z-30 p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-pink-400 hover:border-pink-500/50 transition-all group"
                            title="Return to Previous"
                        >
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        </button>

                        {/* Scanning Line Animation */}
                        <motion.div
                            animate={{ top: ['-10%', '110%'] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-pink-400/40 to-transparent z-20 pointer-events-none"
                        />

                        {/* Top Branding Section */}
                        <div className="relative mb-10 text-center">
                            <Link href="/" className="inline-block relative mb-6">
                                <div className="absolute inset-0 bg-cyan-500/50 blur-2xl rounded-full" />
                                <motion.div
                                    whileHover={{ rotateY: 180 }}
                                    transition={{ duration: 0.6 }}
                                    className="relative bg-gradient-to-br from-pink-500/20 to-blue-500/20 p-4 rounded-2xl border border-white/20 backdrop-blur-md"
                                >
                                    <Shield className="w-10 h-10 text-pink-400" />
                                </motion.div>
                            </Link>
                            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-400 via-white to-blue-400 bg-clip-text text-transparent mb-2">
                                USER ACCESS TERMINAL
                            </h1>
                            <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] font-mono text-white/40">
                                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-blue-500 animate-pulse" />
                                Secure Authentication
                            </div>
                        </div>

                        {/* Tab Selector - Futuristic Hardware Style */}
                        <div className="flex bg-black/40 rounded-2xl p-1.5 border border-white/5 mb-8 relative">
                            {['login', 'signup'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => {
                                        setActiveTab(tab);
                                        setError('');
                                        if (tab === 'login') {
                                            setLoginStep('credentials');
                                            setOtp('');
                                            setLoginPassword('');
                                        } else {
                                            setSignupStep('form');
                                            setFormData({ name: '', username: '', email: '', password: '' });
                                        }
                                    }}
                                    className={`flex-1 py-4 px-6 rounded-xl font-bold text-xs uppercase tracking-widest transition-all relative overflow-hidden ${activeTab === tab ? 'text-pink-400' : 'text-white/40 hover:text-white/70'
                                        }`}
                                >
                                    {activeTab === tab && (
                                        <motion.div
                                            layoutId="activeTab2050"
                                            className="absolute inset-0 bg-pink-500/10 border border-pink-500/30 rounded-xl"
                                            transition={{ type: "spring", bounce: 0.3, duration: 0.8 }}
                                        >
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-cyan-400 shadow-[0_0_10px_#06b6d4]" />
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-cyan-400 shadow-[0_0_10px_#06b6d4]" />
                                        </motion.div>
                                    )}
                                    <span className="relative z-10">{tab}</span>
                                </button>
                            ))}
                        </div>

                        {/* Error Portal */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono uppercase tracking-wider flex items-center gap-3"
                                >
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Form Area */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`${activeTab}-${loginStep}-${signupStep}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.4 }}
                                className="space-y-6"
                            >
                                {activeTab === 'login' ? (
                                    // LOGIN FORM
                                    <>
                                        {loginStep === 'credentials' ? (
                                            <form onSubmit={handleVerifyCredentials} className="space-y-6">
                                                <CyberInput
                                                    id="email"
                                                    label="Email or Username"
                                                    type="text"
                                                    placeholder="Enter email or username"
                                                    icon={<Mail />}
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value.trim())}
                                                    required
                                                />
                                                <div className="relative">
                                                    <CyberInput
                                                        id="loginPassword"
                                                        label="Password"
                                                        type={showLoginPassword ? 'text' : 'password'}
                                                        placeholder="Enter your password"
                                                        icon={<Lock />}
                                                        value={loginPassword}
                                                        onChange={(e) => setLoginPassword(e.target.value)}
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                                                        className="absolute right-4 top-[38px] text-white/40 hover:text-cyan-400 transition-colors"
                                                    >
                                                        {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                                <CyberButton loading={loading} text="VERIFY & SEND OTP" />
                                                <div className="text-center mt-4">
                                                    <Link href="/forgot-password"
                                                        className="inline-block px-6 py-2 rounded-xl border border-pink-500/30 bg-pink-500/10 text-pink-400 text-sm font-medium hover:bg-pink-500/20 hover:border-pink-500/50 transition-all"
                                                    >
                                                        Forgot Password?
                                                    </Link>
                                                </div>
                                            </form>
                                        ) : (
                                            <form onSubmit={handleLogin} className="space-y-6">
                                                <div className="flex justify-between items-end mb-1">
                                                    <span className="text-[10px] uppercase tracking-widest text-cyan-500/60 font-mono">Payload: {email}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setLoginStep('credentials');
                                                            setOtp('');
                                                        }}
                                                        className="text-[10px] uppercase tracking-widest text-pink-400 hover:text-pink-300 transition-colors"
                                                    >
                                                        Abort_Sequence
                                                    </button>
                                                </div>
                                                <CyberInput
                                                    id="otp"
                                                    label="OTP Code (6 digits)"
                                                    type="text"
                                                    placeholder="000000"
                                                    icon={<KeyRound />}
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                                    required
                                                    className="tracking-[1em] text-center font-black"
                                                />
                                                <CyberButton loading={loading} text="VERIFY & LOGIN" />
                                                <div className="text-center">
                                                    <button
                                                        type="button"
                                                        onClick={handleResendOtp}
                                                        disabled={resendTimer > 0 || loading}
                                                        className={`px-6 py-2 rounded-xl text-xs font-medium uppercase tracking-widest transition-all border ${resendTimer > 0
                                                            ? 'border-white/10 bg-white/5 text-white/30 cursor-not-allowed'
                                                            : 'border-pink-500/30 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 hover:border-pink-500/50 hover:shadow-[0_0_15px_rgba(236,72,153,0.3)]'
                                                            }`}
                                                    >
                                                        {resendTimer > 0 ? `Resend In ${resendTimer}s` : 'Resend OTP Code'}
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </>
                                ) : (
                                    // SIGNUP FORM
                                    <>
                                        {signupStep === 'form' ? (
                                            <form onSubmit={handleSignup} className="space-y-5">
                                                <CyberInput
                                                    label="Display Name"
                                                    name="name"
                                                    id="name"
                                                    placeholder="Enter your full name"
                                                    icon={<User />}
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    required
                                                />
                                                <CyberInput
                                                    label="Username"
                                                    name="username"
                                                    id="username"
                                                    placeholder="Choose a unique username"
                                                    icon={<AtSign />}
                                                    value={formData.username}
                                                    onChange={handleChange}
                                                    required
                                                />
                                                <CyberInput
                                                    label="Email Address"
                                                    name="email"
                                                    id="signup-email"
                                                    type="email"
                                                    placeholder="Enter your email address"
                                                    icon={<Mail />}
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    required
                                                />
                                                <div className="relative">
                                                    <CyberInput
                                                        label="Password"
                                                        name="password"
                                                        id="password"
                                                        type={showSignupPassword ? 'text' : 'password'}
                                                        placeholder="Minimum 8 characters"
                                                        icon={<Lock />}
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                                                        className="absolute right-4 top-[38px] text-white/40 hover:text-cyan-400 transition-colors"
                                                    >
                                                        {showSignupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                                {/* Password Strength Indicator */}
                                                {formData.password && (
                                                    <div className="space-y-2 p-3 rounded-xl bg-white/5 border border-white/10">
                                                        <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Password Requirements</p>
                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                            <div className={`flex items-center gap-2 ${passwordChecks.minLength ? 'text-green-400' : 'text-white/30'}`}>
                                                                <span>{passwordChecks.minLength ? '✓' : '•'}</span>
                                                                <span>8+ characters</span>
                                                            </div>
                                                            <div className={`flex items-center gap-2 ${passwordChecks.hasUppercase ? 'text-green-400' : 'text-white/30'}`}>
                                                                <span>{passwordChecks.hasUppercase ? '✓' : '•'}</span>
                                                                <span>Uppercase (A-Z)</span>
                                                            </div>
                                                            <div className={`flex items-center gap-2 ${passwordChecks.hasLowercase ? 'text-green-400' : 'text-white/30'}`}>
                                                                <span>{passwordChecks.hasLowercase ? '✓' : '•'}</span>
                                                                <span>Lowercase (a-z)</span>
                                                            </div>
                                                            <div className={`flex items-center gap-2 ${passwordChecks.hasNumber ? 'text-green-400' : 'text-white/30'}`}>
                                                                <span>{passwordChecks.hasNumber ? '✓' : '•'}</span>
                                                                <span>Number (0-9)</span>
                                                            </div>
                                                            <div className={`flex items-center gap-2 col-span-2 ${passwordChecks.hasSpecial ? 'text-green-400' : 'text-white/30'}`}>
                                                                <span>{passwordChecks.hasSpecial ? '✓' : '•'}</span>
                                                                <span>Special character (!@#$%^&*)</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                <p className="text-[10px] text-white/30 text-center">
                                                    An OTP will be sent to your email for verification
                                                </p>
                                                <CyberButton loading={loading} text="CREATE ACCOUNT" disabled={!isPasswordValid && formData.password.length > 0} />
                                            </form>
                                        ) : (
                                            // SIGNUP OTP VERIFICATION STEP
                                            <form onSubmit={handleSignupVerifyOtp} className="space-y-6">
                                                <div className="text-center mb-4">
                                                    <p className="text-cyan-400 text-sm">OTP sent to: {formData.email}</p>
                                                    <p className="text-white/40 text-xs mt-1">Check your inbox & spam folder</p>
                                                </div>
                                                <CyberInput
                                                    id="signupOtp"
                                                    label="Enter OTP (6 digits)"
                                                    type="text"
                                                    placeholder="000000"
                                                    icon={<KeyRound />}
                                                    value={signupOtp}
                                                    onChange={(e) => setSignupOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                                    required
                                                    className="tracking-[1em] text-center font-black"
                                                />
                                                <CyberButton loading={loading} text="VERIFY & COMPLETE SIGNUP" />
                                                <div className="text-center mb-4">
                                                    <button
                                                        type="button"
                                                        onClick={handleResendOtp}
                                                        disabled={resendTimer > 0 || loading}
                                                        className={`px-6 py-2 rounded-xl text-xs font-medium uppercase tracking-widest transition-all border ${resendTimer > 0
                                                            ? 'border-white/10 bg-white/5 text-white/30 cursor-not-allowed'
                                                            : 'border-pink-500/30 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 hover:border-pink-500/50 hover:shadow-[0_0_15px_rgba(236,72,153,0.3)]'
                                                            }`}
                                                    >
                                                        {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP Code'}
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSignupStep('form');
                                                        setSignupOtp('');
                                                    }}
                                                    className="w-full text-center text-[10px] uppercase tracking-widest text-pink-400 hover:text-pink-300 transition-colors"
                                                >
                                                    ← Go Back & Edit Details
                                                </button>
                                            </form>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Social Proxy Section */}
                        <div className="mt-10 pt-10 border-t border-white/5 relative">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 bg-[#0a0a0c] text-[9px] uppercase tracking-[0.4em] text-white/20 font-mono whitespace-nowrap">
                                External Identity Proxies
                            </div>

                            <motion.button
                                onClick={handleGoogleLogin}
                                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full h-14 rounded-xl border border-white/10 flex items-center justify-center gap-4 transition-all group overflow-hidden relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span className="text-xs uppercase tracking-[0.3em] font-bold text-white/50 group-hover:text-white transition-colors">
                                    Authenticate via Google.Proxy
                                </span>
                            </motion.button>
                        </div>
                    </div>
                </div>

                {/* Legal / versioning footer */}
                <div className="mt-8 flex justify-between px-4 text-[9px] uppercase tracking-widest text-white/20 font-mono">
                    <span>© TRADEXFLOOR_INTL</span>
                    <span>ENCRYPTION: 1024_RSA</span>
                </div>
            </motion.div>
        </div>
    );
}

// ===== REUSABLE 2050 COMPONENTS =====

function CyberOrb({ color, size, position, duration }) {
    return (
        <motion.div
            animate={{
                x: [0, 50, -50, 0],
                y: [0, -50, 50, 0],
                scale: [1, 1.1, 0.9, 1]
            }}
            transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute ${size} ${position} rounded-full blur-[120px] opacity-20 pointer-events-none ${color === 'cyan' ? 'bg-cyan-500' : 'bg-purple-600'
                }`}
        />
    );
}

function CyberInput({ icon, label, id, className = '', ...props }) {
    const [focused, setFocused] = useState(false);

    return (
        <div className="space-y-2 relative group/field">
            <div className="flex justify-between items-center ml-1">
                <label htmlFor={id} className="text-sm font-semibold text-white group-focus-within/field:text-pink-400 transition-colors">
                    {label}
                </label>
                <div className={`w-1.5 h-1.5 rounded-full ${focused ? 'bg-pink-400 animate-pulse shadow-[0_0_5px_#ec4899]' : 'bg-white/30'}`} />
            </div>
            <div className="relative overflow-hidden rounded-xl border border-white/20 group-focus-within/field:border-pink-500/60 transition-all duration-300 bg-white/[0.05]">
                {/* Inner hardware decoration */}
                <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-pink-500/0 group-focus-within/field:border-pink-500/50 transition-all" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-pink-500/0 group-focus-within/field:border-pink-500/50 transition-all" />

                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within/field:text-pink-400 transition-colors z-10">
                    {icon}
                </div>

                <input
                    {...props}
                    id={id}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className={`w-full bg-transparent py-4 pl-14 pr-4 text-base font-medium text-white 
                               outline-none placeholder:text-white/40 group-focus-within/field:bg-pink-500/5 transition-all
                               ${className}`}
                />
            </div>
        </div>
    );
}

function CyberButton({ loading, text, className = '' }) {
    return (
        <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`w-full h-16 rounded-2xl relative overflow-hidden group/btn ${className} ${loading ? 'opacity-70 cursor-wait' : ''}`}
        >
            {/* Holographic BG */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-purple-700 group-hover/btn:from-cyan-500 group-hover/btn:to-purple-600 transition-colors duration-500" />

            {/* Glitch Overlay */}
            <motion.div
                animate={{ opacity: [0, 0.1, 0, 0.2, 0.1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-white"
            />

            {/* Content Markup */}
            <div className="relative z-10 flex items-center justify-center gap-3">
                {loading ? (
                    <Loader2 className="animate-spin w-5 h-5 text-white/90" />
                ) : (
                    <>
                        <span className="text-xs font-black uppercase tracking-[0.4em] text-white dropshadow-sm">
                            {text}
                        </span>
                        <ArrowRight className="w-4 h-4 text-white group-hover/btn:translate-x-2 transition-transform duration-300" />
                    </>
                )}
            </div>

            {/* Bottom hardware edge */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 group-hover/btn:bg-cyan-400 shadow-[0_0_10px_#06b6d4] transition-colors" />
        </motion.button>
    );
}
