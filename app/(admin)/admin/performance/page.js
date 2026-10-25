'use client';

import { useState, useEffect } from 'react';
import { 
    Activity, 
    Database, 
    Zap, 
    Clock, 
    AlertTriangle, 
    TrendingUp, 
    TrendingDown,
    Server,
    HardDrive,
    Wifi,
    Users
} from 'lucide-react';

export default function PerformanceDashboard() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('24h');

    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [timeRange]);

    const fetchMetrics = async () => {
        try {
            const res = await fetch('/api/performance');
            if (res.ok) {
                const data = await res.json();
                setMetrics(data);
            }
        } catch (error) {
            console.error('Failed to fetch metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="text-center py-20">
                <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
                <p className="text-gray-400">Unable to load performance metrics</p>
            </div>
        );
    }

    const { summary, api, database, cache, frontend } = metrics;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Performance Dashboard</h1>
                <div className="flex items-center gap-4">
                    <select 
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2"
                    >
                        <option value="1h">Last Hour</option>
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Total Requests</p>
                            <p className="text-2xl font-bold text-white">{summary.totalRequests.toLocaleString()}</p>
                        </div>
                        <Activity className="h-8 w-8 text-blue-500" />
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Avg Response Time</p>
                            <p className="text-2xl font-bold text-white">{summary.avgResponseTime.toFixed(0)}ms</p>
                        </div>
                        <Clock className="h-8 w-8 text-green-500" />
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Cache Hit Rate</p>
                            <p className="text-2xl font-bold text-white">{summary.cacheHitRate}</p>
                        </div>
                        <Zap className="h-8 w-8 text-yellow-500" />
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Database Health</p>
                            <p className={`text-2xl font-bold ${
                                summary.dbHealth === 'HEALTHY' ? 'text-green-500' :
                                summary.dbHealth === 'WARNING' ? 'text-yellow-500' : 'text-red-500'
                            }`}>
                                {summary.dbHealth}
                            </p>
                        </div>
                        <Database className="h-8 w-8 text-purple-500" />
                    </div>
                </div>
            </div>

            {/* API Performance */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl">
                <div className="p-6 border-b border-gray-800">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Server className="h-5 w-5" />
                        API Performance
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-800 text-gray-400 text-sm">
                            <tr>
                                <th className="px-6 py-3 text-left">Endpoint</th>
                                <th className="px-6 py-3 text-left">Requests</th>
                                <th className="px-6 py-3 text-left">Avg Time</th>
                                <th className="px-6 py-3 text-left">Max Time</th>
                                <th className="px-6 py-3 text-left">Success Rate</th>
                                <th className="px-6 py-3 text-left">Slow Reqs</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {api.endpoints.slice(0, 10).map((endpoint, index) => (
                                <tr key={index} className="hover:bg-gray-800/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                endpoint.method === 'GET' ? 'bg-blue-500/10 text-blue-400' :
                                                endpoint.method === 'POST' ? 'bg-green-500/10 text-green-400' :
                                                'bg-gray-500/10 text-gray-400'
                                            }`}>
                                                {endpoint.method}
                                            </span>
                                            <span className="text-white text-sm font-mono">{endpoint.path}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">{endpoint.count.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`font-medium ${
                                            endpoint.avgTime > 1000 ? 'text-red-400' :
                                            endpoint.avgTime > 500 ? 'text-yellow-400' : 'text-green-400'
                                        }`}>
                                            {endpoint.avgTime}ms
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">{endpoint.maxTime}ms</td>
                                    <td className="px-6 py-4">
                                        <span className={
                                            parseFloat(endpoint.successRate) > 99 ? 'text-green-400' :
                                            parseFloat(endpoint.successRate) > 95 ? 'text-yellow-400' : 'text-red-400'
                                        }>
                                            {endpoint.successRate}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {endpoint.slowRequests > 0 ? (
                                            <span className="text-red-400">{endpoint.slowRequests}</span>
                                        ) : (
                                            <span className="text-green-400">0</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Database Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900 border border-gray-800 rounded-xl">
                    <div className="p-6 border-b border-gray-800">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <HardDrive className="h-5 w-5" />
                            Database Queries
                        </h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Total Queries</span>
                            <span className="text-white font-medium">{database.summary.totalQueries}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Slow Queries</span>
                            <span className="text-red-400 font-medium">{database.summary.slowQueries}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Avg Response Time</span>
                            <span className="text-white font-medium">{database.summary.avgResponseTime.toFixed(0)}ms</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Errors</span>
                            <span className="text-red-400 font-medium">{database.summary.errors}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl">
                    <div className="p-6 border-b border-gray-800">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <Wifi className="h-5 w-5" />
                            Top Slow Queries
                        </h2>
                    </div>
                    <div className="p-6 space-y-3">
                        {database.queries.slice(0, 5).map((query, index) => (
                            <div key={index} className="flex justify-between items-center">
                                <div className="flex-1">
                                    <div className="text-white text-sm font-medium">{query.model}.{query.operation}</div>
                                    <div className="text-gray-400 text-xs">{query.count} calls</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-red-400 font-medium">{query.avgTime.toFixed(0)}ms</div>
                                    <div className="text-gray-400 text-xs">{query.slowQueries} slow</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Error Rates */}
            {api.errorRates.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl">
                    <div className="p-6 border-b border-gray-800">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            High Error Rates
                        </h2>
                    </div>
                    <div className="p-6">
                        <div className="space-y-3">
                            {api.errorRates.slice(0, 5).map((error, index) => (
                                <div key={index} className="flex justify-between items-center p-3 bg-red-900/20 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium bg-red-500/10 text-red-400`}>
                                            {error.method}
                                        </span>
                                        <span className="text-white font-mono">{error.path}</span>
                                    </div>
                                    <span className="text-red-400 font-medium">{error.errorRate}% error rate</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}