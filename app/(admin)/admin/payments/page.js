'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, Download, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function PaymentsPage() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/payments');
            if (res.ok) {
                const data = await res.json();
                setPayments(data);
            }
        } catch (error) {
            console.error('Failed to load payments', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const filteredPayments = payments.filter(p => {
        const matchesSearch =
            p.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
            p.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            p.razorpayOrderId?.toLowerCase().includes(search.toLowerCase());

        const matchesFilter = filter === 'all' || p.status.toLowerCase() === filter;

        return matchesSearch && matchesFilter;
    });

    const exportCSV = () => {
        const headers = ['Order ID', 'User', 'Email', 'Amount', 'Status', 'Date'];
        const rows = filteredPayments.map(p => [
            p.razorpayOrderId,
            p.user?.name || 'Anonymous',
            p.user?.email || 'N/A',
            p.amount,
            p.status,
            new Date(p.createdAt).toLocaleDateString()
        ]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `payments_export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Payment Transactions</h1>

            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex gap-2">
                    {['all', 'paid', 'created'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${filter === f
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            {f === 'created' ? 'Pending' : f}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 w-64"
                        />
                    </div>
                    <button
                        onClick={exportCSV}
                        className="p-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 text-gray-300"
                        title="Export CSV"
                    >
                        <Download size={20} />
                    </button>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-indigo-500" size={32} />
                </div>
            ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left bg-gray-900">
                        <thead className="bg-gray-800 text-gray-400 text-xs uppercase font-medium">
                            <tr>
                                <th className="px-6 py-4">Order ID</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 text-sm text-gray-300">
                            {filteredPayments.map((payment) => (
                                <tr key={payment.id} className="hover:bg-gray-800/50">
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-xs text-gray-400">{payment.razorpayOrderId}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-white font-medium">{payment.user?.name || 'Anonymous'}</div>
                                        <div className="text-xs text-gray-500">{payment.user?.email}</div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-white">
                                        {formatCurrency(payment.amount)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {payment.status === 'PAID' ? (
                                            <span className="flex items-center gap-2 text-green-400 text-xs bg-green-900/20 px-2 py-1 rounded w-fit">
                                                <CheckCircle size={14} /> Paid
                                            </span>
                                        ) : payment.status === 'CREATED' ? (
                                            <span className="flex items-center gap-2 text-yellow-400 text-xs bg-yellow-900/20 px-2 py-1 rounded w-fit">
                                                <Clock size={14} /> Pending
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2 text-red-400 text-xs bg-red-900/20 px-2 py-1 rounded w-fit">
                                                <XCircle size={14} /> {payment.status}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-500">
                                        {new Date(payment.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
