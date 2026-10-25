'use client';

import { useQuery } from '@tanstack/react-query';
import DashboardStats from '@/components/admin/DashboardStats';
import RevenueChart from '@/components/admin/RevenueChart';
import ActivityFeed from '@/components/admin/ActivityFeed';
import Link from 'next/link';
import { Plus, Users } from 'lucide-react';

const fetchStats = async () => {
    const res = await fetch('/api/admin/dashboard', {
        credentials: 'include'
    });
    if (!res.ok) {
        throw new Error('Failed to fetch stats');
    }
    return res.json();
};

export default function AdminDashboard() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['adminDashboard'],
        queryFn: fetchStats,
        refetchInterval: 60000,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-gray-400">Loading dashboard data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-red-400">
                Error loading dashboard: {error.message}
            </div>
        );
    }

    const { stats, recentActivity, charts } = data;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
                <div className="flex gap-3">
                    <Link href="/admin/users" className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium">
                        <Users size={18} />
                        View Users
                    </Link>
                    <Link href="/admin/products" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-indigo-900/20">
                        <Plus size={18} />
                        Add Product
                    </Link>
                </div>
            </div>

            {/* Stats Overview */}
            <DashboardStats stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart - Takes up 2 columns */}
                <div className="lg:col-span-2 min-h-[400px]">
                    <RevenueChart data={charts.revenue} />
                </div>

                {/* Activity Feed - Takes up 1 column */}
                <div className="min-h-[400px]">
                    <ActivityFeed activities={recentActivity} />
                </div>
            </div>
        </div>
    );
}
