'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, User, Mail, Calendar, Shield, Ban, UserCheck, Trash2,
    CreditCard, Package, Clock, Activity, AlertTriangle, Download,
    CheckCircle, XCircle, Eye, ChevronRight
} from 'lucide-react';

export default function UserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    const fetchUserData = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/users/${params.id}`, {
                credentials: 'include'
            });
            if (!res.ok) throw new Error('User not found');
            const data = await res.json();
            setUserData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [params.id]);

    const handleAction = async (action) => {
        if (action === 'delete') {
            setShowDeleteModal(true);
            return;
        }

        setActionLoading(action);
        try {
            const res = await fetch(`/api/admin/users/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
                credentials: 'include'
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Action failed');
            }

            await fetchUserData();
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async () => {
        setActionLoading('delete');
        try {
            const res = await fetch(`/api/admin/users/${params.id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Delete failed');
            }

            router.push('/admin/users');
        } catch (err) {
            alert(err.message);
            setShowDeleteModal(false);
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
                <p className="text-gray-400 mb-4">{error}</p>
                <Link href="/admin/users" className="text-indigo-400 hover:text-indigo-300">
                    ← Back to Users
                </Link>
            </div>
        );
    }

    const { user, stats, activityTimeline } = userData;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/users"
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{user.name || 'Unnamed User'}</h1>
                        <p className="text-gray-400">{user.email}</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    {user.isBanned ? (
                        <button
                            onClick={() => handleAction('unban')}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors disabled:opacity-50"
                        >
                            <UserCheck size={18} />
                            Unban
                        </button>
                    ) : (
                        <button
                            onClick={() => handleAction('ban')}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-600/20 text-yellow-400 rounded-lg hover:bg-yellow-600/30 transition-colors disabled:opacity-50"
                        >
                            <Ban size={18} />
                            Ban
                        </button>
                    )}

                    {user.role === 'ADMIN' ? (
                        <button
                            onClick={() => handleAction('demote')}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600/20 text-orange-400 rounded-lg hover:bg-orange-600/30 transition-colors disabled:opacity-50"
                        >
                            <Shield size={18} />
                            Demote
                        </button>
                    ) : (
                        <button
                            onClick={() => handleAction('promote')}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 text-indigo-400 rounded-lg hover:bg-indigo-600/30 transition-colors disabled:opacity-50"
                        >
                            <Shield size={18} />
                            Promote
                        </button>
                    )}

                    <button
                        onClick={() => handleAction('delete')}
                        disabled={actionLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors disabled:opacity-50"
                    >
                        <Trash2 size={18} />
                        Delete
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <CreditCard className="text-green-400" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Spent</p>
                            <p className="text-xl font-bold text-white">₹{stats.totalSpent.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <Package className="text-indigo-400" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Active Subscriptions</p>
                            <p className="text-xl font-bold text-white">{stats.activeSubscriptions}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <CheckCircle className="text-purple-400" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Completed Lessons</p>
                            <p className="text-xl font-bold text-white">{stats.completedLessons}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/20 rounded-lg">
                            <Clock className="text-orange-400" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Member Since</p>
                            <p className="text-xl font-bold text-white">{stats.joinedDaysAgo} days</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Info */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <User size={20} /> User Information
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-400">Email</p>
                            <p className="text-white">{user.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Name</p>
                            <p className="text-white">{user.name || 'Not set'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Username</p>
                            <p className="text-white">{user.username || 'Not set'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Role</p>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-700 text-gray-300'
                                }`}>
                                <Shield size={12} />
                                {user.role}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Status</p>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${user.isBanned ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                                }`}>
                                {user.isBanned ? <XCircle size={12} /> : <CheckCircle size={12} />}
                                {user.isBanned ? 'Banned' : 'Active'}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Joined</p>
                            <p className="text-white">{formatDate(user.createdAt)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Linked Accounts</p>
                            <div className="flex gap-2 mt-1">
                                {user.accounts.length > 0 ? user.accounts.map(acc => (
                                    <span key={acc.provider} className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300 capitalize">
                                        {acc.provider}
                                    </span>
                                )) : (
                                    <span className="text-gray-500">None (Email only)</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subscriptions */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Package size={20} /> Subscriptions
                    </h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {user.subscriptions.length > 0 ? user.subscriptions.map(sub => (
                            <div key={sub.id} className="p-3 bg-gray-700/50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-medium text-white text-sm">{sub.product.title}</p>
                                    <span className={`px-2 py-0.5 rounded text-xs ${sub.isActive && new Date(sub.expiryAt) > new Date()
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-gray-600 text-gray-400'
                                        }`}>
                                        {sub.isActive && new Date(sub.expiryAt) > new Date() ? 'Active' : 'Expired'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400">
                                    Expires: {formatDate(sub.expiryAt)}
                                </p>
                            </div>
                        )) : (
                            <p className="text-gray-500 text-center py-4">No subscriptions</p>
                        )}
                    </div>
                </div>

                {/* Activity Timeline */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Activity size={20} /> Activity Timeline
                    </h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {activityTimeline && activityTimeline.length > 0 ? activityTimeline.map(log => (
                            <div key={log.id} className="flex gap-3 p-3 bg-gray-700/30 rounded-lg">
                                <div className={`p-1.5 rounded ${log.outcome === 'SUCCESS' ? 'bg-green-500/20' : 'bg-red-500/20'
                                    }`}>
                                    <Activity size={14} className={
                                        log.outcome === 'SUCCESS' ? 'text-green-400' : 'text-red-400'
                                    } />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white truncate">{log.action}</p>
                                    <p className="text-xs text-gray-400 truncate">{log.details || 'No details'}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatDate(log.timestamp)}
                                    </p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-gray-500 text-center py-4">No activity recorded</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Payments History */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <CreditCard size={20} /> Payment History
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                                <th className="pb-3 font-medium">Order ID</th>
                                <th className="pb-3 font-medium">Product</th>
                                <th className="pb-3 font-medium">Amount</th>
                                <th className="pb-3 font-medium">Status</th>
                                <th className="pb-3 font-medium">Date</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {user.payments.length > 0 ? user.payments.map(payment => (
                                <tr key={payment.id} className="border-b border-gray-700/50">
                                    <td className="py-3 text-gray-300 font-mono text-xs">
                                        {payment.razorpayOrderId.slice(0, 20)}...
                                    </td>
                                    <td className="py-3 text-white">
                                        {payment.product?.title || 'N/A'}
                                    </td>
                                    <td className="py-3 text-green-400 font-medium">
                                        ₹{payment.amount.toLocaleString()}
                                    </td>
                                    <td className="py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs ${payment.status === 'COMPLETED'
                                            ? 'bg-green-500/20 text-green-400'
                                            : payment.status === 'PENDING'
                                                ? 'bg-yellow-500/20 text-yellow-400'
                                                : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {payment.status}
                                        </span>
                                    </td>
                                    <td className="py-3 text-gray-400">
                                        {formatDate(payment.createdAt)}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-500">
                                        No payments found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-red-500/20 rounded-full">
                                <AlertTriangle className="text-red-400" size={24} />
                            </div>
                            <h3 className="text-xl font-semibold text-white">Delete User</h3>
                        </div>
                        <p className="text-gray-400 mb-6">
                            Are you sure you want to permanently delete <strong className="text-white">{user.email}</strong>?
                            This will remove all their data including:
                        </p>
                        <ul className="text-sm text-gray-400 mb-6 space-y-1 ml-4">
                            <li>• All subscriptions</li>
                            <li>• All payment records</li>
                            <li>• Lesson progress</li>
                            <li>• Linked accounts</li>
                        </ul>
                        <p className="text-red-400 text-sm mb-6 font-medium">
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={actionLoading === 'delete'}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {actionLoading === 'delete' ? 'Deleting...' : 'Delete Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
