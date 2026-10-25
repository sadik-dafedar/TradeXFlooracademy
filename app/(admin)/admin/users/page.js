'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Search, Loader2, Download, CheckCircle, XCircle, ChevronLeft, ChevronRight, Filter, Users, Calendar, Shield, Trash2, UserPlus, UserMinus, Eye } from 'lucide-react';
import { debounce } from '@/lib/pagination';
import { useBulkSelection, BulkActionConfirmation, BULK_ACTIONS } from '@/lib/bulk-operations';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        role: 'all',
        status: 'all'
    });

    // Pagination state
    const [pagination, setPagination] = useState({
        currentPage: 1,
        pageSize: 20,
        totalCount: 0,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
    });

    // Bulk operations
    const {
        selectedItems,
        isSelected,
        toggleItem,
        toggleSelectAll,
        clearSelection,
        selectedCount,
        hasSelection
    } = useBulkSelection(users);

    const [bulkAction, setBulkAction] = useState(null);
    const [showBulkConfirm, setShowBulkConfirm] = useState(false);

    // Debounced search
    const debouncedSearch = useMemo(
        () => debounce((value) => {
            setSearch(value);
            setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page on search
        }, 300),
        []
    );

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.currentPage.toString(),
                limit: pagination.pageSize.toString(),
                search,
                role: filters.role,
                status: filters.status
            });

            const res = await fetch(`/api/admin/users?${params}`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data.data);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('Failed to load users', error);
        } finally {
            setLoading(false);
        }
    }, [pagination.currentPage, pagination.pageSize, search, filters]);

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, currentPage: newPage }));
    };

    const updateUser = async (userId, data) => {
        if (!confirm('Are you sure you want to modify this user?')) return;
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, ...data }),
                credentials: 'include'
            });
            if (res.ok) fetchUsers();
        } catch (error) {
            alert('Update failed');
        }
    };

    const handleBulkAction = async (action) => {
        setBulkAction(action);
        setShowBulkConfirm(true);
    };

    const executeBulkAction = async () => {
        if (!bulkAction || selectedItems.length === 0) return;

        setLoading(true);
        setShowBulkConfirm(false);

        try {
            // Process bulk actions
            const promises = selectedItems.map(userId => {
                switch (bulkAction) {
                    case BULK_ACTIONS.BAN:
                        return updateUser(userId, { isBanned: true });
                    case BULK_ACTIONS.UNBAN:
                        return updateUser(userId, { isBanned: false });
                    case BULK_ACTIONS.PROMOTE:
                        return updateUser(userId, { role: 'ADMIN' });
                    case BULK_ACTIONS.DEMOTE:
                        return updateUser(userId, { role: 'USER' });
                    default:
                        return Promise.resolve();
                }
            });

            await Promise.all(promises);
            clearSelection();
            fetchUsers();
        } catch (error) {
            console.error('Bulk operation failed:', error);
            alert('Bulk operation failed');
        } finally {
            setLoading(false);
            setBulkAction(null);
        }
    };

    const exportUsers = () => {
        const headers = ['Name', 'Email', 'Role', 'Status', 'Joined', 'Subscriptions', 'Payments'];
        const rows = users.map(u => [
            u.name || 'No Name',
            u.email,
            u.role,
            u.isBanned ? 'Banned' : u.isVerified ? 'Verified' : 'Unverified',
            new Date(u.createdAt).toLocaleDateString(),
            u._count?.subscriptions || 0,
            u._count?.payments || 0
        ]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `users_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {/* Header with Search and Filters */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <h1 className="text-2xl font-bold text-white">User Management</h1>

                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[250px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            onChange={(e) => debouncedSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 w-full"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2">
                        <select
                            value={filters.role}
                            onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value, currentPage: 1 }))}
                            className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                        >
                            <option value="all">All Roles</option>
                            <option value="USER">Users</option>
                            <option value="ADMIN">Admins</option>
                        </select>

                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, currentPage: 1 }))}
                            className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                        >
                            <option value="all">All Status</option>
                            <option value="verified">Verified</option>
                            <option value="unverified">Unverified</option>
                            <option value="banned">Banned</option>
                            <option value="active">Active</option>
                        </select>

                        <button
                            onClick={exportUsers}
                            className="p-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 text-gray-300"
                            title="Export CSV"
                        >
                            <Download size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {hasSelection && (
                <div className="bg-indigo-900/20 border border-indigo-800 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-indigo-400 font-medium">
                                {selectedCount} user{selectedCount !== 1 ? 's' : ''} selected
                            </span>
                            <button
                                onClick={clearSelection}
                                className="text-sm text-indigo-300 hover:text-indigo-200"
                            >
                                Clear selection
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleBulkAction(BULK_ACTIONS.BAN)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded border border-red-700 flex items-center gap-2"
                            >
                                <Shield size={14} /> Ban Selected
                            </button>

                            <button
                                onClick={() => handleBulkAction(BULK_ACTIONS.UNBAN)}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded border border-green-700 flex items-center gap-2"
                            >
                                <Shield size={14} /> Unban Selected
                            </button>

                            <button
                                onClick={() => handleBulkAction(BULK_ACTIONS.PROMOTE)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded border border-blue-700 flex items-center gap-2"
                            >
                                <UserPlus size={14} /> Make Admin
                            </button>

                            <button
                                onClick={() => handleBulkAction(BULK_ACTIONS.DEMOTE)}
                                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded border border-yellow-700 flex items-center gap-2"
                            >
                                <UserMinus size={14} /> Demote Admin
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <Users className="text-blue-500" size={20} />
                        <div>
                            <p className="text-2xl font-bold text-white">{pagination.totalCount}</p>
                            <p className="text-xs text-gray-400">Total Users</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="text-green-500" size={20} />
                        <div>
                            <p className="text-2xl font-bold text-white">
                                {users.filter(u => u.isVerified && !u.isBanned).length}
                            </p>
                            <p className="text-xs text-gray-400">Active</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <Shield className="text-red-500" size={20} />
                        <div>
                            <p className="text-2xl font-bold text-white">
                                {users.filter(u => u.isBanned).length}
                            </p>
                            <p className="text-xs text-gray-400">Banned</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <Calendar className="text-purple-500" size={20} />
                        <div>
                            <p className="text-2xl font-bold text-white">
                                {users.filter(u => u.role === 'ADMIN').length}
                            </p>
                            <p className="text-xs text-gray-400">Admins</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-indigo-500" size={32} />
                </div>
            ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-800 text-gray-400 text-xs uppercase font-medium">
                                <tr>
                                    <th className="px-6 py-4 w-12">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.length === users.length && users.length > 0}
                                            onChange={toggleSelectAll}
                                            className="rounded border-gray-600 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </th>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Activity</th>
                                    <th className="px-6 py-4">Joined</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800 text-sm text-gray-300">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-800/50">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={isSelected(user.id)}
                                                onChange={() => toggleItem(user.id)}
                                                className="rounded border-gray-600 text-indigo-600 focus:ring-indigo-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{user.name || 'No Name'}</div>
                                            <div className="text-gray-500 text-xs">{user.email}</div>
                                            {user.username && (
                                                <div className="text-gray-600 text-xs">@{user.username}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'ADMIN'
                                                ? 'bg-indigo-500/10 text-indigo-400'
                                                : 'bg-gray-700/30 text-gray-400'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.isBanned ? (
                                                <span className="flex items-center gap-2 text-red-400 text-xs">
                                                    <XCircle size={14} /> Banned
                                                </span>
                                            ) : user.isVerified ? (
                                                <span className="flex items-center gap-2 text-green-400 text-xs">
                                                    <CheckCircle size={14} /> Verified
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2 text-yellow-400 text-xs">
                                                    <XCircle size={14} /> Unverified
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-gray-400">
                                                <div>Subscriptions: {user._count?.subscriptions || 0}</div>
                                                <div>Payments: {user._count?.payments || 0}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={`/admin/users/${user.id}`}
                                                    className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 rounded border border-indigo-600/30 text-xs text-indigo-400 flex items-center gap-1"
                                                >
                                                    <Eye size={12} /> View
                                                </Link>
                                                <button
                                                    onClick={() => updateUser(user.id, { role: user.role === 'ADMIN' ? 'USER' : 'ADMIN' })}
                                                    className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 text-xs"
                                                >
                                                    {user.role === 'ADMIN' ? 'Demote' : 'Make Admin'}
                                                </button>
                                                <button
                                                    onClick={() => updateUser(user.id, { isBanned: !user.isBanned })}
                                                    className={`px-3 py-1 rounded border text-xs ${user.isBanned
                                                        ? 'bg-green-900/20 border-green-900 text-green-400 hover:bg-green-900/30'
                                                        : 'bg-red-900/20 border-red-900 text-red-400 hover:bg-red-900/30'
                                                        }`}
                                                >
                                                    {user.isBanned ? 'Unban' : 'Ban'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="border-t border-gray-800 px-6 py-4 flex items-center justify-between">
                        <div className="text-sm text-gray-400">
                            Showing {(pagination.currentPage - 1) * pagination.pageSize + 1} to{' '}
                            {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} of{' '}
                            {pagination.totalCount} users
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={!pagination.hasPrev}
                                className="p-2 rounded-lg border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                    const pageNum = i + 1;
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`w-8 h-8 rounded-lg text-sm ${pagination.currentPage === pageNum
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                {pagination.totalPages > 5 && (
                                    <span className="text-gray-500 px-2">...</span>
                                )}
                            </div>

                            <button
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={!pagination.hasNext}
                                className="p-2 rounded-lg border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Action Confirmation Modal */}
            <BulkActionConfirmation
                action={bulkAction}
                itemCount={selectedCount}
                onConfirm={executeBulkAction}
                onCancel={() => {
                    setShowBulkConfirm(false);
                    setBulkAction(null);
                }}
                isOpen={showBulkConfirm}
            />
        </div>
    );
}
