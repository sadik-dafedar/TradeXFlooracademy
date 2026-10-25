'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Users, Package, DollarSign, Settings,
    LogOut, Menu, X, Shield, ChevronRight, Layout, FileText
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import Breadcrumbs from '@/components/admin/Breadcrumbs';

const sidebarGroups = [
    {
        title: 'Overview',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
            { icon: Users, label: 'Users', href: '/admin/users' },
        ]
    },
    {
        title: 'Commerce',
        items: [
            { icon: Package, label: 'Products', href: '/admin/products' },
            { icon: DollarSign, label: 'Payments', href: '/admin/payments' },
        ]
    },
    {
        title: 'System',
        items: [
            { icon: Layout, label: 'Site Editor', href: '/admin/site-editor' },
            { icon: FileText, label: 'Audit Logs', href: '/admin/logs' },
            { icon: Settings, label: 'Settings', href: '/admin/settings' },
        ]
    }
];

export default function AdminLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const pathname = usePathname();

    // Close mobile sidebar on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    return (
        <div className="flex h-screen bg-gray-950 text-white font-sans">
            {/* Mobile Backdrop */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed md:relative inset-y-0 left-0 bg-gray-900 border-r border-gray-800 transition-all duration-300 z-30 flex flex-col
                    ${isSidebarOpen ? 'w-64' : 'w-20'}
                    ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
                `}
            >
                {/* Brand */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-indigo-600 rounded-lg shrink-0">
                            <Shield size={20} className="text-white" />
                        </div>
                        {(isSidebarOpen || isMobileOpen) && (
                            <span className="font-bold text-lg tracking-wide whitespace-nowrap">Admin Panel</span>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-6 overflow-y-auto custom-scrollbar">
                    {sidebarGroups.map((group, groupIndex) => (
                        <div key={groupIndex}>
                            {(isSidebarOpen || isMobileOpen) && (
                                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    {group.title}
                                </h3>
                            )}
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const isActive = pathname.startsWith(item.href);
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${isActive
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                                }`}
                                            title={(!isSidebarOpen && !isMobileOpen) ? item.label : ''}
                                        >
                                            <item.icon size={20} className={isActive ? 'text-white' : 'group-hover:text-indigo-400 transition-colors'} />
                                            {(isSidebarOpen || isMobileOpen) && (
                                                <span className="text-sm font-medium">{item.label}</span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-gray-800">
                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all ${(!isSidebarOpen && !isMobileOpen) && 'justify-center'}`}
                    >
                        <LogOut size={20} />
                        {(isSidebarOpen || isMobileOpen) && <span className="text-sm font-medium">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden w-full">
                {/* Header */}
                <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 md:px-6">
                    <div className="flex items-center gap-4">
                        {/* Mobile Toggle */}
                        <button
                            onClick={() => setIsMobileOpen(!isMobileOpen)}
                            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors md:hidden"
                        >
                            <Menu size={20} />
                        </button>

                        {/* Desktop Toggle */}
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="hidden md:block p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                        >
                            {isSidebarOpen ? <Menu size={20} /> : <ChevronRight size={20} />}
                        </button>

                        <div className="hidden md:block">
                            <Breadcrumbs />
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-950">
                    <div className="md:hidden mb-4">
                        <Breadcrumbs />
                    </div>
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
