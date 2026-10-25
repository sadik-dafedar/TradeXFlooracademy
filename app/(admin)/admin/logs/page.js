'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Search, Filter, Download, RefreshCw, Calendar, Activity,
    CheckCircle, XCircle, User, Package, CreditCard, Settings,
    ChevronLeft, ChevronRight
} from 'lucide-react';

const ACTION_COLORS = {
    ADMIN_LOGIN: 'bg-green-500/20 text-green-400',
    ADMIN_LOGOUT: 'bg-gray-500/20 text-gray-400',
    LOGIN_FAILED: 'bg-red-500/20 text-red-400',
    USER_VIEW: 'bg-blue-500/20 text-blue-400',
    USER_CREATE: 'bg-green-500/20 text-green-400',
    USER_UPDATE: 'bg-yellow-500/20 text-yellow-400',
    USER_DELETE: 'bg-red-500/20 text-red-400',
    USER_BAN: 'bg-orange-500/20 text-orange-400',
    USER_UNBAN: 'bg-green-500/20 text-green-400',
    USER_PROMOTE: 'bg-purple-500/20 text-purple-400',
    USER_DEMOTE: 'bg-orange-500/20 text-orange-400',
    PRODUCT_CREATE: 'bg-green-500/20 text-green-400',
    PRODUCT_UPDATE: 'bg-yellow-500/20 text-yellow-400',
    PRODUCT_DELETE: 'bg-red-500/20 text-red-400',
    SETTINGS_UPDATE: 'bg-indigo-500/20 text-indigo-400',
    CACHE_CLEAR: 'bg-cyan-500/20 text-cyan-400',
    CMS_UPDATE: 'bg-pink-500/20 text-pink-400',
    DEFAULT: 'bg-gray-500/20 text-gray-400',
};

const TARGET_ICONS = {
    User: User,
    Product: Package,
    Payment: CreditCard,
    Settings: Settings,
    DEFAULT: Activity,
};

export default function AuditLogsPage() {
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
    const [actionTypes, setActionTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        action: '',
        targetType: '',
        outcome: '',
        startDate: '',
        endDate: '',
    });
    const [showFilters, setShowFilters] = useState(false);

    const fetchLogs = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString(),
            });

            if (filters.search) params.set('search', filters.search);
            if (filters.action) params.set('action', filters.action);
            if (filters.targetType) params.set('targetType', filters.targetType);
            if (filters.outcome) params.set('outcome', filters.outcome);
            if (filters.startDate) params.set('startDate', filters.startDate);
            if (filters.endDate) params.set('endDate', filters.endDate);

            const res = await fetch(`/api/admin/logs?${params}`, {
                credentials: 'include'
            });
            const data = await res.json();

            setLogs(data.logs || []);
            setPagination(data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
            setActionTypes(data.actionTypes || []);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.limit]);

    useEffect(() => {
        fetchLogs(1);
    }, [fetchLogs]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchLogs(1);
    };

    const handleExport = async () => {
        const params = new URLSearchParams({ export: 'json' });
        if (filters.search) params.set('search', filters.search);
        if (filters.action) params.set('action', filters.action);

        window.open(`/api/admin/logs?${params}`, '_blank');
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getActionColor = (action) => ACTION_COLORS[action] || ACTION_COLORS.DEFAULT;

    const getTargetIcon = (targetType) => {
        const Icon = TARGET_ICONS[targetType] || TARGET_ICONS.DEFAULT;
        return <Icon size={14} />;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
                    <p className="text-gray-400 text-sm">Track all admin actions and system events</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchLogs(pagination.page)}
                        className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <Download size={18} />
                        Export
                    </button>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                            placeholder="Search by email or details..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${showFilters ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        <Filter size={18} />
                        Filters
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Search
                    </button>
                </form>

                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                            <label className="text-sm text-gray-400 block mb-1">Action</label>
                            <select
                                value={filters.action}
                                onChange={(e) => setFilters(f => ({ ...f, action: e.target.value }))}
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                            >
                                <option value="">All Actions</option>
                                {actionTypes.map(action => (
                                    <option key={action} value={action}>{action}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 block mb-1">Target Type</label>
                            <select
                                value={filters.targetType}
                                onChange={(e) => setFilters(f => ({ ...f, targetType: e.target.value }))}
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                            >
                                <option value="">All Types</option>
                                <option value="User">User</option>
                                <option value="Product">Product</option>
                                <option value="Payment">Payment</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 block mb-1">Outcome</label>
                            <select
                                value={filters.outcome}
                                onChange={(e) => setFilters(f => ({ ...f, outcome: e.target.value }))}
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                            >
                                <option value="">All</option>
                                <option value="SUCCESS">Success</option>
                                <option value="FAILURE">Failure</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 block mb-1">Start Date</label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 block mb-1">End Date</label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Logs Table */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-gray-400 text-sm border-b border-gray-700 bg-gray-800/50">
                                <th className="px-4 py-3 font-medium">Timestamp</th>
                                <th className="px-4 py-3 font-medium">Actor</th>
                                <th className="px-4 py-3 font-medium">Action</th>
                                <th className="px-4 py-3 font-medium">Target</th>
                                <th className="px-4 py-3 font-medium">Details</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center">
                                        <div className="flex items-center justify-center gap-2 text-gray-400">
                                            <RefreshCw size={18} className="animate-spin" />
                                            Loading logs...
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                        No audit logs found
                                    </td>
                                </tr>
                            ) : logs.map(log => (
                                <tr key={log.id} className="border-b border-gray-700/50 hover:bg-gray-800/30">
                                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                                        {formatDate(log.timestamp)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                                <User size={12} className="text-indigo-400" />
                                            </div>
                                            <span className="text-white truncate max-w-[150px]">
                                                {log.actorEmail || 'System'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {log.targetType ? (
                                            <span className="flex items-center gap-1 text-gray-300">
                                                {getTargetIcon(log.targetType)}
                                                {log.targetType}
                                            </span>
                                        ) : (
                                            <span className="text-gray-500">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-300 max-w-[250px] truncate" title={log.details}>
                                        {log.details || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {log.outcome === 'SUCCESS' ? (
                                            <span className="flex items-center gap-1 text-green-400">
                                                <CheckCircle size={14} />
                                                Success
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-red-400">
                                                <XCircle size={14} />
                                                Failed
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
                        <p className="text-sm text-gray-400">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchLogs(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                                className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="text-gray-400 text-sm">Page {pagination.page}/{pagination.totalPages}</span>
                            <button
                                onClick={() => fetchLogs(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages}
                                className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
